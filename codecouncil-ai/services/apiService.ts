/**
 * API Service
 * Handles all communication with the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class APIService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if it exists
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async loginWithGoogle(idToken: string) {
    const data = await this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    });

    this.setToken(data.token);
    return data.user;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async refreshToken() {
    const data = await this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: this.token })
    });

    this.setToken(data.token);
    return data.token;
  }

  // Billing endpoints
  async getBillingPlans() {
    return this.request('/api/billing/plans');
  }

  async getUsage() {
    return this.request('/api/billing/usage');
  }

  async processTransaction(tier: string) {
    return this.request('/api/billing/process-transaction', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
  }

  async upgradeToUnlimited() {
    return this.request('/api/billing/upgrade-to-unlimited', {
      method: 'POST'
    });
  }

  // Gemini proxy endpoints
  async analyzeWithGemini(prompt: string, systemInstruction?: string) {
    return this.request('/api/gemini/analyze', {
      method: 'POST',
      body: JSON.stringify({ prompt, systemInstruction })
    });
  }

  async getGeminiModels() {
    return this.request('/api/gemini/models');
  }

  // Health check
  async health() {
    return fetch(`${API_URL}/health`).then(r => r.json());
  }
}

export const apiService = new APIService();
