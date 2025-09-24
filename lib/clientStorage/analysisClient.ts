import type { AnalysisRecord } from "../types";

/**
 * Client-side storage abstraction that uses API routes instead of direct database access
 * This prevents Node.js modules like 'fs' from being imported on the client side
 */

// Helper function to get API key for requests
async function getApiKey(): Promise<string> {
  return process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

// Helper function to make authenticated requests
async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = await getApiKey();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
  });
}

export const analysisClient = {
  async save(record: AnalysisRecord): Promise<AnalysisRecord> {
    const response = await apiRequest('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Failed to save analysis: ${response.statusText}`);
    }

    return response.json();
  },

  async get(id: number): Promise<AnalysisRecord | null> {
    const response = await apiRequest(`/api/analysis/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get analysis: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analysis || null;
  },

  async list(limit?: number): Promise<AnalysisRecord[]> {
    const url = limit ? `/api/analyses?limit=${limit}` : '/api/analyses';
    const response = await apiRequest(url);

    if (!response.ok) {
      throw new Error(`Failed to list analyses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analyses || [];
  },

  async remove(id: number): Promise<boolean> {
    const response = await apiRequest(`/api/analysis/${id}`, {
      method: 'DELETE',
    });

    return response.status === 204;
  },

  async clear(): Promise<void> {
    const response = await apiRequest('/api/analyses', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear analyses: ${response.statusText}`);
    }
  },

  async getStats() {
    const response = await apiRequest('/api/analyses/stats');

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stats || {};
  },

  async getNewThisRun(): Promise<AnalysisRecord[]> {
    const response = await apiRequest('/api/analyses/new-this-run');

    if (!response.ok) {
      throw new Error(`Failed to get new analyses: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analyses || [];
  },

  async markAsNewThisRun(ids: number[]): Promise<void> {
    const response = await apiRequest('/api/analyses/mark-new', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark as new: ${response.statusText}`);
    }
  },

  async searchByCompany(company: string): Promise<AnalysisRecord[]> {
    const response = await apiRequest(`/api/analyses/search?company=${encodeURIComponent(company)}`);

    if (!response.ok) {
      throw new Error(`Failed to search by company: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analyses || [];
  },

  async getByStatus(status: 'interested' | 'applied'): Promise<AnalysisRecord[]> {
    const response = await apiRequest(`/api/analyses/status/${status}`);

    if (!response.ok) {
      throw new Error(`Failed to get by status: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analyses || [];
  },

  async update(id: number, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    const response = await apiRequest(`/api/analysis/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to update analysis: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analysis || null;
  },
};
