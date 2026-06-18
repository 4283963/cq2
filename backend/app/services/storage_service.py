import uuid
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.core.config import UPLOAD_DIR, SLICES_DIR, WAVEFORM_DIR
from app.core.audio_processor import (
    load_audio,
    get_audio_info,
    extract_waveform,
    extract_features,
    slice_audio_by_seconds,
    get_slice_filepath,
)
from app.models import WaveformData, AudioFeatures, AudioInfo, SliceInfo


class StorageService:
    @staticmethod
    def generate_id() -> str:
        return str(uuid.uuid4())
    
    @staticmethod
    def save_uploaded_file(file_content: bytes, filename: str, audio_id: str) -> str:
        ext = Path(filename).suffix or ".mp3"
        saved_filename = f"{audio_id}{ext}"
        file_path = UPLOAD_DIR / saved_filename
        file_path.write_bytes(file_content)
        return str(file_path)
    
    @staticmethod
    def save_waveform(audio_id: str, waveform_data: dict) -> None:
        file_path = WAVEFORM_DIR / f"{audio_id}.json"
        file_path.write_text(json.dumps(waveform_data))
    
    @staticmethod
    def load_waveform(audio_id: str) -> Optional[dict]:
        file_path = WAVEFORM_DIR / f"{audio_id}.json"
        if file_path.exists():
            return json.loads(file_path.read_text())
        return None
    
    @staticmethod
    def save_metadata(audio_id: str, metadata: dict) -> None:
        file_path = UPLOAD_DIR / f"{audio_id}_meta.json"
        file_path.write_text(json.dumps(metadata))
    
    @staticmethod
    def load_metadata(audio_id: str) -> Optional[dict]:
        file_path = UPLOAD_DIR / f"{audio_id}_meta.json"
        if file_path.exists():
            return json.loads(file_path.read_text())
        return None
    
    @staticmethod
    def audio_exists(audio_id: str) -> bool:
        meta = StorageService.load_metadata(audio_id)
        return meta is not None
    
    @staticmethod
    def get_slice_path(audio_id: str, slice_index: int) -> Optional[str]:
        path = get_slice_filepath(audio_id, slice_index, str(SLICES_DIR))
        if Path(path).exists():
            return path
        return None
    
    @staticmethod
    def list_slices(audio_id: str) -> List[Dict[str, Any]]:
        slices_dir = SLICES_DIR / audio_id
        if not slices_dir.exists():
            return []
        
        slices = []
        for file in sorted(slices_dir.glob("slice_*.wav")):
            idx = int(file.stem.split("_")[1])
            slices.append({
                "index": idx,
                "filename": file.name,
                "audio_id": audio_id,
            })
        return slices
    
    @staticmethod
    def get_audio_file_path(audio_id: str) -> Optional[str]:
        meta = StorageService.load_metadata(audio_id)
        if not meta:
            return None
        
        fmt = meta.get("format", "mp3")
        file_path = UPLOAD_DIR / f"{audio_id}.{fmt}"
        if file_path.exists():
            return str(file_path)
        
        for ext in ["mp3", "wav", "ogg", "flac", "m4a"]:
            p = UPLOAD_DIR / f"{audio_id}.{ext}"
            if p.exists():
                return str(p)
        
        return None
