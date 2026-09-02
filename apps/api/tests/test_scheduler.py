from datetime import datetime, timedelta, timezone

from app.domain.models import ImagingOrder
from app.services.scheduler import pop_next_order, scheduler_score


def make_order(order_id: str, priority: str, minutes_ago: int) -> ImagingOrder:
    return ImagingOrder(
        id=order_id,
        patient_id="patient",
        requested_modality="CT",
        priority=priority,
        requested_by="tester",
        status="ORDERED",
        requested_at=datetime.now(timezone.utc) - timedelta(minutes=minutes_ago),
    )


def test_emergency_beats_newer_routine():
    routine = make_order("routine", "ROUTINE", 5)
    emergency = make_order("emergency", "EMERGENCY", 0)
    assert pop_next_order([routine, emergency]).id == "emergency"


def test_aging_increases_scheduler_score():
    new = make_order("new", "ROUTINE", 0)
    old = make_order("old", "ROUTINE", 180)
    assert scheduler_score(old) > scheduler_score(new)
