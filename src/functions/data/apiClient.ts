import axios from "axios";
import { supabase } from "@/config/supabaseClient";

/**
 * Shared axios instance for the Express backend.
 * Mirrors the interceptor pattern used in the journal store: attaches the
 * current Supabase access token as a Bearer header on every request.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (token && config.headers) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

type ApiErrorResponse = {
  error?: string;
};

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
