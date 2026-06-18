import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
SLICES_DIR = STORAGE_DIR / "slices"
WAVEFORM_DIR = STORAGE_DIR / "waveforms"

for directory in [STORAGE_DIR, UPLOAD_DIR, SLICES_DIR, WAVEFORM_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 22050
WAVEFORM_POINTS_PER_SECOND = 100
