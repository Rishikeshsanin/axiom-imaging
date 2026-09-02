from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/axiom-test.sqlite3")
os.environ.setdefault("ORTHANC_URL", "http://127.0.0.1:9")
