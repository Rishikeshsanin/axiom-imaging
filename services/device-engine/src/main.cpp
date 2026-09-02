#include "imaging_device.hpp"
#include "thread_pool.hpp"

#include <arpa/inet.h>
#include <csignal>
#include <cstring>
#include <iostream>
#include <memory>
#include <netinet/in.h>
#include <sstream>
#include <string>
#include <sys/socket.h>
#include <thread>
#include <unistd.h>
#include <vector>

using axiom::DeviceFactory;
using axiom::ImagingDevice;
using axiom::ThreadPool;

namespace {
std::atomic<bool> running{true};

std::string json_value(const std::string& body, const std::string& key) {
    const std::string token = "\"" + key + "\":\"";
    const auto start = body.find(token);
    if (start == std::string::npos) return {};
    const auto value_start = start + token.size();
    const auto end = body.find('"', value_start);
    if (end == std::string::npos) return {};
    return body.substr(value_start, end - value_start);
}

std::shared_ptr<ImagingDevice> find_device(
    const std::vector<std::shared_ptr<ImagingDevice>>& devices,
    const std::string& identifier
) {
    for (const auto& device : devices) {
        if (device->identifier() == identifier) return device;
    }
    return nullptr;
}

std::string heartbeat_json(const ImagingDevice& device) {
    std::ostringstream out;
    out << "{\"type\":\"HEARTBEAT\",\"deviceId\":\"" << device.identifier()
        << "\",\"name\":\"" << device.name() << "\",\"modality\":\"" << device.modality()
        << "\",\"manufacturer\":\"Axiom Simulation Lab\",\"model\":\"SIM-2026\",\"location\":\""
        << device.location() << "\",\"status\":\"" << axiom::to_string(device.state())
        << "\",\"utilization\":" << device.utilization() << ",\"queueDepth\":" << device.queue_depth() << "}\n";
    return out.str();
}

void handle_client(int fd, const std::vector<std::shared_ptr<ImagingDevice>>& devices) {
    timeval timeout{3, 0};
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &timeout, sizeof(timeout));
    char buffer[2048] = {0};
    const auto received = recv(fd, buffer, sizeof(buffer) - 1, 0);
    if (received <= 0) {
        close(fd);
        return;
    }
    std::string request(buffer, static_cast<std::size_t>(received));
    const auto type = json_value(request, "type");

    if (type == "SUBSCRIBE") {
        while (running.load()) {
            for (const auto& device : devices) {
                const auto payload = heartbeat_json(*device);
                if (send(fd, payload.data(), payload.size(), MSG_NOSIGNAL) <= 0) {
                    close(fd);
                    return;
                }
            }
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        close(fd);
        return;
    }

    const auto device_id = json_value(request, "deviceId");
    auto device = find_device(devices, device_id);
    if (!device) {
        const std::string response = "{\"type\":\"ERROR\",\"message\":\"DEVICE_NOT_FOUND\"}\n";
        send(fd, response.data(), response.size(), MSG_NOSIGNAL);
        close(fd);
        return;
    }

    if (type == "INJECT_FAULT") {
        device->fault();
        const auto fault = json_value(request, "fault");
        std::string response = "{\"type\":\"ACK\",\"action\":\"INJECT_FAULT\",\"deviceId\":\"" + device_id + "\",\"fault\":\"" + fault + "\"}\n";
        send(fd, response.data(), response.size(), MSG_NOSIGNAL);
    } else if (type == "RECOVER") {
        device->recover();
        std::string response = "{\"type\":\"ACK\",\"action\":\"RECOVER\",\"deviceId\":\"" + device_id + "\"}\n";
        send(fd, response.data(), response.size(), MSG_NOSIGNAL);
    } else {
        const std::string response = "{\"type\":\"ERROR\",\"message\":\"UNKNOWN_COMMAND\"}\n";
        send(fd, response.data(), response.size(), MSG_NOSIGNAL);
    }
    close(fd);
}
}  // namespace

int main() {
    std::signal(SIGINT, [](int) { running.store(false); });
    std::signal(SIGTERM, [](int) { running.store(false); });

    std::vector<std::shared_ptr<ImagingDevice>> devices = {
        DeviceFactory::create("MR", "MRI-01", "Magnetic Resonance 01", "North Imaging Suite"),
        DeviceFactory::create("MR", "MRI-02", "Magnetic Resonance 02", "North Imaging Suite"),
        DeviceFactory::create("CT", "CT-01", "Computed Tomography 01", "Emergency Imaging"),
        DeviceFactory::create("CT", "CT-02", "Computed Tomography 02", "Main Imaging"),
        DeviceFactory::create("XR", "XRAY-01", "Digital X-Ray 01", "General Radiography"),
    };

    for (std::size_t i = 0; i < devices.size(); ++i) {
        devices[i]->set_utilization(static_cast<int>(28 + i * 11));
        devices[i]->set_queue_depth(static_cast<int>(i % 3));
    }

    ThreadPool pool(4);
    std::thread simulation([&] {
        int tick = 0;
        while (running.load()) {
            ++tick;
            const auto device_count = devices.size();
            for (std::size_t i = 0; i < device_count; ++i) {
                auto device = devices[i];
                pool.submit([device, tick, i, device_count] {
                    if (device->state() == axiom::DeviceState::Fault) return;
                    device->set_utilization(20 + static_cast<int>((tick * 7 + i * 13) % 71));
                    if (tick % 8 == 0 && i == static_cast<std::size_t>((tick / 8) % device_count)) {
                        try { device->start_scan(); } catch (...) {}
                    } else if (device->state() == axiom::DeviceState::Scanning && tick % 3 == 0) {
                        try { device->start_processing(); } catch (...) {}
                    } else if (device->state() == axiom::DeviceState::Processing && tick % 2 == 0) {
                        try { device->complete(); } catch (...) {}
                    }
                });
            }
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    });

    const int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        std::cerr << "socket creation failed\n";
        return 1;
    }
    int reuse = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));
    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(9300);
    if (bind(server_fd, reinterpret_cast<sockaddr*>(&address), sizeof(address)) < 0 || listen(server_fd, 16) < 0) {
        std::cerr << "failed to bind/listen on port 9300\n";
        close(server_fd);
        running.store(false);
        simulation.join();
        return 1;
    }

    std::cout << "Axiom C++ device engine listening on 0.0.0.0:9300\n";
    while (running.load()) {
        sockaddr_in client{};
        socklen_t length = sizeof(client);
        const int fd = accept(server_fd, reinterpret_cast<sockaddr*>(&client), &length);
        if (fd < 0) {
            if (!running.load()) break;
            continue;
        }
        std::thread(handle_client, fd, std::cref(devices)).detach();
    }

    close(server_fd);
    running.store(false);
    if (simulation.joinable()) simulation.join();
    pool.shutdown();
    return 0;
}
