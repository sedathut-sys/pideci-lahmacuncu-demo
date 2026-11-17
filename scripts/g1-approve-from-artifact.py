"""G1: Store EXACTLY the 35 screenshots explicitly approved by the user.

Reads immutable GitHub Actions artifact 14110992304 (run 43588134987).
Never regenerates baselines; rejects any differing ZIP content.
Used only by the dedicated approval job in the isolated PR branch.
"""
from __future__ import annotations
import hashlib
import sys
from pathlib import Path
from zipfile import ZipFile

ARTIFACT_ID = 14110992304
RUN_ID = 43588134987
SOURCE_COMMIT = "346b3fa9bc35a41afb06a1583e75a7cb27fa90ff"
EXPECTED_DIGEST = "ed93c886e685a6a0c168378e9004e1ffcbf07b194accae6ad00334bf3df61f40"
ROOT = "test-results/visual-baseline-candidates/"
PROFILES = ("mobil-320px", "mobil-360px", "mobil-390px", "mobil-430px", "masaustu-1280px")
STATES = (
    "musteri-ana-alan.png", "musteri-menu-kartlari.png",
    "musteri-urun-secenekleri.png", "musteri-sepet.png",
    "panel-urun-listesi.png", "panel-urun-duzenleyici.png",
    "panel-form-alt-bolum.png",
)
EXPECTED_PATHS = sorted(ROOT + profile + "/" + state for profile in PROFILES for state in STATES)
APPROVAL_MARKER = Path("tests/visual/BASELINES_APPROVED.md")
BASELINES_DIR = Path("tests/visual/__snapshots__")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/g1-approve-from-artifact.py <artifact.zip>")
    if APPROVAL_MARKER.exists():
        raise SystemExit("Approved baseline marker already exists: refusing to overwrite.")
    archive = Path(sys.argv[1])
    with ZipFile(archive) as bundle:
        found = sorted(info.filename for info in bundle.infolist()
                       if info.filename.startswith(ROOT) and info.filename.endswith(".png"))
        if found != EXPECTED_PATHS:
            raise SystemExit("REJECTED: artifact must contain exactly 35 expected screenshot paths.")
        data = []
        aggregate = hashlib.sha256()
        for name in found:
            raw = bundle.read(name)
            if len(raw) < 1024 or raw[:8] != b"\x89PNG\r\n\x1a\n":
                raise SystemExit("REJECTED: invalid PNG file: " + name)
            aggregate.update(name.encode("utf-8") + b"\0" + len(raw).to_bytes(8, "big") + raw)
            data.append((name, raw))
    if aggregate.hexdigest() != EXPECTED_DIGEST:
        raise SystemExit("REJECTED: screenshots differ from the 35 user-approved images.")

    lines = [
        "# G1 - Kullanıcı tarafından onaylanan görsel referanslar",
        "",
        "Onay tarihi: 14 Kasım 2026",
        "",
        "Bu referanslar kullanıcı tarafından açıkça onaylanmış 35 görüntünün birebir bayt kopyasıdır.",
        "Yeni görüntü üretilmemiştir.",
        "",
        f"- Kaynak GitHub Actions çalışması: {RUN_ID}",
        f"- Kaynak artifact: {ARTIFACT_ID}",
        f"- Kaynak commit: {SOURCE_COMMIT}",
        f"- Onaylanan 35 PNG birleşik SHA-256: {EXPECTED_DIGEST}",
        "",
        "Referanslar yalnızca ayrı G1 test dalında tutulur.",
        "main, canlı yayın ve yayın kapısı bu onaydan etkilenmez.",
        "",
        "## PNG SHA-256 listesi",
        "",
    ]
    for name, raw in data:
        relative = name[len(ROOT):]
        dest = BASELINES_DIR / relative
        if dest.exists():
            raise SystemExit("REJECTED: baseline path already exists: " + str(dest))
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        lines.append(f"- {relative}: {hashlib.sha256(raw).hexdigest()}")
    APPROVAL_MARKER.parent.mkdir(parents=True, exist_ok=True)
    APPROVAL_MARKER.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Verified approved aggregate {aggregate.hexdigest()}, wrote {len(data)} exact PNGs.")
    print("Wrote baseline approval marker. No application files were changed.")


if __name__ == "__main__":
    main()
