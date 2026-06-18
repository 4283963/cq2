import React from 'react';
import './Timeline.css';

function Timeline({ duration, currentTime, onSeek }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const generateMarkers = () => {
    const markers = [];
    const interval = duration > 60 ? 10 : duration > 30 ? 5 : duration > 10 ? 2 : 1;
    
    for (let time = 0; time <= duration; time += interval) {
      markers.push(time);
    }
    
    return markers;
  };

  const handleClick = (e) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(Math.max(0, Math.min(ratio * duration, duration)));
  };

  const markers = generateMarkers();

  return (
    <div className="timeline-container" onClick={handleClick}>
      <div className="timeline-ruler">
        {markers.map((time) => (
          <div
            key={time}
            className="timeline-marker"
            style={{ left: `${(time / duration) * 100}%` }}
          >
            <div className="timeline-tick"></div>
            <span className="timeline-label">{formatTime(time)}</span>
          </div>
        ))}
      </div>
      <div className="timeline-current-time">
        当前: {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}

export default Timeline;
