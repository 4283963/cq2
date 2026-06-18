import React from 'react';
import './TransportControls.css';

function TransportControls({
  isPlaying,
  onPlayPause,
  onStop,
  currentTime,
  duration,
  isLoading,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(1, '0')}`;
  };

  return (
    <div className="transport-controls">
      <div className="time-display">
        <span className="current-time">{formatTime(currentTime)}</span>
        <span className="time-separator">/</span>
        <span className="total-time">{formatTime(duration)}</span>
      </div>
      
      <div className="control-buttons">
        <button
          className="control-btn stop-btn"
          onClick={onStop}
          disabled={isLoading}
          title="停止"
        >
          ⏹
        </button>
        <button
          className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={onPlayPause}
          disabled={isLoading}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isLoading ? '⏳' : isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}

export default TransportControls;
