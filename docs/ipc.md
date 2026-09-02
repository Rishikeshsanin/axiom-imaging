# TCP JSON-line IPC

Axiom runs the C++20 device engine separately from FastAPI. Communication uses TCP on port `9300` with one JSON object per line.

## Subscription

FastAPI connects to the engine and sends:

```json
{"type":"SUBSCRIBE"}
```

The engine then streams heartbeat records such as:

```json
{"type":"HEARTBEAT","deviceId":"CT-02","name":"Computed Tomography 02","modality":"CT","status":"READY","utilization":61,"queueDepth":1}
```

FastAPI persists those fields into the `devices` table. The web UI reads the database/API state; it does not fabricate telemetry in JavaScript.

## Commands

Controlled fault injection:

```json
{"type":"INJECT_FAULT","deviceId":"MRI-02","fault":"SCANNER_OVERHEAT"}
```

Recovery:

```json
{"type":"RECOVER","deviceId":"MRI-02"}
```

The engine returns a newline-delimited acknowledgement. The API records the associated audit/alert event.

## Reconnection

The FastAPI bridge reconnects after socket or timeout failures with a short delay. Device health is independently checked through TCP reachability.

This protocol is intentionally small and stable for the research prototype. It can later evolve to gRPC or a message broker without changing the DICOM/PACS core.
