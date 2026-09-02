#include "imaging_device.hpp"
#include "thread_pool.hpp"

#include <atomic>
#include <cassert>
#include <chrono>
#include <thread>

int main() {
    auto ct = axiom::DeviceFactory::create("CT", "CT-T", "Test CT", "Lab");
    assert(ct->modality() == "CT");
    assert(axiom::to_string(ct->state()) == "READY");
    ct->start_scan();
    assert(axiom::to_string(ct->state()) == "SCANNING");
    ct->fault();
    assert(axiom::to_string(ct->state()) == "FAULT");
    ct->recover();
    assert(axiom::to_string(ct->state()) == "READY");

    std::atomic<int> completed{0};
    {
        axiom::ThreadPool pool(2);
        for (int i = 0; i < 10; ++i) pool.submit([&completed] { completed.fetch_add(1); });
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }
    assert(completed.load() == 10);
    return 0;
}
