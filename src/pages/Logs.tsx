import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Clock,
  Download,
  Filter,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  Wand2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Tag,
  Zap,
  FileEdit,
  AlignLeft,
  CalendarRange,
  ClipboardList,
} from "lucide-react";
import SEO from "@/components/SEO";
import { jsPDF } from "jspdf";
import { useAuthStore } from "@/store/authStore";
import { useJournalStore } from "@/store/journalStore";
import { Bounce, toast } from "react-toastify";
import LoadingOverlay from "@/components/Loading";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";
import {
  enhanceJournalEntry,
  suggestTags,
  summarizeWeek,
  type EnhanceType,
} from "@/functions/ai/journalAI";
import { getWeekBounds, isDateInWeekBounds } from "@/lib/weekUtils";

interface JournalEntry {
  id: number;
  user_id: string;
  title: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
  time_in: string | null;
  time_out: string | null;
  break_time: number | null;
  created_at: string;
  updated_at: string;
}

const LogsPage = () => {
  const { user, session } = useAuthStore();
  const { entries, loading, initSocket, addEntry, updateEntry, deleteEntry } =
    useJournalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState("");
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
    mood: "neutral",
    tags: "",
    time_in: "",
    time_out: "",
    break_time: "",
  });

  // AI Enhancement State
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  const [requiredHours, setRequiredHours] = useState(() => {
    const saved = localStorage.getItem("internship_required_hours");
    return saved ? Number(saved) : 702;
  });

  const [weeklyReportMode, setWeeklyReportMode] = useState<"view" | "new">(
    "view"
  );
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [weeklySummaryLoading, setWeeklySummaryLoading] = useState(false);
  const [weeklyLogContent, setWeeklyLogContent] = useState("");
  const [weeklyLogSaving, setWeeklyLogSaving] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [weeklyReportDrawerOpen, setWeeklyReportDrawerOpen] = useState(true);

  const handleRequiredHoursChange = (value: string) => {
    const hours = Number(value) || 0;
    setRequiredHours(hours);
    localStorage.setItem("internship_required_hours", String(hours));
  };

  // AI Enhancement Functions
  const handleAIEnhance = async (enhanceType: EnhanceType) => {
    if (!formData.content.trim()) {
      toast.error("Please write some content first", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication required", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    setIsEnhancing(true);
    setShowAIMenu(false);

    try {
      if (!originalContent) {
        setOriginalContent(formData.content);
      }

      const result = await enhanceJournalEntry(
        formData.content,
        formData.title,
        enhanceType,
        session.access_token
      );

      setFormData((prev) => ({
        ...prev,
        content: result.enhancedContent,
      }));

      const typeLabels: Record<EnhanceType, string> = {
        improve: "improved",
        expand: "expanded",
        professional: "made professional",
        summarize: "summarized",
      };

      toast.success(`Content ${typeLabels[enhanceType]} with AI!`, {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error("AI Enhancement Error:", error);
      toast.error("Failed to enhance content. Please try again.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAISuggestTags = async () => {
    if (!formData.content.trim()) {
      toast.error("Please write some content first", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication required", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    setIsEnhancing(true);
    setShowAIMenu(false);

    try {
      const tags = await suggestTags(
        formData.content,
        formData.title,
        session.access_token
      );

      const existingTags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const allTags = [...new Set([...existingTags, ...tags])];

      setFormData((prev) => ({
        ...prev,
        tags: allTags.join(", "),
      }));

      toast.success(`Added ${tags.length} AI-suggested tags!`, {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error("AI Tag Suggestion Error:", error);
      toast.error("Failed to suggest tags. Please try again.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRevertContent = () => {
    if (originalContent) {
      setFormData((prev) => ({
        ...prev,
        content: originalContent,
      }));
      setOriginalContent(null);
      toast.info("Reverted to original content", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  useEffect(() => {
    if (user?.id) {
      initSocket();
    }
  }, [user?.id, initSocket]);

  useEffect(() => {
    const name =
      (user?.user_metadata?.full_name as string) || (user?.email ?? "");
    if (name && !reportName) setReportName(name);
  }, [user?.user_metadata?.full_name, user?.email, reportName]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.content || !formData.date) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    if (!user?.id) return;

    try {
      setSaving(true);
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      if (editingEntry) {
        await updateEntry(editingEntry.id, {
          title: formData.title,
          date: formData.date,
          content: formData.content,
          mood: formData.mood,
          tags: tagsArray,
          time_in: formData.time_in || null,
          time_out: formData.time_out || null,
          break_time: formData.break_time ? Number(formData.break_time) : null,
        });

        toast.success("Entry updated successfully", {
          position: "top-right",
          theme: "light",
          transition: Bounce,
        });
      } else {
        await addEntry({
          title: formData.title,
          date: formData.date,
          content: formData.content,
          mood: formData.mood,
          tags: tagsArray,
          time_in: formData.time_in || null,
          time_out: formData.time_out || null,
          break_time: formData.break_time ? Number(formData.break_time) : null,
        });

        toast.success("Entry created successfully", {
          position: "top-right",
          theme: "light",
          transition: Bounce,
        });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      toast.error("Failed to save entry", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      content: "",
      mood: "neutral",
      tags: "",
      time_in: "",
      time_out: "",
      break_time: "",
    });
    setEditingEntry(null);
    setIsModalOpen(false);
    setOriginalContent(null);
    setShowAIMenu(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      date: entry.date,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags.join(", "),
      time_in: entry.time_in || "",
      time_out: entry.time_out || "",
      break_time: entry.break_time ? String(entry.break_time) : "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number, title: string) => {
    setSelectedEntryId(id);
    setSelectedEntryTitle(title);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async (confirmed: boolean) => {
    setDeleteDialogOpen(false);

    if (!confirmed || !selectedEntryId || !user?.id) return;

    try {
      setSaving(true);
      await deleteEntry(selectedEntryId);

      toast.success("Entry deleted successfully", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setSaving(false);
      setSelectedEntryId(null);
      setSelectedEntryTitle("");
    }
  };

  const calculateHours = (
    timeIn: string,
    timeOut: string,
    breakTime?: number | null
  ) => {
    if (!timeIn || !timeOut) return 0;
    const [inHour, inMin] = timeIn.split(":").map(Number);
    const [outHour, outMin] = timeOut.split(":").map(Number);
    const breakMinutes = breakTime || 0;
    const totalMinutes =
      outHour * 60 + outMin - (inHour * 60 + inMin) - breakMinutes;
    return Math.max(0, totalMinutes / 60);
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hour] = time.split(":").map(Number);
    const period = hour >= 12 ? "pm" : "am";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  const formatReportDay = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTimeForTable = (time: string | null) => {
    if (!time) return "—";
    const parts = time.split(":").map(Number);
    const hour = parts[0] ?? 0;
    const min = parts[1] ?? 0;
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
  };

  const totalHoursLogged = entries.reduce((total, entry) => {
    if (entry.time_in && entry.time_out) {
      const hours = calculateHours(
        entry.time_in,
        entry.time_out,
        entry.break_time
      );
      return total + hours;
    }
    return total;
  }, 0);

  const hoursRemaining = Math.max(0, requiredHours - totalHoursLogged);
  const progressPercent =
    requiredHours > 0
      ? Math.min(100, (totalHoursLogged / requiredHours) * 100)
      : 0;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesMood = filterMood === "all" || entry.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  const moodEmojis: Record<string, string> = {
    great: "😊",
    good: "🙂",
    neutral: "😐",
    challenging: "😔",
    stressful: "😰",
  };

  const moodConfig: Record<
    string,
    { label: string; color: string; gradient: string }
  > = {
    great: {
      label: "Great",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      gradient: "from-emerald-500 to-emerald-600",
    },
    good: {
      label: "Good",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      gradient: "from-blue-500 to-blue-600",
    },
    neutral: {
      label: "Neutral",
      color: "bg-gray-100 text-gray-700 border-gray-200",
      gradient: "from-gray-500 to-gray-600",
    },
    challenging: {
      label: "Challenging",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      gradient: "from-amber-500 to-amber-600",
    },
    stressful: {
      label: "Stressful",
      color: "bg-red-100 text-red-700 border-red-200",
      gradient: "from-red-500 to-red-600",
    },
  };

  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weekBounds = getWeekBounds(new Date(selectedWeekDate));
  const entriesForSelectedWeek = entries.filter((e) =>
    isDateInWeekBounds(e.date, weekBounds)
  );

  const handleGenerateWeeklySummary = async () => {
    const entriesToSummarize = entries.filter((e) =>
      isDateInWeekBounds(e.date, weekBounds)
    );
    if (entriesToSummarize.length === 0 || !session?.access_token) {
      if (entriesToSummarize.length === 0) {
        toast.error(
          "No entries in this week. Add entries or pick another week.",
          {
            position: "top-right",
            theme: "light",
            transition: Bounce,
          }
        );
      }
      return;
    }
    setWeeklySummaryLoading(true);
    setWeeklySummary(null);
    try {
      const payload = entriesToSummarize.map((e) => {
        const entry: Record<string, unknown> = {
          title: e.title ?? "",
          content: e.content ?? "",
          tags: Array.isArray(e.tags) ? e.tags : [],
        };
        if (e.date && String(e.date).trim()) entry.date = e.date;
        if (e.mood && String(e.mood).trim()) entry.mood = e.mood;
        if (e.time_in && String(e.time_in).trim()) entry.time_in = e.time_in;
        if (e.time_out && String(e.time_out).trim())
          entry.time_out = e.time_out;
        if (typeof e.break_time === "number") entry.break_time = e.break_time;
        return entry;
      });
      const summary = await summarizeWeek(
        payload as Parameters<typeof summarizeWeek>[0],
        session.access_token
      );
      setWeeklySummary(summary);
      toast.success("Weekly summary generated", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error("Weekly summary error:", error);
      toast.error("Failed to generate weekly summary. Try again.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setWeeklySummaryLoading(false);
    }
  };

  const handleSaveWeeklyLog = async () => {
    if (!weeklyLogContent.trim() || !user?.id) return;
    const startDate = new Date(weekBounds.start);
    const endDate = new Date(weekBounds.end);
    const title = `Week of ${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
    setWeeklyLogSaving(true);
    try {
      await addEntry({
        title,
        date: weekBounds.start,
        content: weeklyLogContent.trim(),
        mood: "neutral",
        tags: [],
        time_in: null,
        time_out: null,
        break_time: null,
      });
      setWeeklyLogContent("");
      setWeeklySummary(null);
      toast.success("Weekly log saved", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (error) {
      console.error("Save weekly log error:", error);
      toast.error("Failed to save weekly log", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setWeeklyLogSaving(false);
    }
  };

  const exportWeeklyReportToPDF = () => {
    const hasEntries = entriesForSelectedWeek.length > 0;
    const hasSummary = Boolean(weeklySummary?.trim());

    if (!hasEntries && !hasSummary) {
      toast.error(
        "Nothing to export. Add entries or generate an AI summary first.",
        {
          position: "top-right",
          theme: "light",
          transition: Bounce,
        }
      );
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let y = margin;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text("Weekly", margin, y);
    doc.setTextColor(30, 27, 75);
    doc.text(" Report", margin + doc.getTextWidth("Weekly"), y);
    y += 14;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(`NAME: ${reportName || "—"}`, margin, y);
    y += 6;
    doc.text(`DATE: ${reportDate}`, margin, y);
    y += 14;

    doc.setFontSize(12);
    doc.setTextColor(30, 27, 75);
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT PROGRESS REPORT", margin, y);
    y += 10;

    const colWidths = [38, 26, 26, 20, 20, contentWidth - 130];
    const headers = [
      "Day",
      "Project Phase",
      "Assigned To",
      "Start Time",
      "End Time",
      "Task",
    ];
    const rowHeight = 8;
    const headerBg = [124, 58, 237];

    let x = margin;
    doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
    doc.rect(margin, y - 5, contentWidth, rowHeight + 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 2);
      x += colWidths[i];
    });
    y += rowHeight + 4;

    const sortedEntries = [...entriesForSelectedWeek].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const formatDayPDF = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    const formatTimePDF = (time: string | null) => {
      if (!time) return "—";
      const parts = time.split(":").map(Number);
      const hour = parts[0] ?? 0;
      const min = parts[1] ?? 0;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
    };

    sortedEntries.forEach((entry) => {
      if (y + rowHeight > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }
      doc.setDrawColor(221, 214, 254);
      doc.setFillColor(250, 250, 255);
      doc.rect(margin, y - 4, contentWidth, rowHeight + 2, "FD");
      doc.setTextColor(30, 27, 75);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let rowX = margin;
      const dayStr = formatDayPDF(entry.date);
      const cells = [
        dayStr.length > 22 ? dayStr.slice(0, 21) + "…" : dayStr,
        entry.tags?.[0] ?? "Daily log",
        reportName || "—",
        formatTimePDF(entry.time_in),
        formatTimePDF(entry.time_out),
        entry.title.length > 28 ? entry.title.slice(0, 27) + "…" : entry.title,
      ];
      cells.forEach((cell, i) => {
        const w = colWidths[i];
        const text = doc.splitTextToSize(cell, w - 4);
        doc.text(text[0] ?? "", rowX + 2, y + 2);
        rowX += w;
      });
      y += rowHeight + 4;
    });

    if (!hasEntries) {
      doc.setDrawColor(221, 214, 254);
      doc.setFillColor(250, 250, 255);
      doc.rect(margin, y - 4, contentWidth, rowHeight + 2, "FD");
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text("No entries for this week.", margin + 4, y + 2);
      y += rowHeight + 8;
    }

    y += 8;
    if (y + 20 > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(30, 27, 75);
    doc.setFont("helvetica", "bold");
    doc.text("CONCLUSION", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    const conclusionText = hasSummary
      ? weeklySummary ?? ""
      : "No summary generated for this week. Generate an AI summary from this week's entries to populate the conclusion.";
    const conclusionLines = doc.splitTextToSize(conclusionText, contentWidth);
    const lineHeight = 5.5;
    conclusionLines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - 25) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(180);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    const fileName = `weekly-report-${weekBounds.start}-to-${weekBounds.end}.pdf`;
    doc.save(fileName);

    toast.success("Weekly report exported to PDF", {
      position: "top-right",
      theme: "light",
      transition: Bounce,
    });
  };

  const exportToPDF = () => {
    if (filteredEntries.length === 0) {
      toast.error("No entries to export", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    const sortedEntries = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedEntries.forEach((entry, index) => {
      if (index > 0) doc.addPage();

      let yPosition = margin;

      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text(
        `Day ${index + 1} of ${sortedEntries.length}`,
        margin,
        yPosition
      );
      yPosition += 10;

      doc.setFontSize(20);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(entry.title, contentWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8 + 5;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);

      const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      doc.text(dateStr, margin, yPosition);
      yPosition += 6;

      if (entry.time_in && entry.time_out) {
        const hours = calculateHours(
          entry.time_in,
          entry.time_out,
          entry.break_time
        );
        let timeStr = `${formatTime(entry.time_in)} - ${formatTime(
          entry.time_out
        )}`;
        if (entry.break_time) timeStr += ` | ${entry.break_time} min break`;
        timeStr += ` | ${hours.toFixed(1)} hours`;
        doc.text(timeStr, margin, yPosition);
        yPosition += 6;
      }

      const moodText = `Mood: ${moodEmojis[entry.mood] || ""} ${entry.mood}`;
      doc.text(moodText, margin, yPosition);
      yPosition += 12;

      doc.setDrawColor(220);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.setFont("helvetica", "normal");

      const contentLines = doc.splitTextToSize(entry.content, contentWidth);
      const lineHeight = 5.5;

      contentLines.forEach((line: string) => {
        if (yPosition + lineHeight < pageHeight - 40) {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
      });

      if (entry.tags.length > 0) {
        yPosition = Math.max(yPosition + 10, pageHeight - 35);
        doc.setFontSize(9);
        doc.setTextColor(120);
        const tagsStr = entry.tags.map((tag) => `#${tag}`).join("  ");
        const tagLines = doc.splitTextToSize(tagsStr, contentWidth);
        doc.text(tagLines.slice(0, 2), margin, yPosition);
      }

      doc.setFontSize(9);
      doc.setTextColor(180);
      doc.text(
        `Page ${index + 1} of ${sortedEntries.length}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    });

    const fileName = `internship-journal-${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    toast.success(`Exported ${sortedEntries.length} entries to PDF`, {
      position: "top-right",
      theme: "light",
      transition: Bounce,
    });
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFF] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#38BDF8] animate-ping" />
          </div>
          <p className="text-[#1E1B4B]/60">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Journal"
        description="Document your internship journey with AI-enhanced journal entries. Track hours, reflect on experiences, and grow professionally."
      />
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[#DDD6FE]/30 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span className="text-xs font-medium text-[#38BDF8] uppercase tracking-wider">
                    Journal
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#1E1B4B]">
                  Internship Journal
                </h1>
                <p className="text-[#1E1B4B]/60 mt-1">
                  Document your journey, reflections, and daily experiences
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={exportToPDF}
                  disabled={filteredEntries.length === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] text-sm font-medium hover:bg-[#DDD6FE]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-linear-to-r from-[#7C3AED] to-[#A78BFA] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Entry
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1B4B]/40" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#DDD6FE]/50 flex items-center justify-center hover:bg-[#DDD6FE] transition-colors"
                  >
                    <X className="w-3 h-3 text-[#1E1B4B]/60" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  showFilters
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED] hover:bg-[#DDD6FE]/20"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter
                {filterMood !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                )}
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-[#FAFAFF] rounded-xl border border-[#DDD6FE]/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  <span className="text-sm font-medium text-[#1E1B4B]">
                    Filter by Mood
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterMood("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterMood === "all"
                        ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                        : "bg-white border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED]"
                    }`}
                  >
                    All ({entries.length})
                  </button>
                  {Object.entries(moodConfig).map(([mood, config]) => (
                    <button
                      key={mood}
                      onClick={() => setFilterMood(mood)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        filterMood === mood
                          ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                          : "bg-white border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED]"
                      }`}
                    >
                      <span>{moodEmojis[mood]}</span>
                      {config.label} ({moodCounts[mood] || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-5 hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-[#1E1B4B]/60">Total Entries</span>
              </div>
              <p className="text-3xl font-bold text-[#1E1B4B]">
                {entries.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-5 hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#38BDF8] to-[#7DD3FC] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-[#1E1B4B]/60">Hours Logged</span>
              </div>
              <p className="text-3xl font-bold text-[#1E1B4B]">
                {totalHoursLogged.toFixed(1)}h
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-5 hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#F472B6] to-[#FB7185] flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1E1B4B]/60">Remaining</span>
                    <div className="flex items-center gap-1 text-xs text-[#1E1B4B]/40">
                      <span>of</span>
                      <input
                        type="number"
                        value={requiredHours}
                        onChange={(e) =>
                          handleRequiredHoursChange(e.target.value)
                        }
                        className="w-14 px-1.5 py-0.5 border border-[#DDD6FE]/50 rounded text-center text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED]"
                        min="0"
                      />
                      <span>hrs</span>
                    </div>
                  </div>
                </div>
              </div>
              <p
                className={`text-3xl font-bold ${
                  hoursRemaining > 0 ? "text-[#F472B6]" : "text-emerald-500"
                }`}
              >
                {hoursRemaining.toFixed(1)}h
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-5 hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#34D399] to-[#6EE7B7] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-[#1E1B4B]/60">Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-[#1E1B4B]">
                  {progressPercent.toFixed(0)}%
                </p>
                <div className="flex-1 h-2 bg-[#DDD6FE]/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#7C3AED] to-[#38BDF8] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Report - drawer */}
          <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 mb-8 text-[#1E1B4B] overflow-hidden shadow-lg shadow-[#7C3AED]/5">
            <button
              type="button"
              onClick={() => setWeeklyReportDrawerOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[#DDD6FE]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-inset rounded-t-2xl"
              aria-expanded={weeklyReportDrawerOpen}
              aria-controls="weekly-report-content"
              id="weekly-report-drawer-label"
            >
              <h2 className="text-xl font-bold">
                <span className="text-[#7C3AED]">Weekly</span>{" "}
                <span className="text-[#1E1B4B]">Report</span>
              </h2>
              <span className="shrink-0 p-1 rounded-lg text-[#1E1B4B] hover:bg-[#DDD6FE]/30 transition-colors">
                {weeklyReportDrawerOpen ? (
                  <ChevronUp className="w-5 h-5" aria-hidden />
                ) : (
                  <ChevronDown className="w-5 h-5" aria-hidden />
                )}
              </span>
            </button>

            <div
              id="weekly-report-content"
              role="region"
              aria-labelledby="weekly-report-drawer-label"
              className={`transition-all duration-200 ease-out ${
                weeklyReportDrawerOpen ? "visible" : "hidden"
              }`}
            >
              <div className="px-6 pb-6 pt-0 border-t border-[#DDD6FE]/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-6">
                  <div>
                    <label className="block bg-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-t w-fit mb-0">
                      NAME
                    </label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-b rounded-tr border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                  <div>
                    <label className="block bg-[#7C3AED] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-t w-fit mb-0">
                      DATE
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-b rounded-tr border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setWeeklyReportMode("view")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      weeklyReportMode === "view"
                        ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                        : "border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED] hover:bg-[#DDD6FE]/20"
                    }`}
                  >
                    <CalendarRange className="w-4 h-4" />
                    View week
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeeklyReportMode("new")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      weeklyReportMode === "new"
                        ? "bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25"
                        : "border border-[#DDD6FE]/50 text-[#1E1B4B] hover:border-[#7C3AED] hover:bg-[#DDD6FE]/20"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    New weekly log
                  </button>
                  <div className="flex-1 flex items-center justify-end gap-2">
                    <label className="text-sm text-[#1E1B4B]/60">Week</label>
                    <input
                      type="date"
                      value={
                        weeklyReportMode === "new"
                          ? weekBounds.start
                          : selectedWeekDate
                      }
                      onChange={(e) => setSelectedWeekDate(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] text-sm focus:outline-none focus:border-[#7C3AED]"
                    />
                    <span className="text-sm text-[#1E1B4B]/60">
                      {weekBounds.start} → {weekBounds.end}
                    </span>
                  </div>
                </div>

                {/* PROJECT PROGRESS REPORT */}
                <h3 className="text-lg font-bold text-[#1E1B4B] mb-2 mt-6">
                  PROJECT PROGRESS REPORT
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#DDD6FE]/50 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#7C3AED] text-white">
                        <th className="px-3 py-2.5 text-left font-semibold">
                          Day
                        </th>
                        <th className="px-3 py-2.5 text-left font-semibold">
                          Project Phase
                        </th>
                        <th className="px-3 py-2.5 text-left font-semibold">
                          Assigned To
                        </th>
                        <th className="px-3 py-2.5 text-left font-semibold">
                          Start Time
                        </th>
                        <th className="px-3 py-2.5 text-left font-semibold">
                          End Time
                        </th>
                        <th className="px-3 py-2.5 text-left font-semibold">
                          Task
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#FAFAFF]">
                      {weeklyReportMode === "view" &&
                      entriesForSelectedWeek.length > 0 ? (
                        [...entriesForSelectedWeek]
                          .sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                          )
                          .map((e) => (
                            <tr
                              key={e.id}
                              className="border-t border-[#DDD6FE]/30 hover:bg-[#DDD6FE]/20 cursor-pointer transition-colors"
                              onClick={() => setViewingEntry(e)}
                            >
                              <td className="px-3 py-2 text-[#1E1B4B] whitespace-nowrap">
                                {formatReportDay(e.date)}
                              </td>
                              <td className="px-3 py-2 text-[#1E1B4B]">
                                {e.tags?.[0] ?? "Daily log"}
                              </td>
                              <td className="px-3 py-2 text-[#1E1B4B]">
                                {reportName || "—"}
                              </td>
                              <td className="px-3 py-2 text-[#1E1B4B] whitespace-nowrap">
                                {formatTimeForTable(e.time_in)}
                              </td>
                              <td className="px-3 py-2 text-[#1E1B4B] whitespace-nowrap">
                                {formatTimeForTable(e.time_out)}
                              </td>
                              <td className="px-3 py-2 text-[#1E1B4B]">
                                {e.title}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-8 text-center text-[#1E1B4B]/60"
                          >
                            {weeklyReportMode === "new"
                              ? "Save a weekly log or switch to View week to see entries."
                              : "No entries for this week. Add journal entries or pick another week."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CONCLUSION */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-bold text-[#1E1B4B]">
                    CONCLUSION
                  </h3>
                  {weeklySummary && (
                    <button
                      type="button"
                      onClick={() => setWeeklySummary(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#1E1B4B]/70 hover:text-[#1E1B4B] hover:bg-[#DDD6FE]/30 border border-[#DDD6FE]/50 transition-all"
                      aria-label="Clear conclusion"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="mb-4">
                  <textarea
                    readOnly
                    rows={5}
                    value={weeklySummary ?? ""}
                    placeholder="Generate an AI summary from this week's entries to see the conclusion here."
                    className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 bg-[#FAFAFF] text-[#1E1B4B] placeholder-[#1E1B4B]/40 resize-none focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {entriesForSelectedWeek.length > 0 && (
                    <button
                      type="button"
                      onClick={handleGenerateWeeklySummary}
                      disabled={weeklySummaryLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {weeklySummaryLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate AI summary
                        </>
                      )}
                    </button>
                  )}
                  {(entriesForSelectedWeek.length > 0 || weeklySummary) && (
                    <button
                      type="button"
                      onClick={exportWeeklyReportToPDF}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DDD6FE]/50 bg-white text-[#1E1B4B] text-sm font-medium hover:border-[#7C3AED] hover:bg-[#DDD6FE]/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                  )}
                </div>

                {weeklyReportMode === "new" && (
                  <div className="mt-6 pt-6 border-t border-[#DDD6FE]/30">
                    <label className="block text-sm font-semibold text-[#1E1B4B] mb-2">
                      Weekly log (one entry for the whole week)
                    </label>
                    <textarea
                      rows={4}
                      value={weeklyLogContent}
                      onChange={(e) => setWeeklyLogContent(e.target.value)}
                      placeholder="Summarize your week: tasks, learnings, challenges, hours or highlights..."
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 bg-[#FAFAFF] text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWeeklyLog}
                      disabled={!weeklyLogContent.trim() || weeklyLogSaving}
                      className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-medium hover:bg-[#6D28D9] hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {weeklyLogSaving ? "Saving..." : "Save weekly log"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entries Grid */}
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DDD6FE]/50 p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#DDD6FE]/50 to-[#FAFAFF] flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-[#7C3AED]/40" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#1E1B4B] mb-2">
                No journal entries found
              </h3>
              <p className="text-[#1E1B4B]/60 mb-6 max-w-md mx-auto">
                {searchQuery || filterMood !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Start documenting your internship journey today!"}
              </p>
              {!searchQuery && filterMood === "all" && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#7C3AED] to-[#A78BFA] text-white font-medium hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Entry
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setViewingEntry(entry)}
                  className="group bg-white rounded-2xl border border-[#DDD6FE]/50 p-5 hover:border-[#7C3AED]/30 hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1E1B4B] truncate group-hover:text-[#7C3AED] transition-colors">
                        {entry.title}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 ml-2 px-2 py-1 rounded-lg text-xs font-medium ${
                        moodConfig[entry.mood]?.color || "bg-gray-100"
                      }`}
                    >
                      {moodEmojis[entry.mood]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#1E1B4B]/50 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {entry.time_in && entry.time_out && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {calculateHours(
                            entry.time_in,
                            entry.time_out,
                            entry.break_time
                          ).toFixed(1)}
                          h
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-[#1E1B4B]/60 line-clamp-2 mb-3">
                    {entry.content}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DDD6FE]/30">
                    <div className="flex gap-1 overflow-hidden">
                      {entry.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-[#FAFAFF] text-[#1E1B4B]/60 rounded text-xs truncate max-w-[70px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 2 && (
                        <span className="text-xs text-[#1E1B4B]/40">
                          +{entry.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(entry);
                        }}
                        className="p-1.5 text-[#1E1B4B]/50 hover:text-[#7C3AED] hover:bg-[#DDD6FE]/30 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(entry.id, entry.title);
                        }}
                        className="p-1.5 text-[#1E1B4B]/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#1E1B4B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#DDD6FE]/30 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1E1B4B]">
                  {editingEntry ? "Edit Entry" : "New Journal Entry"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-[#DDD6FE]/30 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#1E1B4B]/60" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="What happened today?"
                    className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                      Mood *
                    </label>
                    <select
                      value={formData.mood}
                      onChange={(e) =>
                        setFormData({ ...formData, mood: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                    >
                      <option value="great">😊 Great</option>
                      <option value="good">🙂 Good</option>
                      <option value="neutral">😐 Neutral</option>
                      <option value="challenging">😔 Challenging</option>
                      <option value="stressful">😰 Stressful</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                      Time In
                    </label>
                    <input
                      type="time"
                      value={formData.time_in}
                      onChange={(e) =>
                        setFormData({ ...formData, time_in: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                      Time Out
                    </label>
                    <input
                      type="time"
                      value={formData.time_out}
                      onChange={(e) =>
                        setFormData({ ...formData, time_out: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B4B] mb-2">
                      Break (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.break_time}
                      onChange={(e) =>
                        setFormData({ ...formData, break_time: e.target.value })
                      }
                      placeholder="60"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Entry *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAIMenu(!showAIMenu)}
                        disabled={isEnhancing || !formData.content.trim()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r from-[#38BDF8] to-[#7DD3FC] text-white text-xs font-medium hover:shadow-md hover:shadow-[#38BDF8]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEnhancing ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3 h-3" />
                            AI Enhance
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>

                      {showAIMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[#DDD6FE]/50 shadow-lg shadow-[#7C3AED]/10 z-10 overflow-hidden">
                          <div className="p-2">
                            <div className="text-xs font-medium text-[#1E1B4B]/40 px-3 py-1.5 uppercase tracking-wide">
                              AI Actions
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAIEnhance("improve")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#1E1B4B] hover:bg-[#DDD6FE]/30 rounded-lg transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                                <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  Improve Writing
                                </div>
                                <div className="text-xs text-[#1E1B4B]/50">
                                  Fix grammar & clarity
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAIEnhance("expand")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#1E1B4B] hover:bg-[#DDD6FE]/30 rounded-lg transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center">
                                <FileEdit className="w-3.5 h-3.5 text-[#38BDF8]" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  Expand Content
                                </div>
                                <div className="text-xs text-[#1E1B4B]/50">
                                  Add more detail & depth
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAIEnhance("professional")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#1E1B4B] hover:bg-[#DDD6FE]/30 rounded-lg transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  Make Professional
                                </div>
                                <div className="text-xs text-[#1E1B4B]/50">
                                  Portfolio-ready style
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAIEnhance("summarize")}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#1E1B4B] hover:bg-[#DDD6FE]/30 rounded-lg transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <div>
                                <div className="font-medium">Summarize</div>
                                <div className="text-xs text-[#1E1B4B]/50">
                                  Brief key points
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Write about your day, what you learned, challenges faced..."
                    className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all resize-none"
                  />

                  {originalContent && (
                    <button
                      type="button"
                      onClick={handleRevertContent}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Revert to original
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#1E1B4B]">
                      Tags (comma-separated)
                    </label>
                    <button
                      type="button"
                      onClick={handleAISuggestTags}
                      disabled={isEnhancing || !formData.content.trim()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Tag className="w-3 h-3" />
                      AI Suggest
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="learning, meeting, project, milestone"
                    className="w-full px-4 py-3 rounded-xl border border-[#DDD6FE]/50 text-[#1E1B4B] placeholder-[#1E1B4B]/40 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-[#7C3AED] to-[#A78BFA] text-white font-medium hover:shadow-lg hover:shadow-[#7C3AED]/25 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {editingEntry ? "Update Entry" : "Save Entry"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-xl border border-[#DDD6FE] text-[#1E1B4B] font-medium hover:bg-[#DDD6FE]/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Entry Modal */}
        {viewingEntry && (
          <div className="fixed inset-0 bg-[#1E1B4B]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-[#DDD6FE]/30 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#1E1B4B] truncate pr-4">
                  {viewingEntry.title}
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      handleEdit(viewingEntry);
                      setViewingEntry(null);
                    }}
                    className="p-2 hover:bg-[#DDD6FE]/30 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-5 h-5 text-[#7C3AED]" />
                  </button>
                  <button
                    onClick={() => setViewingEntry(null)}
                    className="p-2 hover:bg-[#DDD6FE]/30 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#1E1B4B]/60" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-[#1E1B4B]/60">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(viewingEntry.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {viewingEntry.time_in && viewingEntry.time_out && (
                    <div className="flex items-center gap-2 text-[#1E1B4B]/60">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(viewingEntry.time_in)} -{" "}
                        {formatTime(viewingEntry.time_out)}
                        {viewingEntry.break_time
                          ? ` • ${viewingEntry.break_time}min break`
                          : ""}{" "}
                        •{" "}
                        {calculateHours(
                          viewingEntry.time_in,
                          viewingEntry.time_out,
                          viewingEntry.break_time
                        ).toFixed(1)}{" "}
                        hours
                      </span>
                    </div>
                  )}
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      moodConfig[viewingEntry.mood]?.color || "bg-gray-100"
                    }`}
                  >
                    {moodEmojis[viewingEntry.mood]} {viewingEntry.mood}
                  </span>
                </div>

                <div className="bg-[#FAFAFF] rounded-xl p-5 mb-6">
                  <p className="text-[#1E1B4B] whitespace-pre-wrap leading-relaxed">
                    {viewingEntry.content}
                  </p>
                </div>

                {viewingEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewingEntry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#DDD6FE]/30 text-[#7C3AED] rounded-lg text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleDelete}
          itemName={selectedEntryTitle}
        />
        <LoadingOverlay open={saving} message="Processing..." />
      </div>
    </>
  );
};

export default LogsPage;
