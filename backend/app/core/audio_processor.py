import numpy as np
import librosa
import soundfile as sf
from pathlib import Path
from typing import Tuple, List, Dict, Any

from app.core.config import SAMPLE_RATE, WAVEFORM_POINTS_PER_SECOND


def load_audio(file_path: str, sr: int = SAMPLE_RATE) -> Tuple[np.ndarray, int]:
    y, sr = librosa.load(file_path, sr=sr, mono=True)
    return y, sr


def get_audio_info(y: np.ndarray, sr: int) -> Dict[str, Any]:
    duration = librosa.get_duration(y=y, sr=sr)
    channels = 1 if len(y.shape) == 1 else y.shape[0]
    return {
        "duration": float(duration),
        "sample_rate": sr,
        "channels": channels,
        "samples": len(y),
    }


def extract_waveform(y: np.ndarray, sr: int, points_per_second: int = WAVEFORM_POINTS_PER_SECOND) -> Dict[str, List[float]]:
    duration = len(y) / sr
    total_points = int(duration * points_per_second)
    
    if total_points == 0:
        return {"peaks": [], "rms": []}
    
    samples_per_point = len(y) // total_points
    
    peaks = []
    rms_values = []
    
    for i in range(total_points):
        start = i * samples_per_point
        end = min(start + samples_per_point, len(y))
        segment = y[start:end]
        
        peak = float(np.max(np.abs(segment))) if len(segment) > 0 else 0.0
        rms = float(np.sqrt(np.mean(segment ** 2))) if len(segment) > 0 else 0.0
        
        peaks.append(peak)
        rms_values.append(rms)
    
    max_peak = max(peaks) if peaks else 1.0
    if max_peak > 0:
        peaks = [p / max_peak for p in peaks]
        rms_values = [r / max_peak for r in rms_values]
    
    return {
        "peaks": peaks,
        "rms": rms_values,
    }


def extract_features(y: np.ndarray, sr: int) -> Dict[str, Any]:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    zero_crossing_rate = librosa.feature.zero_crossing_rate(y)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    
    return {
        "tempo": float(tempo),
        "spectral_centroid": float(np.mean(spectral_centroid)),
        "spectral_bandwidth": float(np.mean(spectral_bandwidth)),
        "zero_crossing_rate": float(np.mean(zero_crossing_rate)),
        "mfcc_mean": [float(v) for v in np.mean(mfcc, axis=1)],
    }


def slice_audio_by_seconds(y: np.ndarray, sr: int, output_dir: str, audio_id: str) -> List[Dict[str, Any]]:
    output_path = Path(output_dir) / audio_id
    output_path.mkdir(parents=True, exist_ok=True)
    
    duration = len(y) / sr
    num_slices = int(np.ceil(duration))
    
    slices_info = []
    
    for i in range(num_slices):
        start_sample = i * sr
        end_sample = min((i + 1) * sr, len(y))
        
        slice_data = y[start_sample:end_sample]
        
        slice_filename = f"slice_{i:04d}.wav"
        slice_filepath = output_path / slice_filename
        
        sf.write(str(slice_filepath), slice_data, sr)
        
        slices_info.append({
            "index": i,
            "start_time": float(i),
            "end_time": float(min(i + 1, duration)),
            "filename": slice_filename,
            "audio_id": audio_id,
        })
    
    return slices_info


def get_slice_filepath(audio_id: str, slice_index: int, slices_dir: str) -> str:
    slice_filename = f"slice_{slice_index:04d}.wav"
    return str(Path(slices_dir) / audio_id / slice_filename)


def denoise_audio(
    y: np.ndarray,
    sr: int,
    strength: float = 0.5,
    n_fft: int = 2048,
    hop_length: int = 512,
) -> np.ndarray:
    if strength <= 0.0:
        return y
    strength = min(strength, 1.0)

    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude = np.abs(stft)
    phase = np.angle(stft)

    frame_rms = np.sqrt(np.mean(magnitude ** 2, axis=0))
    quietest_count = max(1, int(len(frame_rms) * 0.1))
    quiet_indices = np.argsort(frame_rms)[:quietest_count]
    noise_profile = np.mean(magnitude[:, quiet_indices], axis=1, keepdims=True)

    threshold = noise_profile * (1.0 + strength * 2.0)
    gain = np.ones_like(magnitude)
    below = magnitude < threshold
    floor = 1.0 - strength * 0.95
    soft_ratio = (magnitude / threshold) * (1.0 - strength * 0.8)
    gain = np.where(below, floor * soft_ratio, 1.0)

    cleaned_magnitude = magnitude * gain
    cleaned_stft = cleaned_magnitude * np.exp(1j * phase)
    y_denoised = librosa.istft(cleaned_stft, hop_length=hop_length, length=len(y))

    return y_denoised
