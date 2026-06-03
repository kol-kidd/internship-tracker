import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Crown,
  Medal,
  Plus,
  School,
  Trophy,
  Users,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { supabase } from "@/config/supabaseClient";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { getInitial } from "@/lib/profileIdentity";
import {
  createGroup,
  getGroupLeaderboard,
  getMyGroups,
  joinGroup,
  type Group,
  type LeaderboardRow,
} from "@/functions/data/groups";

type Tab = "school" | "groups";

interface RankSummary {
  rank: number | null;
  currentHours: number;
  hoursToNext: number | null;
}

const LEADERBOARD_CACHE_MS = 5 * 60 * 1000;
const schoolLeaderboardCache = new Map<
  string,
  { rows: LeaderboardRow[]; fetchedAt: number }
>();
const myGroupsCache = new Map<
  string,
  { groups: Group[]; fetchedAt: number }
>();
const groupLeaderboardCache = new Map<
  number,
  { rows: LeaderboardRow[]; fetchedAt: number }
>();

function rankAccent(rank: number) {
  if (rank === 0) return "text-yellow-500";
  if (rank === 1) return "text-gray-400";
  if (rank === 2) return "text-amber-700";
  return "text-text-subtle";
}

function getRankSummary(rows: LeaderboardRow[], meId?: string): RankSummary {
  if (!meId) return { rank: null, currentHours: 0, hoursToNext: null };

  const meIndex = rows.findIndex((row) => row.id === meId);
  if (meIndex === -1) return { rank: null, currentHours: 0, hoursToNext: null };

  const me = rows[meIndex];
  const next = meIndex > 0 ? rows[meIndex - 1] : null;
  return {
    rank: meIndex + 1,
    currentHours: me.total_hours,
    hoursToNext: next
      ? Math.max(0.1, next.total_hours - me.total_hours + 0.1)
      : null,
  };
}

function LeaderboardSummaryCard({
  rows,
  meId,
  label,
}: {
  rows: LeaderboardRow[];
  meId?: string;
  label: string;
}) {
  const summary = getRankSummary(rows, meId);
  if (summary.rank == null) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="app-metric-card p-4">
        <p className="text-xs font-medium text-text-muted mb-1">Your rank</p>
        <p className="text-xl font-bold text-text">
          #{summary.rank}
          <span className="text-xs font-medium text-text-muted">
            {" "}
            of {rows.length}
          </span>
        </p>
      </div>
      <div className="app-metric-card p-4">
        <p className="text-xs font-medium text-text-muted mb-1">Your hours</p>
        <p className="text-xl font-bold text-text">
          {summary.currentHours.toFixed(1)}h
        </p>
      </div>
      <div className="app-metric-card p-4">
        <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
        <p className="text-xl font-bold text-text">
          {summary.hoursToNext == null
            ? "Top"
            : `${summary.hoursToNext.toFixed(1)}h`}
        </p>
      </div>
    </div>
  );
}

