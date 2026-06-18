import { useState, useEffect, useRef, useCallback } from 'react';
import { getSliceUrl } from '../api/audioApi';

export function useAudioPlayer(tracks) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioContextRef = useRef(null);
  const sourceNodesRef = useRef({});
  const gainNodesRef = useRef({});
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const animationFrameRef = useRef(null);
  const audioBuffersRef = useRef({});
  const tracksRef = useRef([]);

  useEffect(() => {
    tracksRef.current = tracks;

    const currentIds = new Set(tracks.map(t => t.id));
    const cachedIds = Object.keys(audioBuffersRef.current);
    for (const cachedId of cachedIds) {
      if (!currentIds.has(cachedId)) {
        delete audioBuffersRef.current[cachedId];
      }
    }
  }, [tracks]);

  useEffect(() => {
    const maxDuration = tracks.reduce((max, track) => Math.max(max, track.duration || 0), 0);
    setDuration(maxDuration);
  }, [tracks]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const loadTrackBuffer = useCallback(async (track) => {
    if (audioBuffersRef.current[track.id]) {
      return audioBuffersRef.current[track.id];
    }

    if (track.audioUrl) {
      const response = await fetch(track.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = initAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffersRef.current[track.id] = audioBuffer;
      return audioBuffer;
    }

    return null;
  }, [initAudioContext]);

  const loadAllTracks = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentTracks = tracksRef.current;
      await Promise.all(
        currentTracks.map(track => loadTrackBuffer(track).catch(() => null))
      );
    } catch (e) {
      console.error('加载音频失败:', e);
    }
    setIsLoading(false);
  }, [loadTrackBuffer]);

  const stopAllSources = useCallback(() => {
    Object.values(sourceNodesRef.current).forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    sourceNodesRef.current = {};
  }, []);

  const updateTime = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;
    
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
    const currentTracks = tracksRef.current;
    const maxDur = currentTracks.reduce((max, t) => Math.max(max, t.duration || 0), 0);
    
    if (elapsed >= maxDur) {
      setCurrentTime(maxDur);
      setIsPlaying(false);
      stopAllSources();
      pauseTimeRef.current = 0;
      return;
    }
    
    setCurrentTime(elapsed);
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, stopAllSources]);

  const play = useCallback(async () => {
    if (tracksRef.current.length === 0) return;
    
    const audioContext = initAudioContext();
    
    stopAllSources();
    
    await loadAllTracks();
    
    const currentTracks = tracksRef.current;
    const anySolo = currentTracks.some(t => t.solo);
    
    currentTracks.forEach(track => {
      const buffer = audioBuffersRef.current[track.id];
      if (!buffer) return;
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = audioContext.createGain();
      const shouldMute = track.muted || (anySolo && !track.solo);
      gainNode.gain.value = shouldMute ? 0 : track.volume;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const offset = pauseTimeRef.current;
      if (offset < buffer.duration) {
        source.start(0, offset);
      }
      
      sourceNodesRef.current[track.id] = source;
      gainNodesRef.current[track.id] = gainNode;
    });
    
    startTimeRef.current = audioContext.currentTime;
    setIsPlaying(true);
    
    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [initAudioContext, stopAllSources, loadAllTracks, updateTime]);

  const pause = useCallback(() => {
    if (!audioContextRef.current) return;
    
    stopAllSources();
    
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
    const currentTracks = tracksRef.current;
    const maxDur = currentTracks.reduce((max, t) => Math.max(max, t.duration || 0), 0);
    pauseTimeRef.current = Math.min(elapsed, maxDur);
    
    setCurrentTime(pauseTimeRef.current);
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [stopAllSources]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    const wasPlaying = isPlaying;
    
    if (isPlaying) {
      stopAllSources();
    }
    
    pauseTimeRef.current = time;
    setCurrentTime(time);
    
    if (wasPlaying) {
      play();
    }
  }, [isPlaying, stopAllSources, play]);

  const stop = useCallback(() => {
    stopAllSources();
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [stopAllSources]);

  const updateTrackVolume = useCallback((trackId, volume) => {
    const gainNode = gainNodesRef.current[trackId];
    if (gainNode) {
      const track = tracksRef.current.find(t => t.id === trackId);
      const anySolo = tracksRef.current.some(t => t.solo);
      const shouldMute = track?.muted || (anySolo && !track?.solo);
      gainNode.gain.value = shouldMute ? 0 : volume;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllSources();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllSources]);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    play,
    pause,
    togglePlay,
    seek,
    stop,
    updateTrackVolume,
    loadAllTracks,
  };
}
