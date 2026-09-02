from __future__ import annotations

import os
from dataclasses import dataclass


def _split_csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg://axiom:axiom@localhost:5432/axiom"
    )
    orthanc_url: str = os.getenv("ORTHANC_URL", "http://localhost:8042").rstrip("/")
    orthanc_public_url: str = os.getenv("ORTHANC_PUBLIC_URL", "http://localhost:8042").rstrip("/")
    orthanc_username: str = os.getenv("ORTHANC_USERNAME", "axiom")
    orthanc_password: str = os.getenv("ORTHANC_PASSWORD", "")
    cors_origins: tuple[str, ...] = _split_csv(
        os.getenv("AXIOM_CORS_ORIGINS", "http://localhost:3000")
    )
    max_upload_mb: int = int(os.getenv("AXIOM_MAX_UPLOAD_MB", "64"))
    device_engine_host: str = os.getenv("DEVICE_ENGINE_HOST", "")
    device_engine_port: int = int(os.getenv("DEVICE_ENGINE_PORT", "9300"))


settings = Settings()
