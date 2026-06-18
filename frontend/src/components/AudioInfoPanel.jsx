import React from 'react';
import './AudioInfoPanel.css';

function AudioInfoPanel({ audioData }) {
  if (!audioData) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="audio-info-panel">
      <h3 className="panel-title">音频信息</h3>
      
      <div className="info-section">
        <div className="info-item">
          <span className="info-label">文件名</span>
          <span className="info-value">{audioData.filename}</span>
        </div>
        <div className="info-item">
          <span className="info-label">时长</span>
          <span className="info-value">{formatDuration(audioData.duration)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">采样率</span>
          <span className="info-value">{audioData.sample_rate} Hz</span>
        </div>
      </div>

      {audioData.features && (
        <div className="info-section">
          <h4 className="section-title">音频特征</h4>
          <div className="info-item">
            <span className="info-label">速度 (BPM)</span>
            <span className="info-value">{audioData.features.tempo?.toFixed(1)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">频谱中心</span>
            <span className="info-value">{audioData.features.spectral_centroid?.toFixed(0)} Hz</span>
          </div>
          <div className="info-item">
            <span className="info-label">过零率</span>
            <span className="info-value">{audioData.features.zero_crossing_rate?.toFixed(4)}</span>
          </div>
        </div>
      )}

      {audioData.waveform && (
        <div className="info-section">
          <h4 className="section-title">波形数据</h4>
          <div className="info-item">
            <span className="info-label">采样点数</span>
            <span className="info-value">{audioData.waveform.peaks?.length || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">每秒点数</span>
            <span className="info-value">{audioData.waveform.points_per_second}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioInfoPanel;
