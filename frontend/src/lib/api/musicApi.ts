const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5247';
const API_URL = RAW_API_URL.includes('http://localhost:5247') ? 'http://localhost:5247' : RAW_API_URL.trim();

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

export async function fetchSystemTracks() {
  try {
    const res = await fetch(`${API_URL}/api/music/system`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchUserTracks(token: string) {
  try {
    const res = await fetch(`${API_URL}/api/music/user`, { headers: authHeaders(token) });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function uploadUserTrack(
  token: string,
  title: string,
  artist: string,
  audioFile: File,
  coverFile?: File
) {
  const form = new FormData();
  form.append('title', title);
  form.append('artist', artist);
  form.append('audioFile', audioFile);
  if (coverFile) form.append('coverFile', coverFile);

  const res = await fetch(`${API_URL}/api/music/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Upload failed');
  }
  return res.json();
}

export async function deleteUserTrack(token: string, id: number) {
  const res = await fetch(`${API_URL}/api/music/user/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Delete failed');
}

// Admin
export async function createSystemTrack(
  token: string,
  title: string,
  artist: string,
  audioFile: File,
  coverFile?: File
) {
  const form = new FormData();
  form.append('title', title);
  form.append('artist', artist);
  form.append('audioFile', audioFile);
  if (coverFile) form.append('coverFile', coverFile);

  const res = await fetch(`${API_URL}/api/music/system`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Create failed');
  return res.json();
}

export async function updateSystemTrack(
  token: string,
  id: number,
  data: { title?: string; artist?: string; isActive?: boolean; isDefault?: boolean; sortOrder?: number },
  coverFile?: File
) {
  const form = new FormData();
  if (data.title != null) form.append('title', data.title);
  if (data.artist != null) form.append('artist', data.artist);
  if (data.isActive != null) form.append('isActive', String(data.isActive));
  if (data.isDefault != null) form.append('isDefault', String(data.isDefault));
  if (data.sortOrder != null) form.append('sortOrder', String(data.sortOrder));
  if (coverFile) form.append('coverFile', coverFile);

  const res = await fetch(`${API_URL}/api/music/system/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
}

export async function deleteSystemTrack(token: string, id: number) {
  const res = await fetch(`${API_URL}/api/music/system/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Delete failed');
}
