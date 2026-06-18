import React from 'react';
import WaveformCanvas from './WaveformCanvas';
import './AudioTrack.css';

function AudioTrack({
  id,
  name,
  waveform,
  duration,
  currentTime,
  isPlaying,
  muted,
  solo,
  volume,
  color,
  denoiseStrength,
  isDenoising,
  onSeek,
  onMuteToggle,
  onSoloToggle,
  onVolumeChange,
  onRemove,
  onDenoiseChange,
}) {
  return (
    <div className={`audio-track ${muted ? 'muted' : ''}`}>
      <div className="track-controls">
        <div className="track-info">
          <span className="track-color" style={{ backgroundColor: color }}></span>
          <span className="track-name">{name}</span>
        </div>
        <div className="track-buttons">
          <button
            className={`track-btn mute-btn ${muted ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onMuteToggle?.(id); }}
            title="静音"
          >
            M
          </button>
          <button
            className={`track-btn solo-btn ${solo ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSoloToggle?.(id); }}
            title="独奏"
          >
            S
          </button>
          <button
            className="track-btn remove-btn"
            onClick={(e) => { e.stopPropagation(); onRemove?.(id); }}
            title="移除"
          >
            ✕
          </button>
        </div>
        <div className="track-volume">
          <span className="slider-label">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange?.(id, parseFloat(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
        <div className="track-denoise">
          <span className="slider-label">🔇</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={denoiseStrength || 0}
            onChange={(e) => {
              e.stopPropagation();
              onDenoiseChange?.(id, parseFloat(e.target.value));
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={isDenoising}
          />
          <span className="volume-value">
            {isDenoising ? '...' : `${Math.round((denoiseStrength || 0) * 100)}%`}
          </span>
        </div>
      </div>
      <div className="track-waveform">
        <WaveformCanvas
          peaks={waveform?.peaks || []}
          rms={waveform?.rms || []}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          color={color}
          height={80}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
}

export default AudioTrack;
