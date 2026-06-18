from typing import Dict, Any, List
from pathlib import Path

from app.core.config import SAMPLE_RATE, WAVEFORM_POINTS_PER_SECOND, SLICES_DIR, UPLOAD_DIR
from app.core.audio_processor import (
    load_audio,
    get_audio_info,
    extract_waveform,
    extract_features,
    slice_audio_by_seconds,
)
from app.services.storage_service import StorageService
from app.models import WaveformData, AudioFeatures, AudioInfo, UploadResponse, SliceInfo


class AudioService:
    @staticmethod
    def generate_id() -> str:
        return StorageService.generate_id()

    @staticmethod
    def process_upload_from_path(tmp_path: str, filename: str, audio_id: str) -> UploadResponse:
        file_path = StorageService.move_tmp_to_storage(tmp_path, filename, audio_id)
        
        y, sr = load_audio(file_path, sr=SAMPLE_RATE)
        
        audio_info_data = get_audio_info(y, sr)
        
        waveform_data = extract_waveform(y, sr, WAVEFORM_POINTS_PER_SECOND)
        
        features_data = extract_features(y, sr)
        
        slices_info = slice_audio_by_seconds(y, sr, str(SLICES_DIR), audio_id)
        
        metadata = {
            "id": audio_id,
            "filename": filename,
            "duration": audio_info_data["duration"],
            "sample_rate": audio_info_data["sample_rate"],
            "channels": audio_info_data["channels"],
            "format": Path(filename).suffix.lstrip("."),
            "slices_count": len(slices_info),
        }
        StorageService.save_metadata(audio_id, metadata)
        StorageService.save_waveform(audio_id, waveform_data)
        
        waveform = WaveformData(
            audio_id=audio_id,
            duration=audio_info_data["duration"],
            sample_rate=sr,
            points_per_second=WAVEFORM_POINTS_PER_SECOND,
            peaks=waveform_data["peaks"],
            rms=waveform_data["rms"],
        )
        
        features = AudioFeatures(**features_data)
        
        return UploadResponse(
            audio_id=audio_id,
            filename=filename,
            duration=audio_info_data["duration"],
            sample_rate=sr,
            waveform=waveform,
            features=features,
        )
    
    @staticmethod
    def get_audio_info(audio_id: str) -> AudioInfo:
        metadata = StorageService.load_metadata(audio_id)
        if not metadata:
            raise ValueError(f"Audio not found: {audio_id}")
        
        return AudioInfo(
            id=metadata["id"],
            filename=metadata["filename"],
            duration=metadata["duration"],
            sample_rate=metadata["sample_rate"],
            channels=metadata["channels"],
            format=metadata["format"],
        )
    
    @staticmethod
    def get_waveform(audio_id: str) -> WaveformData:
        waveform_data = StorageService.load_waveform(audio_id)
        metadata = StorageService.load_metadata(audio_id)
        
        if not waveform_data or not metadata:
            raise ValueError(f"Audio not found: {audio_id}")
        
        return WaveformData(
            audio_id=audio_id,
            duration=metadata["duration"],
            sample_rate=metadata["sample_rate"],
            points_per_second=WAVEFORM_POINTS_PER_SECOND,
            peaks=waveform_data["peaks"],
            rms=waveform_data["rms"],
        )
    
    @staticmethod
    def get_features(audio_id: str) -> AudioFeatures:
        if not StorageService.audio_exists(audio_id):
            raise ValueError(f"Audio not found: {audio_id}")
        
        file_path = next(UPLOAD_DIR.glob(f"{audio_id}.*"), None)
        if file_path and file_path.suffix != ".json":
            y, sr = load_audio(str(file_path), sr=SAMPLE_RATE)
            features_data = extract_features(y, sr)
            return AudioFeatures(**features_data)
        
        raise ValueError(f"Audio file not found: {audio_id}")
    
    @staticmethod
    def get_slices(audio_id: str) -> List[SliceInfo]:
        if not StorageService.audio_exists(audio_id):
            raise ValueError(f"Audio not found: {audio_id}")
        
        slices_data = StorageService.list_slices(audio_id)
        
        metadata = StorageService.load_metadata(audio_id)
        duration = metadata["duration"] if metadata else 0
        
        slices = []
        for s in slices_data:
            idx = s["index"]
            slices.append(SliceInfo(
                audio_id=audio_id,
                index=idx,
                start_time=float(idx),
                end_time=float(min(idx + 1, duration)),
                filename=s["filename"],
            ))
        
        return slices
    
    @staticmethod
    def get_slice_file(audio_id: str, slice_index: int) -> str:
        if not StorageService.audio_exists(audio_id):
            raise ValueError(f"Audio not found: {audio_id}")
        
        file_path = StorageService.get_slice_path(audio_id, slice_index)
        if not file_path:
            raise ValueError(f"Slice not found: {audio_id}/{slice_index}")
        
        return file_path
    
    @staticmethod
    def get_audio_file(audio_id: str) -> tuple[str, str]:
        if not StorageService.audio_exists(audio_id):
            raise ValueError(f"Audio not found: {audio_id}")
        
        file_path = StorageService.get_audio_file_path(audio_id)
        if not file_path:
            raise ValueError(f"Audio file not found: {audio_id}")
        
        metadata = StorageService.load_metadata(audio_id)
        filename = metadata.get("filename", "audio.mp3")
        
        return file_path, filename
