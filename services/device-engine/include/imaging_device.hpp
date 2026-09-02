#pragma once

#include <algorithm>
#include <atomic>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>

namespace axiom {

enum class DeviceState { Offline, Ready, Reserved, Scanning, Processing, Fault, Maintenance };

inline std::string to_string(DeviceState state) {
    switch (state) {
        case DeviceState::Offline: return "OFFLINE";
        case DeviceState::Ready: return "READY";
        case DeviceState::Reserved: return "RESERVED";
        case DeviceState::Scanning: return "SCANNING";
        case DeviceState::Processing: return "PROCESSING";
        case DeviceState::Fault: return "FAULT";
        case DeviceState::Maintenance: return "MAINTENANCE";
    }
    return "OFFLINE";
}

class ImagingDevice {
public:
    ImagingDevice(std::string identifier, std::string name, std::string modality, std::string location)
        : identifier_(std::move(identifier)), name_(std::move(name)), modality_(std::move(modality)),
          location_(std::move(location)), state_(DeviceState::Ready), utilization_(0), queue_depth_(0) {}
    virtual ~ImagingDevice() = default;

    virtual std::string type_name() const = 0;

    const std::string& identifier() const { return identifier_; }
    const std::string& name() const { return name_; }
    const std::string& modality() const { return modality_; }
    const std::string& location() const { return location_; }
    DeviceState state() const { return state_.load(); }
    int utilization() const { return utilization_.load(); }
    int queue_depth() const { return queue_depth_.load(); }

    void reserve() { transition(DeviceState::Reserved); }
    void start_scan() { transition(DeviceState::Scanning); }
    void start_processing() { transition(DeviceState::Processing); }
    void complete() { transition(DeviceState::Ready); }
    void fault() { state_.store(DeviceState::Fault); }
    void recover() { state_.store(DeviceState::Ready); }

    void set_utilization(int value) { utilization_.store(std::clamp(value, 0, 100)); }
    void set_queue_depth(int value) { queue_depth_.store(std::max(value, 0)); }

private:
    void transition(DeviceState next) {
        const auto current = state();
        if (current == DeviceState::Fault || current == DeviceState::Maintenance || current == DeviceState::Offline) {
            throw std::logic_error("device cannot transition while unavailable");
        }
        state_.store(next);
    }

    std::string identifier_;
    std::string name_;
    std::string modality_;
    std::string location_;
    std::atomic<DeviceState> state_;
    std::atomic<int> utilization_;
    std::atomic<int> queue_depth_;
};

class MRI final : public ImagingDevice {
public:
    using ImagingDevice::ImagingDevice;
    std::string type_name() const override { return "MRI"; }
};

class CTScanner final : public ImagingDevice {
public:
    using ImagingDevice::ImagingDevice;
    std::string type_name() const override { return "CT"; }
};

class XRayDevice final : public ImagingDevice {
public:
    using ImagingDevice::ImagingDevice;
    std::string type_name() const override { return "XRAY"; }
};

class DeviceFactory {
public:
    static std::shared_ptr<ImagingDevice> create(
        const std::string& modality,
        const std::string& identifier,
        const std::string& name,
        const std::string& location
    ) {
        if (modality == "MR" || modality == "MRI") return std::make_shared<MRI>(identifier, name, "MR", location);
        if (modality == "CT") return std::make_shared<CTScanner>(identifier, name, "CT", location);
        if (modality == "XR" || modality == "XRAY") return std::make_shared<XRayDevice>(identifier, name, "XR", location);
        throw std::invalid_argument("unsupported imaging modality");
    }
};

}  // namespace axiom
