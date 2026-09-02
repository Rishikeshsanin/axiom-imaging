from __future__ import annotations

import heapq
from dataclasses import dataclass
from datetime import datetime, timezone

from app.domain.models import ImagingOrder

_PRIORITY_BASE = {"EMERGENCY": 300.0, "URGENT": 200.0, "ROUTINE": 100.0}


@dataclass(order=True, slots=True)
class QueueEntry:
    sort_key: float
    requested_at_ts: float
    order_id: str
    order: ImagingOrder


def scheduler_score(order: ImagingOrder, *, now: datetime | None = None) -> float:
    """Priority with aging: old work steadily gains weight and cannot starve forever."""
    now = now or datetime.now(timezone.utc)
    requested = order.requested_at
    if requested.tzinfo is None:
        requested = requested.replace(tzinfo=timezone.utc)
    wait_minutes = max(0.0, (now - requested).total_seconds() / 60.0)
    # One point per 10 minutes means a routine request eventually crosses an urgent request.
    return _PRIORITY_BASE.get(order.priority, 100.0) + wait_minutes / 10.0


def build_priority_heap(orders: list[ImagingOrder], *, now: datetime | None = None) -> list[QueueEntry]:
    now = now or datetime.now(timezone.utc)
    heap: list[QueueEntry] = []
    for order in orders:
        score = scheduler_score(order, now=now)
        requested = order.requested_at
        if requested.tzinfo is None:
            requested = requested.replace(tzinfo=timezone.utc)
        # heapq is a min-heap; negative score pops the highest effective priority first.
        heapq.heappush(heap, QueueEntry(-score, requested.timestamp(), order.id, order))
    return heap


def pop_next_order(orders: list[ImagingOrder], *, now: datetime | None = None) -> ImagingOrder | None:
    heap = build_priority_heap(orders, now=now)
    return heapq.heappop(heap).order if heap else None
