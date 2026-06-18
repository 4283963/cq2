const API_BASE = '/api/audio';

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '上传失败');
  }

  return response.json();
}

export async function getAudioInfo(audioId) {
  const response = await fetch(`${API_BASE}/${audioId}/info`);
  if (!response.ok) throw new Error('获取音频信息失败');
  return response.json();
}

export async function getWaveform(audioId) {
  const response = await fetch(`${API_BASE}/${audioId}/waveform`);
  if (!response.ok) throw new Error('获取波形数据失败');
  return response.json();
}

export async function getFeatures(audioId) {
  const response = await fetch(`${API_BASE}/${audioId}/features`);
  if (!response.ok) throw new Error('获取音频特征失败');
  return response.json();
}

export async function getSlices(audioId) {
  const response = await fetch(`${API_BASE}/${audioId}/slices`);
  if (!response.ok) throw new Error('获取切片列表失败');
  return response.json();
}

export function getSliceUrl(audioId, sliceIndex) {
  return `${API_BASE}/${audioId}/slices/${sliceIndex}`;
}

export function getAudioFileUrl(audioId) {
  return `${API_BASE}/${audioId}/file`;
}

export async function denoiseAudio(audioId, strength) {
  const response = await fetch(`${API_BASE}/${audioId}/denoise?strength=${strength}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '去噪处理失败');
  }

  return response.json();
}
