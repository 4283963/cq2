from pydantic import BaseModel
from typing import List, Optional


class WaveformData(BaseModel):
    audio_id: str
    duration: float
    sample_rate: int
    points_per_second: int
    peaks: List[float]
    rms: List[float]


class AudioFeatures(BaseModel):
    tempo: float
    spectral_centroid: float
    spectral_bandwidth: float
    zero_crossing_rate: float
    mfcc_mean: List[float]


class AudioInfo(BaseModel):
    id: str
    filename: str
    duration: float
    sample_rate: int
    channels: int
    format: str


class SliceInfo(BaseModel):
    audio_id: str
    index: int
    start_time: float
    end_time: float
    filename: str


class UploadResponse(BaseModel):
    audio_id: str
    filename: str
    duration: float
    sample_rate: int
    waveform: WaveformData
    features: AudioFeatures
