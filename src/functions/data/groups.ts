import { api, getApiErrorMessage } from "@/functions/data/apiClient";

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface LeaderboardRow {
  id: string;
  nickname: string | null;
  full_name: string | null;
  school: string | null;
  total_hours: number;
  required_hours: number;
}

export async function createGroup(name: string): Promise<Group> {
  try {
    const res = await api.post("/groups", { name });
    return res.data.group;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to create group"));
  }
}

export async function joinGroup(inviteCode: string): Promise<Group> {
  try {
    const res = await api.post("/groups/join", { invite_code: inviteCode });
    return res.data.group;
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to join group"));
  }
}

export async function getMyGroups(): Promise<Group[]> {
  try {
    const res = await api.get("/groups/mine");
    return res.data.groups ?? [];
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to load groups"));
  }
}

export async function getGroupLeaderboard(
  groupId: number,
): Promise<LeaderboardRow[]> {
  try {
    const res = await api.get(`/groups/${groupId}/leaderboard`);
    return res.data.leaderboard ?? [];
  } catch (err) {
    throw new Error(getApiErrorMessage(err, "Failed to load leaderboard"));
  }
}
