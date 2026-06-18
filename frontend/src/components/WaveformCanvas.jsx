import React, { useRef, useEffect, useCallback } from 'react';
import './WaveformCanvas.css';

function WaveformCanvas({ 
  peaks, 
  rms, 
  duration, 
  currentTime, 
  isPlaying,
  color = '#6c63ff',
  height = 120,
  onSeek 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !peaks || peaks.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const h = height;

    canvas.width = width * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, h);

    const centerY = h / 2;
    const barWidth = Math.max(1, width / peaks.length);
    const gap = barWidth > 2 ? 1 : 0;
    const actualBarWidth = barWidth - gap;

    const playProgress = duration > 0 ? currentTime / duration : 0;
    const playX = width * playProgress;

    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const peak = peaks[i] || 0;
      const rmsValue = (rms && rms[i]) || peak * 0.5;
      
      const barHeight = Math.max(2, peak * (h - 10));
      const rmsHeight = Math.max(1, rmsValue * (h - 10));
      
      const isPlayed = x < playX;
      
      const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
      if (isPlayed) {
        gradient.addColorStop(0, '#9b8cff');
        gradient.addColorStop(0.5, '#6c63ff');
        gradient.addColorStop(1, '#9b8cff');
      } else {
        gradient.addColorStop(0, '#4a4a6a');
        gradient.addColorStop(0.5, '#3a3a5a');
        gradient.addColorStop(1, '#4a4a6a');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        actualBarWidth,
        barHeight
      );
      
      ctx.fillStyle = isPlayed ? 'rgba(155, 140, 255, 0.6)' : 'rgba(100, 100, 140, 0.6)';
      ctx.fillRect(
        x,
        centerY - rmsHeight / 2,
        actualBarWidth,
        rmsHeight
      );
    }

    if (duration > 0) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, h);
      ctx.stroke();
    }
  }, [peaks, rms, duration, currentTime, height, color]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  useEffect(() => {
    const handleResize = () => drawWaveform();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  const handleClick = (e) => {
    if (!onSeek || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = ratio * duration;
    onSeek(Math.max(0, Math.min(time, duration)));
  };

  return (
    <div ref={containerRef} className="waveform-canvas-container" onClick={handleClick}>
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
}

export default WaveformCanvas;
