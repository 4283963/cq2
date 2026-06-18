import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List

from app.services.audio_service import AudioService
from app.models import UploadResponse, WaveformData, AudioFeatures, AudioInfo, SliceInfo, DenoiseResponse
from app.core.config import UPLOAD_DIR

router = APIRouter()

CHUNK_SIZE = 1024 * 1024
  

@router.post("/upload", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    tmp_path = None
    try:
        audio_id = AudioService.generate_id()
        ext = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
  
        fd, tmp_path = tempfile.mkstemp(suffix=ext, dir=str(UPLOAD_DIR))
        try:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                os.write(fd, chunk)
        finally:
            os.close(fd)

        result = AudioService.process_upload_from_path(tmp_path, file.filename, audio_id)
        tmp_path = None
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/{audio_id}/info", response_model=AudioInfo)
async def get_audio_info(audio_id: str):
    try:
        return AudioService.get_audio_info(audio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{audio_id}/waveform", response_model=WaveformData)
async def get_waveform(audio_id: str):
    try:
        return AudioService.get_waveform(audio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{audio_id}/features", response_model=AudioFeatures)
async def get_features(audio_id: str):
    try:
        return AudioService.get_features(audio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{audio_id}/slices", response_model=List[SliceInfo])
async def get_slices(audio_id: str):
    try:
        return AudioService.get_slices(audio_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{audio_id}/slices/{slice_index}")
async def get_slice_file(audio_id: str, slice_index: int):
    try:
        file_path = AudioService.get_slice_file(audio_id, slice_index)
        return FileResponse(
            path=file_path,
            media_type="audio/wav",
            filename=f"slice_{slice_index:04d}.wav"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{audio_id}/file")
async def get_audio_file(audio_id: str):
    try:
        file_path, filename = AudioService.get_audio_file(audio_id)
        media_type = "audio/mpeg"
        if filename.endswith(".wav"):
            media_type = "audio/wav"
        elif filename.endswith(".ogg"):
            media_type = "audio/ogg"
        elif filename.endswith(".flac"):
            media_type = "audio/flac"
        return FileResponse(
            path=file_path,
            media_type=media_type,
            filename=filename
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{audio_id}/denoise", response_model=DenoiseResponse)
async def denoise_audio(audio_id: str, strength: float = 0.5):
    try:
        strength = max(0.0, min(1.0, strength))
        return AudioService.denoise(audio_id, strength)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
