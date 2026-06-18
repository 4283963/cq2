import React, { useState, useCallback } from 'react';
import AudioUploader from './components/AudioUploader';
import AudioTrack from './components/AudioTrack';
import Timeline from './components/Timeline';
import TransportControls from './components/TransportControls';
import AudioInfoPanel from './components/AudioInfoPanel';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { uploadAudio, getAudioFileUrl, denoiseAudio } from './api/audioApi';
import './App.css';

const TRACK_COLORS = [
  '#6c63ff',
  '#ff6b6b',
  '#4ecdc4',
  '#ffd93d',
  '#6bcb77',
  '#ff9a3c',
];

function App() {
  const [tracks, setTracks] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    togglePlay,
    seek,
    stop,
  } = useAudioPlayer(tracks);

  const handleUpload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadAudio(file);
      
      const newTrack = {
        id: result.audio_id,
        name: result.filename,
        audioUrl: getAudioFileUrl(result.audio_id),
        waveform: result.waveform,
        duration: result.duration,
        sampleRate: result.sample_rate,
        features: result.features,
        muted: false,
        solo: false,
        volume: 1,
        color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
        denoiseStrength: 0,
        isDenoising: false,
        sourceAudioId: null,
      };
      
      setTracks(prev => [...prev, newTrack]);
    } catch (e) {
      setError(e.message || '上传失败');
      console.error('上传失败:', e);
    } finally {
      setUploading(false);
    }
  }, [tracks.length]);

  const handleMuteToggle = useCallback((trackId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  }, []);

  const handleSoloToggle = useCallback((trackId) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, solo: !track.solo } : track
    ));
  }, []);

  const handleVolumeChange = useCallback((trackId, volume) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  }, []);

  const handleRemoveTrack = useCallback((trackId) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
  }, []);

  const handleDenoiseChange = useCallback(async (trackId, strength) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, denoiseStrength: strength } : track
    ));

    if (strength <= 0) {
      setTracks(prev => prev.map(track => {
        if (track.id !== trackId) return track;
        if (track.sourceAudioId) {
          return {
            ...track,
            id: track.sourceAudioId,
            audioUrl: getAudioFileUrl(track.sourceAudioId),
            sourceAudioId: null,
            isDenoising: false,
          };
        }
        return { ...track, isDenoising: false };
      }));
      return;
    }

    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, isDenoising: true } : track
    ));

    try {
      const currentTrack = tracks.find(t => t.id === trackId);
      const sourceId = currentTrack?.sourceAudioId || trackId;

      const result = await denoiseAudio(sourceId, strength);

      setTracks(prev => prev.map(track => {
        if (track.id !== trackId) return track;
        return {
          ...track,
          id: result.audio_id,
          name: result.filename,
          audioUrl: getAudioFileUrl(result.audio_id),
          waveform: result.waveform,
          duration: result.duration,
          sourceAudioId: sourceId,
          isDenoising: false,
        };
      }));
    } catch (e) {
      setError(e.message || '去噪处理失败');
      setTracks(prev => prev.map(track =>
        track.id === trackId ? { ...track, isDenoising: false } : track
      ));
    }
  }, [tracks]);

  const firstTrackData = tracks[0];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🎵 音频剪辑工具</h1>
        <p className="app-subtitle">基于 Web Audio API 的多音轨音频编辑器</p>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="main-content">
        <div className="left-panel">
          {tracks.length === 0 ? (
            <AudioUploader onUpload={handleUpload} uploading={uploading} />
          ) : (
            <div className="tracks-section">
              <div className="section-header">
                <h2>音轨</h2>
                <button 
                  className="add-track-btn"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = (e) => {
                      if (e.target.files[0]) {
                        handleUpload(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                  disabled={uploading}
                >
                  + 添加音轨
                </button>
              </div>
              
              <div className="tracks-list">
                {tracks.map((track) => (
                  <AudioTrack
                    key={track.id}
                    id={track.id}
                    name={track.name}
                    waveform={track.waveform}
                    duration={track.duration}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    muted={track.muted}
                    solo={track.solo}
                    volume={track.volume}
                    color={track.color}
                    denoiseStrength={track.denoiseStrength}
                    isDenoising={track.isDenoising}
                    onSeek={seek}
                    onMuteToggle={handleMuteToggle}
                    onSoloToggle={handleSoloToggle}
                    onVolumeChange={handleVolumeChange}
                    onRemove={handleRemoveTrack}
                    onDenoiseChange={handleDenoiseChange}
                  />
                ))}
              </div>
            </div>
          )}

          {tracks.length > 0 && (
            <div className="timeline-section">
              <Timeline
                duration={duration}
                currentTime={currentTime}
                onSeek={seek}
              />
            </div>
          )}

          {tracks.length > 0 && (
            <TransportControls
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onStop={stop}
              currentTime={currentTime}
              duration={duration}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className="right-panel">
          <AudioInfoPanel audioData={firstTrackData} />
          
          <div className="instructions-panel">
            <h3 className="panel-title">使用说明</h3>
            <ul>
              <li>上传 MP3 或 WAV 音频文件</li>
              <li>点击波形图可以跳转播放位置</li>
              <li>支持多音轨同时播放</li>
              <li>M 按钮静音当前轨道</li>
              <li>S 按钮独奏当前轨道</li>
              <li>🔊 滑块调整音量</li>
              <li>🔇 滑块调整去噪强度，拉到 0 恢复原始音频</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
