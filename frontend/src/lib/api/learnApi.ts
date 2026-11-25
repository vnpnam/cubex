function sanitizeApiUrl(raw?: string): string {
  if (!raw) return 'http://localhost:5247';
  const cleaned = raw.trim().replace(/^https?:\/\/(https?:\/\/)/i, '$1');
  if (cleaned.includes('localhost:5247.trycloudflare.com')) {
    return 'http://localhost:5247';
  }
  return cleaned.replace(/\/+$/, '');
}

const API_URL = sanitizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export interface LearnAlgorithm {
  id: number;
  category: 'Cross' | 'F2L' | 'OLL' | 'PLL';
  subCategory: string;
  code: string;
  name: string;
  notation: string;
  alternativeNotation?: string;
  setupMoves?: string;
  descriptionVi: string;
  descriptionEn: string;
  executionTipVi: string;
  executionTipEn: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  orderIndex: number;
  diagramPattern?: string;
  userStatus?: 'Learning' | 'Practicing' | 'Mastered';
  isFavorite?: boolean;
  personalBestTimeMs?: number;
  practiceCount?: number;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fetchLearnAlgorithms(
  category: 'Cross' | 'F2L' | 'OLL' | 'PLL',
  token?: string
): Promise<LearnAlgorithm[]> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/algorithms?category=${category}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data as Record<string, unknown>[]).map((a) => ({
      ...a,
      category,
    })) as LearnAlgorithm[];
  } catch {
    return [];
  }
}

export async function updateLearnProgress(
  id: number,
  token: string,
  status: 'Learning' | 'Practicing' | 'Mastered',
  practiceTimeMs?: number,
  isFavorite?: boolean
): Promise<void> {
  try {
    await fetch(`${API_URL}/api/algorithms/${id}/progress`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ status, practiceTimeMs, isFavorite }),
    });
  } catch {
    // ignore – optimistic update already applied
  }
}

export async function submitFeedback(
  algorithmId: number,
  message: string,
  token?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${API_URL}/api/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ algorithmId, message }),
    });
  } catch {
    // ignore
  }
}
