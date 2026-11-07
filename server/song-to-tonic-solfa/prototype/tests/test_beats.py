import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from beats import find_beats  # noqa: E402

SR = 22050


def test_click_track_tempo_and_beats():
    # A struck 1 kHz click every 0.5 s (120 bpm) for 12 s.
    audio = np.zeros(SR * 12, dtype=np.float32)
    t = np.arange(2000) / SR
    click = np.sin(2 * np.pi * 1000 * t) * np.exp(-t * 40)
    for k in range(24):
        start = int(k * 0.5 * SR)
        audio[start:start + 2000] += click
    result = find_beats(audio, SR)
    assert result["tempo_bpm"] == pytest.approx(120, abs=3)
    spacing = np.diff(result["beats"])
    assert np.median(spacing) == pytest.approx(0.5, abs=0.03)
