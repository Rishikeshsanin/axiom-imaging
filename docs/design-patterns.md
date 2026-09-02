# Design patterns used by Axiom Imaging

Patterns are used only where they solve a concrete design problem.

## Factory — device construction

`DeviceFactory` creates MRI, CT and X-ray implementations behind the common `ImagingDevice` abstraction. The simulation bootstrap does not need device-specific constructor logic scattered through `main.cpp`.

## State — device lifecycle

`ImagingDevice` exposes explicit operations (`reserve`, `start_scan`, `start_processing`, `complete`, `fault`, `recover`) around a defined `DeviceState`. Unavailable states reject normal scan-state transitions.

## Strategy — scheduling

The backend scheduler separates request priority from device selection:

- priority + waiting-time aging selects the next imaging order
- load-aware selection chooses a compatible device using queue depth and utilization

This is documented and tested in `apps/api/app/services/scheduler.py`.

## Observer/event model — telemetry propagation

The C++ engine publishes heartbeat information over a subscription connection. FastAPI acts as the consumer and persists the events; dashboard/device pages observe that backend state.

## Repository/service separation

Patient/study queries live in repository modules, while ingestion, quality validation, Orthanc interaction, scheduling and device IPC live in service modules. This keeps HTTP route code from owning every business concern.
