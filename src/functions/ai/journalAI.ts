import api from "@/lib/api";

export type EnhanceType = "improve" | "expand" | "professional" | "summarize";

interface EnhanceResponse {
  enhancedContent: string;
  originalContent: string;
  enhanceType: EnhanceType;
}

interface SuggestTagsResponse {
  tags: string[];
}

export async function enhanceJournalEntry(
  content: string,
  title: string,
  enhanceType: EnhanceType = "improve",
  token: string
): Promise<EnhanceResponse> {
  const response = await api.post<EnhanceResponse>(
    "/journal/ai/enhance",
    { content, title, enhanceType },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function suggestTags(
  content: string,
  title: string,
  token: string
): Promise<string[]> {
  const response = await api.post<SuggestTagsResponse>(
    "/journal/ai/suggest-tags",
    { content, title },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.tags;
}

export interface WeeklySummaryEntry {
  title?: string;
  date?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  time_in?: string | null;
  time_out?: string | null;
  break_time?: number | null;
}

interface WeeklySummaryResponse {
  summary: string;
}

export async function summarizeWeek(
  entries: WeeklySummaryEntry[],
  token: string
): Promise<string> {
  const response = await api.post<WeeklySummaryResponse>(
    "/journal/ai/weekly-summary",
    { entries },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.summary;
}
