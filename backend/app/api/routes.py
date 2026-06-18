from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List

from app.services.audio_service import AudioService
from app.models import UploadResponse, WaveformData, AudioFeatures, AudioInfo, SliceInfo

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    try:
        content = await file.read()
        result = AudioService.process_upload(content, file.filename)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