function EmptyLeaderboardState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="app-empty-state p-8 text-center">
      <p className="text-sm font-semibold text-text">{title}</p>
      <p className="text-sm text-text-muted mt-1 max-w-md mx-auto">
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function LeaderboardList({
  rows,
  meId,
}: {
  rows: LeaderboardRow[];
  meId?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const required = row.required_hours || 1;
        const percent = Math.min(100, (row.total_hours / required) * 100);
        const isMe = row.id === meId;
        const displayName = row.nickname?.trim() || row.full_name || "Anonymous";
        return (
          <div
            key={row.id}
            className={`app-data-row flex items-center gap-4 p-3.5 ${
              isMe
                ? "border-primary/40 bg-primary/5"
                : ""
            }`}
          >
            <div className="w-8 flex items-center justify-center shrink-0">
              {i < 3 ? (
                i === 0 ? (
                  <Crown className={`w-5 h-5 ${rankAccent(i)}`} />
                ) : (
                  <Medal className={`w-5 h-5 ${rankAccent(i)}`} />
                )
              ) : (
                <span className="text-sm font-semibold text-text-muted">
                  {i + 1}
                </span>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
              {getInitial(displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text truncate">
                {displayName}
                {isMe && (
                  <span className="ml-2 text-[11px] font-medium text-primary">
                    You
                  </span>
                )}
              </p>
              {row.school && (
                <p className="text-xs text-text-muted truncate">{row.school}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-text">
                {row.total_hours.toFixed(1)}h
              </p>
              <div className="w-20 h-1.5 rounded-full bg-surface overflow-hidden mt-1">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("school");
  const userId = user?.id;

  // School leaderboard
  const [schoolRows, setSchoolRows] = useState<LeaderboardRow[]>([]);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupRows, setGroupRows] = useState<LeaderboardRow[]>([]);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const schoolId = profile?.school_id ?? null;
  const schoolName = profile?.school ?? null;
  const schoolCacheKey = schoolId
    ? `id:${schoolId}`
    : schoolName
      ? `name:${schoolName.toLowerCase()}`
      : null;

  // School leaderboard query — uses school_id for canonical grouping
  // (avoids "CTU Danao" != "Cebu Technological University - Danao Campus" mismatch)
  const loadSchoolLeaderboard = useCallback(async (options = { force: false }) => {
    if (!schoolId && !schoolName) {
      setSchoolRows([]);
      setSchoolLoading(false);
      return;
    }

    const cached = schoolCacheKey
      ? schoolLeaderboardCache.get(schoolCacheKey)
      : null;
    const cacheIsFresh =
      cached && Date.now() - cached.fetchedAt < LEADERBOARD_CACHE_MS;

    if (!options.force && cacheIsFresh) {
      setSchoolRows(cached.rows);
      setSchoolLoading(false);
      return;
    }

    setSchoolLoading(!cached);

    const query = supabase
      .from("profiles")
      .select("id, nickname, full_name, school, total_hours, required_hours")
      .order("total_hours", { ascending: false });

    const { data, error } = schoolId
      ? await query.eq("school_id", schoolId)
      : await query.ilike("school", schoolName ?? "");

    if (!error) {
      const rows = (data as LeaderboardRow[]) ?? [];
      if (schoolCacheKey) {
        schoolLeaderboardCache.set(schoolCacheKey, {
          rows,
          fetchedAt: Date.now(),
        });
      }
      setSchoolRows(rows);
    }
    setSchoolLoading(false);
  }, [schoolCacheKey, schoolId, schoolName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSchoolLeaderboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSchoolLeaderboard]);

  useEffect(() => {
    if (!schoolId && !schoolName) return;

    const normalizedSchool = schoolName?.toLowerCase();
    const channel = supabase
      .channel(`leaderboard:school:${schoolId ?? normalizedSchool}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          ...(schoolId ? { filter: `school_id=eq.${schoolId}` } : {}),
        },
        (payload) => {
          if (!schoolId && normalizedSchool) {
            const nextSchool = (payload.new as { school?: string | null }).school;
            const previousSchool = (payload.old as { school?: string | null }).school;
            const touchedCurrentSchool = [nextSchool, previousSchool].some(
              (school) => school?.toLowerCase() === normalizedSchool,
            );

            if (!touchedCurrentSchool) return;
          }

          void loadSchoolLeaderboard({ force: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSchoolLeaderboard, schoolId, schoolName]);

  // Load my groups
  const loadGroups = useCallback(async (options = { force: false }) => {
    if (!userId) return;

    const cached = myGroupsCache.get(userId);
    const cacheIsFresh =
      cached && Date.now() - cached.fetchedAt < LEADERBOARD_CACHE_MS;

    if (!options.force && cacheIsFresh) {
      setGroups(cached.groups);
      setActiveGroup((current) => {
        if (current && cached.groups.some((group) => group.id === current.id)) {
          return current;
        }

        return cached.groups[0] ?? null;
      });
      return;
    }

    try {
      const mine = await getMyGroups();
      myGroupsCache.set(userId, { groups: mine, fetchedAt: Date.now() });
      setGroups(mine);
      setActiveGroup((current) => {
        if (current && mine.some((group) => group.id === current.id)) {
          return current;
        }

        return mine[0] ?? null;
      });
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : "Failed to load groups");
    }
  }, [userId]);

  useEffect(() => {
    if (tab !== "groups") return;

    const timer = window.setTimeout(() => {
      void loadGroups();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadGroups, tab]);

  // Load active group leaderboard
  const activeGroupId = activeGroup?.id ?? null;
  const groupMemberIds = useMemo(
    () => new Set(groupRows.map((row) => row.id)),
    [groupRows],
  );

  const loadGroupLeaderboard = useCallback(async (options = { force: false }) => {
    if (!activeGroupId) {
      setGroupRows([]);
      return;
    }

    const cached = groupLeaderboardCache.get(activeGroupId);
    const cacheIsFresh =
      cached && Date.now() - cached.fetchedAt < LEADERBOARD_CACHE_MS;

    if (!options.force && cacheIsFresh) {
      setGroupRows(cached.rows);
      return;
    }

    try {
      const rows = await getGroupLeaderboard(activeGroupId);
      groupLeaderboardCache.set(activeGroupId, {
        rows,
        fetchedAt: Date.now(),
      });
      setGroupRows(rows);
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [activeGroupId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGroupLeaderboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadGroupLeaderboard]);

  useEffect(() => {
    if (tab !== "groups" || !activeGroupId) return;

    const channel = supabase
      .channel(`leaderboard:group:${activeGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const changedProfileId =
            (payload.new as { id?: string }).id ??
            (payload.old as { id?: string }).id;

          if (!changedProfileId || !groupMemberIds.has(changedProfileId)) return;
          void loadGroupLeaderboard({ force: true });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${activeGroupId}`,
        },
        () => {
          void loadGroups({ force: true });
          void loadGroupLeaderboard({ force: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeGroupId, groupMemberIds, loadGroupLeaderboard, loadGroups, tab]);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setGroupError(null);
    try {
      const g = await createGroup(groupName.trim());
      setGroupName("");
      await loadGroups({ force: true });
      setActiveGroup(g);
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : "Failed to create group");
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setGroupError(null);
    try {
      const g = await joinGroup(joinCode.trim());
      setJoinCode("");
      await loadGroups({ force: true });
      setActiveGroup(g);
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : "Failed to join group");
    }
  };

  const copyCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabBtn = (key: Tab, label: string, Icon: typeof School) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
        tab === key
          ? "bg-primary text-white"
          : "text-text-muted hover:bg-canvas hover:text-text"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const inputClass =
    "flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  const podiumNote = useMemo(
    () =>
      tab === "school" && (!profile?.school || !profile?.course)
        ? "Add your school and course in your profile to see your school leaderboard."
        : null,
    [tab, profile?.course, profile?.school],
  );

  return (
    <>
      <SEO title="Leaderboard" description="See how you rank against other interns." />

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="app-hero-panel p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text">
                  Leaderboard
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Ranked by total internship hours logged.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[360px]">
              <div className="rounded-xl border border-border bg-canvas/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  School
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-text">
                  {schoolName || "Not set"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-canvas/80 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Groups
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {groups.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-canvas/80 p-3 col-span-2 sm:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Current
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {(profile?.total_hours ?? 0).toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="app-segment flex gap-2 w-fit">
          {tabBtn("school", "My School", School)}
          {tabBtn("groups", "Groups", Users)}
        </div>

        {tab === "school" && (
          <div className="space-y-4">
            {podiumNote ? (
              <EmptyLeaderboardState
                title="Complete your profile to join a school leaderboard"
                message={podiumNote}
                actionLabel="Complete Profile"
                onAction={() => navigate("/profile")}
              />
            ) : schoolLoading ? (
              <p className="text-sm text-text-muted text-center py-10">
                Loading...
              </p>
            ) : schoolRows.length === 0 ? (
              <EmptyLeaderboardState
                title="No classmates here yet"
                message="Classmates will appear after they choose the same school in their profile."
              />
            ) : (
              <>
                <LeaderboardSummaryCard
                  rows={schoolRows}
                  meId={userId}
                  label="To next rank"
                />
                <div className="app-soft-panel p-2">
                  <LeaderboardList rows={schoolRows} meId={userId} />
                </div>
              </>
            )}
          </div>
        )}

        {tab === "groups" && (
          <div className="space-y-5">
            {/* Create / join */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="app-panel p-5">
                <p className="text-sm font-semibold text-text mb-2">
                  Create a group
                </p>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button
                    onClick={handleCreate}
                    className="px-3 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="app-panel p-5">
                <p className="text-sm font-semibold text-text mb-2">
                  Join with code
                </p>
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} uppercase`}
                    placeholder="e.g. AB3K9P"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                  <button
                    onClick={handleJoin}
                    className="px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {groupError && (
              <p className="text-sm text-error">{groupError}</p>
            )}

            {/* Group selector */}
            {groups.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      activeGroup?.id === g.id
                        ? "bg-primary text-white"
                        : "bg-canvas border border-border text-text-muted hover:bg-surface"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {activeGroup && (
              <>
                <div className="app-callout flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {activeGroup.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      Invite code:{" "}
                      <span className="font-mono font-semibold text-primary">
                        {activeGroup.invite_code}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas border border-border text-sm font-medium text-text hover:bg-surface transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {groupRows.length > 0 && (
                  <LeaderboardSummaryCard
                    rows={groupRows}
                    meId={userId}
                    label="To next rank"
                  />
                )}

                <div className="app-soft-panel p-2">
                  {groupRows.length === 0 ? (
                    <EmptyLeaderboardState
                      title="No group participants yet"
                      message="Members will appear here after they join the group and log internship hours."
                    />
                  ) : (
                    <LeaderboardList rows={groupRows} meId={userId} />
                  )}
                </div>
              </>
            )}

            {groups.length === 0 && (
              <EmptyLeaderboardState
                title="You're not in any groups yet"
                message="Create a group for your section or join one with an invite code to compare progress."
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
