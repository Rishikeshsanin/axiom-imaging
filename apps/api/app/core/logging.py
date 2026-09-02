from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger("axiom")


def log_event(event: str, *, severity: str = "INFO", **fields: Any) -> None:
    payload = {
        "timestamp": datetime.now(UTC).isoformat(),
        "event": event,
        "severity": severity,
        **fields,
    }
    getattr(logger, severity.lower(), logger.info)(json.dumps(payload, default=str))
