from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class AxiomError(Exception):
    code: str
    message: str
    status_code: int = 400
    details: dict[str, Any] | None = None

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"
