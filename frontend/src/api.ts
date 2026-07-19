import { supabase } from './lib/supabase';

// Types matching the backend models
export type ScenarioType = "rent_vs_buy" | "lease_vs_buy_car" | "debt_vs_invest" | "custom";

export interface ScenarioInput {
  field_name: string;
  value: any;
  source: "user_provided" | "live_data" | "default_estimate";
  as_of_date?: string;
  citation?: string;
}

export interface ScenarioResult {
  summary: string;
  numeric_breakdown: Record<string, any>;
  assumptions_used: ScenarioInput[];
  computed_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Scenario {
  id: string;
  user_id: string;
  type: ScenarioType;
  title?: string;
  inputs: ScenarioInput[];
  result?: ScenarioResult;
  conversation: Message[];
  created_at: string;
  updated_at: string;
}

export interface ProfileData {
  location?: string;
  income_band?: string;
  housing_situation?: string;
  financial_goals?: string[];
  debt_situation?: string;
  risk_tolerance?: string;
  notification_prefs?: Record<string, boolean>;
  currency?: string;
}

const API_BASE_URL = "http://localhost:8000/api";

/**
 * Get the current access token from Supabase session.
 * Returns the Bearer token string or null if not authenticated.
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Build headers with the Authorization Bearer token attached.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  getMe: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) throw new Error("Failed to get user info");
    return res.json();
  },

  listScenarios: async (): Promise<Scenario[]> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/scenarios/`, { headers });
    if (!res.ok) throw new Error("Failed to fetch scenarios");
    return res.json();
  },

  getScenario: async (id: string): Promise<Scenario> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/scenarios/${id}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch scenario");
    return res.json();
  },

  createScenario: async (type: ScenarioType): Promise<Scenario> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/scenarios/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type })
    });
    if (!res.ok) throw new Error("Failed to create scenario");
    return res.json();
  },

  sendMessage: async (id: string, message: string): Promise<Scenario> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/scenarios/${id}/message`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  getProfile: async (): Promise<ProfileData> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/profile`, { headers });
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  },

  updateProfile: async (data: ProfileData): Promise<ProfileData> => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },
};
