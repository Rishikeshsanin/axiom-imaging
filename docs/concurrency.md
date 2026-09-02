# C++ device-engine concurrency

The device engine is a separate C++20 process under `services/device-engine`.

## Shared state

Each `ImagingDevice` owns atomic state used by the telemetry loop:

- `DeviceState`
- utilization percentage
- queue depth

This keeps simple telemetry reads/writes lock-free while avoiding raw shared mutable integers.

## Thread pool

`ThreadPool` maintains:

- a `std::queue<std::function<void()>>`
- `std::mutex`
- `std::condition_variable`
- worker `std::thread` objects
- a guarded shutdown flag

Workers block on the condition variable until either work is available or shutdown begins. There is no busy-wait loop.

## Worker lifecycle

1. pool creates a fixed number of workers
2. `submit()` pushes a task under the queue mutex
3. one worker is notified
4. worker releases the mutex before executing the task
5. shutdown marks the pool as stopping
6. all workers are notified
7. workers drain queued work and exit
8. owner joins every worker

## Race/deadlock strategy

- queue mutation is protected by one mutex
- the mutex is never held while executing arbitrary work
- device telemetry uses atomics
- no nested locks are required by the current design
- shutdown is idempotent
- networking clients are handled independently from the simulation worker pool

The current engine is a reliability/systems simulation, not a real scanner controller.
