const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  signUp: (data: { email: string; password: string; fullName?: string }) =>
    apiRequest("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  signIn: (data: { email: string; password: string }) =>
    apiRequest("/auth/signin", { method: "POST", body: JSON.stringify(data) }),

  signOut: (token: string) =>
    apiRequest("/auth/signout", { method: "POST", token }),

  refreshToken: (refresh_token: string) =>
    apiRequest("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  // Applications
  getApplications: (token: string) => apiRequest("/applications", { token }),

  addApplication: (token: string, data: any) =>
    apiRequest("/applications", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  updateApplication: (token: string, id: number, data: any) =>
    apiRequest(`/applications/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    }),

  updateApplicationStatus: (token: string, id: number, status: string) =>
    apiRequest(`/applications/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    }),

  deleteApplication: (token: string, id: number) =>
    apiRequest(`/applications/${id}`, { method: "DELETE", token }),

  // Journal
  getJournalEntries: (token: string) => apiRequest("/journal", { token }),

  addJournalEntry: (token: string, data: any) =>
    apiRequest("/journal", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    }),

  updateJournalEntry: (token: string, id: number, data: any) =>
    apiRequest(`/journal/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    }),

  deleteJournalEntry: (token: string, id: number) =>
    apiRequest(`/journal/${id}`, { method: "DELETE", token }),
};
