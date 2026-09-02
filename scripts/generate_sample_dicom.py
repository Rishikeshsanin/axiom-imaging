from __future__ import annotations

import shutil
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "sample-data" / "axiom-demo-ct-study"
SLICE_COUNT = 12


def pad_even(data: bytes, pad: bytes = b" ") -> bytes:
    return data if len(data) % 2 == 0 else data + pad


def text_value(value: str, vr: str) -> bytes:
    raw = value.encode("ascii")
    return pad_even(raw, b"\x00" if vr == "UI" else b" ")


def element(group: int, elem: int, vr: str, value: bytes) -> bytes:
    tag = struct.pack("<HH", group, elem)
    long_vr = {"OB", "OD", "OF", "OL", "OV", "OW", "SQ", "UC", "UR", "UT", "UN"}
    if vr in long_vr:
        return tag + vr.encode("ascii") + b"\x00\x00" + struct.pack("<I", len(value)) + value
    return tag + vr.encode("ascii") + struct.pack("<H", len(value)) + value


def txt(group: int, elem: int, vr: str, value: str) -> bytes:
    return element(group, elem, vr, text_value(value, vr))


def us(group: int, elem: int, value: int) -> bytes:
    return element(group, elem, "US", struct.pack("<H", value))


def build(slice_number: int) -> bytes:
    sop_class = "1.2.840.10008.5.1.4.1.1.2"  # CT Image Storage
    study_uid = "1.2.826.0.1.3680043.10.543.202609020001"
    series_uid = "1.2.826.0.1.3680043.10.543.202609020002"
    frame_uid = "1.2.826.0.1.3680043.10.543.202609020004"
    sop_uid = f"1.2.826.0.1.3680043.10.543.202609020003.{slice_number:03d}"
    implementation_uid = "1.2.826.0.1.3680043.10.543.202609020099"

    meta_parts = [
        element(0x0002, 0x0001, "OB", b"\x00\x01"),
        txt(0x0002, 0x0002, "UI", sop_class),
        txt(0x0002, 0x0003, "UI", sop_uid),
        txt(0x0002, 0x0010, "UI", "1.2.840.10008.1.2.1"),
        txt(0x0002, 0x0012, "UI", implementation_uid),
        txt(0x0002, 0x0013, "SH", "AXIOM_0_1"),
    ]
    meta_body = b"".join(meta_parts)
    meta = element(0x0002, 0x0000, "UL", struct.pack("<I", len(meta_body))) + meta_body

    width = height = 64
    z_mm = (slice_number - 1) * 2.5
    pixels = bytearray()
    for y in range(height):
        for x in range(width):
            dx = x - width / 2 + (slice_number - (SLICE_COUNT + 1) / 2) * 0.35
            dy = y - height / 2
            radius = (dx * dx + dy * dy) ** 0.5
            ring = 230 if 12 < radius < 18 else 0
            value = max(0, min(4095, int(2850 - radius * 75 + x * 7 + ring + slice_number * 8)))
            pixels += struct.pack("<H", value)

    dataset = b"".join([
        txt(0x0008, 0x0005, "CS", "ISO_IR 100"),
        txt(0x0008, 0x0008, "CS", "ORIGINAL\\PRIMARY\\AXIAL"),
        txt(0x0008, 0x0016, "UI", sop_class),
        txt(0x0008, 0x0018, "UI", sop_uid),
        txt(0x0008, 0x0020, "DA", "20260902"),
        txt(0x0008, 0x0021, "DA", "20260902"),
        txt(0x0008, 0x0030, "TM", "143000"),
        txt(0x0008, 0x0031, "TM", "143000"),
        txt(0x0008, 0x0050, "SH", "AXIOM-DEMO-001"),
        txt(0x0008, 0x0060, "CS", "CT"),
        txt(0x0008, 0x0070, "LO", "Axiom Synthetic Lab"),
        txt(0x0008, 0x0080, "LO", "Axiom Research Imaging Center"),
        txt(0x0008, 0x0090, "PN", "DEMO^REQUESTER"),
        txt(0x0008, 0x1030, "LO", "Synthetic CT Head Demo"),
        txt(0x0008, 0x103E, "LO", "AXIAL SYNTHETIC"),
        txt(0x0010, 0x0010, "PN", "DEMO^PATIENT"),
        txt(0x0010, 0x0020, "LO", "P-10042"),
        txt(0x0010, 0x0030, "DA", "19990101"),
        txt(0x0010, 0x0040, "CS", "O"),
        txt(0x0018, 0x0015, "CS", "HEAD"),
        txt(0x0018, 0x0050, "DS", "2.5"),
        txt(0x0018, 0x0088, "DS", "2.5"),
        txt(0x0018, 0x5100, "CS", "HFS"),
        txt(0x0020, 0x000D, "UI", study_uid),
        txt(0x0020, 0x000E, "UI", series_uid),
        txt(0x0020, 0x0010, "SH", "AXIOM-DEMO"),
        txt(0x0020, 0x0011, "IS", "1"),
        txt(0x0020, 0x0012, "IS", "1"),
        txt(0x0020, 0x0013, "IS", str(slice_number)),
        txt(0x0020, 0x0032, "DS", f"0\\0\\{z_mm:.1f}"),
        txt(0x0020, 0x0037, "DS", "1\\0\\0\\0\\1\\0"),
        txt(0x0020, 0x0052, "UI", frame_uid),
        txt(0x0020, 0x1041, "DS", f"{z_mm:.1f}"),
        us(0x0028, 0x0002, 1),
        txt(0x0028, 0x0004, "CS", "MONOCHROME2"),
        us(0x0028, 0x0010, height),
        us(0x0028, 0x0011, width),
        txt(0x0028, 0x0030, "DS", "0.8\\0.8"),
        us(0x0028, 0x0100, 16),
        us(0x0028, 0x0101, 12),
        us(0x0028, 0x0102, 11),
        us(0x0028, 0x0103, 0),
        txt(0x0028, 0x1050, "DS", "1200"),
        txt(0x0028, 0x1051, "DS", "2400"),
        txt(0x0028, 0x1052, "DS", "-1024"),
        txt(0x0028, 0x1053, "DS", "1"),
        element(0x7FE0, 0x0010, "OW", bytes(pixels)),
    ])
    return b"\x00" * 128 + b"DICM" + meta + dataset


def main() -> None:
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    for slice_number in range(1, SLICE_COUNT + 1):
        path = OUTPUT_DIR / f"CT_{slice_number:03d}.dcm"
        path.write_bytes(build(slice_number))
    total = sum(path.stat().st_size for path in OUTPUT_DIR.glob("*.dcm"))
    print(f"Wrote synthetic DICOM study: {OUTPUT_DIR} ({SLICE_COUNT} slices, {total} bytes)")


if __name__ == "__main__":
    main()
