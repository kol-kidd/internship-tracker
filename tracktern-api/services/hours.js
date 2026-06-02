import { supabase } from "../config/supabase.js";

/** Mirror of the frontend calculateHours (Logs.tsx): hours per entry from
 *  time_in/time_out minus break minutes. Returns 0 if times are missing. */
function entryHours(timeIn, timeOut, breakTime) {
  if (!timeIn || !timeOut) return 0;
  const [inH, inM] = String(timeIn).split(":").map(Number);
  const [outH, outM] = String(timeOut).split(":").map(Number);
  if ([inH, inM, outH, outM].some((n) => Number.isNaN(n))) return 0;
  const breakMinutes = Number(breakTime) || 0;
  const totalMinutes = outH * 60 + outM - (inH * 60 + inM) - breakMinutes;
  return Math.max(0, totalMinutes / 60);
}

function normalizeEntryDate(value) {
  if (!value) return null;

  const raw = String(value);
  const datePrefix = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().split("T")[0];
}

function latestLoggedEntryDate(entries) {
  return entries.reduce((latest, entry) => {
    if (entry.loggedHours <= 0) return latest;

    const entryDate = normalizeEntryDate(entry.date);
    if (!entryDate) return latest;

    return !latest || entryDate > latest ? entryDate : latest;
  }, null);
}

function completedAtFromLogDate(date) {
  // Store noon UTC so date-only certificate rendering does not drift by timezone.
  return `${date}T12:00:00.000Z`;
}

function sameDatePrefix(left, right) {
  return normalizeEntryDate(left) === normalizeEntryDate(right);
}

/**
 * Recomputes the user's total logged hours from journal_entries and syncs
 * profiles.total_hours. Sets hours_completed_at from the latest dated log
 * once the total reaches required_hours.
 *
 * @returns {Promise<{ profile: object|null, justCompleted: boolean }>}
 */
export async function recomputeUserHours(userId) {
  const { data: entries, error: entriesError } = await supabase
    .from("journal_entries")
    .select("date, time_in, time_out, break_time")
    .eq("user_id", userId);

  if (entriesError) {
    console.error("recomputeUserHours entries error:", entriesError.message);
    return { profile: null, justCompleted: false };
  }

  const entriesWithHours = (entries || []).map((entry) => ({
    ...entry,
    loggedHours: entryHours(entry.time_in, entry.time_out, entry.break_time),
  }));
  const total = entriesWithHours.reduce(
    (sum, entry) => sum + entry.loggedHours,
    0,
  );
  const totalRounded = Math.round(total * 100) / 100;
  const completionLogDate = latestLoggedEntryDate(entriesWithHours);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, school, course, required_hours, total_hours, hours_completed_at, completion_emailed_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("recomputeUserHours profile error:", profileError?.message);
    return { profile: null, justCompleted: false };
  }

  const required = profile.required_hours ?? 702;
  const alreadyCompleted = !!profile.hours_completed_at;
  const nowCompleted = totalRounded >= required;
  const justCompleted = !alreadyCompleted && nowCompleted;

  const update = { total_hours: totalRounded };
  if (nowCompleted && completionLogDate) {
    const logCompletedAt = completedAtFromLogDate(completionLogDate);
    if (!sameDatePrefix(profile.hours_completed_at, logCompletedAt)) {
      update.hours_completed_at = logCompletedAt;
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  if (updateError) {
    console.error("recomputeUserHours update error:", updateError.message);
    return { profile, justCompleted };
  }

  return { profile: updated, justCompleted };
}
