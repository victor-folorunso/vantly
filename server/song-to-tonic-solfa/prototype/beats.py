"""Beat times for writing the melody as staff notation.

Probabilistic, like the key estimate: librosa's beat tracker on the full mix (drums and
accompaniment carry the beat better than the voice). Only staff notation and its exports use
it; the solfa sheet, the synth and playback keep the exact note times.
"""

from __future__ import annotations

import numpy as np

ANALYSIS_RATE = 22050


def find_beats(mix: np.ndarray, sr: int) -> dict:
    """{"tempo_bpm", "beats"}: the tempo and every beat time in seconds (empty if none found)."""
    import librosa  # heavy; only imported when a song is processed

    mono = mix.mean(axis=1) if mix.ndim > 1 else mix
    audio = librosa.resample(mono.astype(np.float32), orig_sr=sr, target_sr=ANALYSIS_RATE)
    tempo, frames = librosa.beat.beat_track(y=audio, sr=ANALYSIS_RATE, units="frames")
    times = librosa.frames_to_time(frames, sr=ANALYSIS_RATE)
    return {"tempo_bpm": round(float(np.atleast_1d(tempo)[0]), 1), "beats": [round(float(t), 3) for t in times]}
