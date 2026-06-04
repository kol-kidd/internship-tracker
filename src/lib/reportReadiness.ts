import { hasCompleteTime, hasInvalidTimeRange } from "@/lib/hours";
import type { Profile } from "@/store/profileStore";

export interface ReadinessEntry {
  id: number;
  title: string;
  content: string;
  tags: string[];
  time_in: string | null;
  time_out: string | null;
  break_time: number | string | null;
}

export interface ReadinessImage {
  journal_entry_id: number | null;
}

export type ReadinessTarget = "entries" | "evidence" | "reports" | "profile";

export interface ReadinessIssue {
  key: "no_entries" | "profile" | "time" | "evidence" | "detail" | "tags";
  label: string;
  count: number;
  message: string;
  target: ReadinessTarget;
}

export interface ReportReadinessSummary {
  totalEntries: number;
  readyEntries: number;
  totalEvidence: number;
  missingTimeCount: number;
  missingEvidenceCount: number;
  lowDetailCount: number;
  missingTagsCount: number;
  profileIssueCount: number;
  isReady: boolean;
  headline: string;
  description: string;
  issues: ReadinessIssue[];
}

const LOW_DETAIL_WORD_LIMIT = 25;

export function buildGalleryByEntryId(images: ReadinessImage[]) {
  return images.reduce((map, image) => {
    if (image.journal_entry_id == null) return map;
    map.set(image.journal_entry_id, (map.get(image.journal_entry_id) ?? 0) + 1);
    return map;
  }, new Map<number, number>());
}

function isLowDetail(entry: ReadinessEntry) {
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
  return wordCount > 0 && wordCount < LOW_DETAIL_WORD_LIMIT;
}

export function getReportReadiness(params: {
  entries: ReadinessEntry[];
  images: ReadinessImage[];
  profile?: Profile | null;
}): ReportReadinessSummary {
  const { entries, images, profile } = params;
  const galleryByEntryId = buildGalleryByEntryId(images);
  const profileIssues = [
    !profile?.full_name,
    !profile?.school,
    !profile?.course,
  ].filter(Boolean).length;

  const missingTime = entries.filter(
    (entry) =>
      !hasCompleteTime(entry) ||
      hasInvalidTimeRange(entry.time_in, entry.time_out, entry.break_time),
  );
  const missingEvidence = entries.filter(
    (entry) => (galleryByEntryId.get(entry.id) ?? 0) === 0,
  );
  const lowDetail = entries.filter(isLowDetail);
  const missingTags = entries.filter((entry) => entry.tags.length === 0);

  const issues: ReadinessIssue[] = [];

  if (entries.length === 0) {
    issues.push({
      key: "no_entries",
      label: "No journal entries",
      count: 0,
      message: "Start with today's log so Reports has something to export.",
      target: "entries",
    });
  }

  if (profileIssues > 0) {
    issues.push({
      key: "profile",
      label: "Profile details",
      count: profileIssues,
      message: "Complete name, school, and course for report headers.",
      target: "profile",
    });
  }

  if (missingTime.length > 0) {
    issues.push({
      key: "time",
      label: "Time logs",
      count: missingTime.length,
      message: "Add valid time in and time out values.",
      target: "entries",
    });
  }

  if (missingEvidence.length > 0) {
    issues.push({
      key: "evidence",
      label: "Proof of work",
      count: missingEvidence.length,
      message: "Attach at least one proof image to each report entry.",
      target: "evidence",
    });
  }

  if (lowDetail.length > 0) {
    issues.push({
      key: "detail",
      label: "Entry detail",
      count: lowDetail.length,
      message: "Expand short entries before exporting reports.",
      target: "entries",
    });
  }

  if (missingTags.length > 0) {
    issues.push({
      key: "tags",
      label: "Tags",
      count: missingTags.length,
      message: "Add tags so weekly and CTU summaries are easier to scan.",
      target: "entries",
    });
  }

  const readyEntries = entries.filter(
    (entry) =>
      hasCompleteTime(entry) &&
      !hasInvalidTimeRange(entry.time_in, entry.time_out, entry.break_time) &&
      (galleryByEntryId.get(entry.id) ?? 0) > 0 &&
      !isLowDetail(entry) &&
      entry.tags.length > 0,
  ).length;

  const isReady = entries.length > 0 && issues.length === 0;
  const firstIssue = issues[0];

  return {
    totalEntries: entries.length,
    readyEntries,
    totalEvidence: images.filter((image) => image.journal_entry_id != null).length,
    missingTimeCount: missingTime.length,
    missingEvidenceCount: missingEvidence.length,
    lowDetailCount: lowDetail.length,
    missingTagsCount: missingTags.length,
    profileIssueCount: profileIssues,
    isReady,
    headline: isReady
      ? "Reports are ready"
      : firstIssue?.label ?? "Reports need review",
    description: isReady
      ? "Your current scope has time, detail, tags, evidence, and profile data ready for export."
      : firstIssue?.message ?? "Review the current journal scope before exporting.",
    issues,
  };
}
