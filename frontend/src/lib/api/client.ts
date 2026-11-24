import { INITIAL_ALGORITHMS, AlgorithmItem } from '../data/algorithmsData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cubex_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async getAlgorithms(category?: string, search?: string): Promise<AlgorithmItem[]> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE_URL}/algorithms?${params.toString()}`, {
        headers: this.getHeaders(),
        cache: 'no-store'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to rich embedded data
    }

    let filtered = [...INITIAL_ALGORITHMS];
    if (category && category !== 'All') {
      filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.code.toLowerCase().includes(s) ||
          a.notation.toLowerCase().includes(s)
      );
    }
    return filtered;
  }

  async updateAlgorithmProgress(
    id: number,
    status: 'Learning' | 'Practicing' | 'Mastered',
    practiceTimeMs?: number
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/algorithms/${id}/progress`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ status, practiceTimeMs })
      });
      return res.ok;
    } catch {
      return true;
    }
  }

  async getScramble(type: string = '3x3'): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/scramble/${type}`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.scramble;
      }
    } catch {
      // fallback handled in timer store
    }
    return "R2 D' B2 L2 U2 F2 D B2 R2 B' U R2 F2 R' D' B' F2 U B2 R'";
  }

  async getDashboardAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: this.getHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return null;
  }
}

export const api = new ApiClient();
