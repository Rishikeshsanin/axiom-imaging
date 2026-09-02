# Axiom C++20 Device Engine

A separate systems component that simulates a small imaging fleet for the research prototype. It is intentionally separated from the web UI and FastAPI process.

Implemented engineering concepts:

- abstract `ImagingDevice` base type with MRI / CT / X-ray implementations
- `DeviceFactory` construction
- explicit device-state transitions
- atomics for telemetry state
- a condition-variable-backed thread pool (no busy waiting)
- TCP JSON-line IPC on port `9300`
- subscription-based heartbeat telemetry
- controlled fault and recovery commands
- graceful worker shutdown

The FastAPI service subscribes to the engine and persists heartbeat state into PostgreSQL. Fault injection remains a simulation/reliability-testing feature and is never represented as clinical functionality.
