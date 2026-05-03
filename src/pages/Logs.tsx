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
  Sparkles,
  Wand2,
  ChevronDown,
  RefreshCw,
  Tag,
  Zap,
  FileEdit,
  AlignLeft,
  CalendarRange,
  ClipboardList,
  StickyNote,
  ImagePlus,
  Merge,
  Upload,
  Filter,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import SEO from "@/components/SEO";
import TimePickerInput from "@/components/TimePickerInput";
import { getDefaultTimes } from "@/components/timePickerUtils";
import { jsPDF } from "jspdf";
import { useAuthStore } from "@/store/authStore";
import { useJournalStore } from "@/store/journalStore";
import { useNotesStore } from "@/store/notesStore";
import {
  useGalleryStore,
  uploadGalleryImage,
  getGalleryForEntry,
} from "@/store/galleryStore";
import { Bounce, toast } from "react-toastify";
import LoadingOverlay from "@/components/Loading";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";
import {
  enhanceJournalEntry,
  suggestTags,
  summarizeWeek,
  compileJournalSummary,
  type EnhanceType,
} from "@/functions/ai/journalAI";
import { generateCTUJournalPDF } from "@/lib/exportCTUJournal";
import { getWeekBounds, isDateInWeekBounds } from "@/lib/weekUtils";

const PDF_LANDSCAPE_MAX_PX = 320;
const PDF_PORTRAIT_MAX_PX = 180;
const PDF_LANDSCAPE_WIDTH_MM = 80;
const PDF_PORTRAIT_WIDTH_MM = 45;
const PDF_THUMB_GAP_MM = 4;

function loadImageAsResizedDataUrl(url: string): Promise<{
  dataUrl: string;
  wMm: number;
  hMm: number;
  isLandscape: boolean;
} | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;
        const isLandscape = naturalW > naturalH;
        const maxPx = isLandscape ? PDF_LANDSCAPE_MAX_PX : PDF_PORTRAIT_MAX_PX;
        const targetWidthMm = isLandscape
          ? PDF_LANDSCAPE_WIDTH_MM
          : PDF_PORTRAIT_WIDTH_MM;

        let w = naturalW;
        let h = naturalH;
        if (w > maxPx) {
          h = (h * maxPx) / w;
          w = maxPx;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const aspectRatio = h / w;
        const wMm = targetWidthMm;
        const hMm = targetWidthMm * aspectRatio;
        resolve({ dataUrl, wMm, hMm, isLandscape });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

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

type MainView = "entries" | "weekly" | "notes" | "gallery" | "reports";

type ReportHistoryItem = {
  id: string;
  type: "Journal PDF" | "Weekly Report" | "CTU Form 6";
  title: string;
  range: string;
  entryCount: number;
  createdAt: string;
};

const REPORT_HISTORY_KEY = "internpal_report_history";

function loadReportHistory(): ReportHistoryItem[] {
  try {
    const raw = localStorage.getItem(REPORT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveReportHistory(items: ReportHistoryItem[]) {
  try {
    localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    // ignore localStorage failures
  }
}

const LogsPage = () => {
  const { user, session } = useAuthStore();
  const {
    entries,
    loading,
    initSocket,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useJournalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState("");
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  const [formData, setFormData] = useState(() => {
    const { timeIn, timeOut } = getDefaultTimes();
    return {
      title: "",
      date: new Date().toISOString().split("T")[0],
      content: "",
      mood: "neutral",
      tags: "",
      time_in: timeIn,
      time_out: timeOut,
      break_time: "",
    };
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
    "view",
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
    new Date().toISOString().slice(0, 10),
  );
  const [mainView, setMainView] = useState<MainView>("entries");

  const {
    notes,
    loading: notesLoading,
    fetchNotes,
    addNote,
    updateNote,
    deleteNote,
    mergeNotes,
  } = useNotesStore();
  const {
    images: galleryImages,
    loading: galleryLoading,
    entryImages,
    entryImagesLoading,
    fetchGallery,
    fetchEntryImages,
    clearEntryImages,
    addImage: addGalleryImage,
    deleteImage: deleteGalleryImage,
  } = useGalleryStore();

  const [noteFormContent, setNoteFormContent] = useState("");
  const [noteFormDate, setNoteFormDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [noteFormTime, setNoteFormTime] = useState("");
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<number>>(
    new Set(),
  );
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeTitle, setMergeTitle] = useState("");
  const [mergeDate, setMergeDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [deleteNotesAfterMerge, setDeleteNotesAfterMerge] = useState(false);
  const [mergeSaving, setMergeSaving] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryEntryId, setGalleryEntryId] = useState<number | "">("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [editingNoteTime, setEditingNoteTime] = useState("");
  const [entryViewCaption, setEntryViewCaption] = useState("");
  const [entryViewUploading, setEntryViewUploading] = useState(false);
  const [exportPdfModalOpen, setExportPdfModalOpen] = useState(false);
  const [exportPdfEntryPool, setExportPdfEntryPool] = useState<JournalEntry[]>(
    [],
  );
  const [exportPdfSelectedIds, setExportPdfSelectedIds] = useState<Set<number>>(
    new Set(),
  );
  const [exportPdfLoading, setExportPdfLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>(
    () => loadReportHistory(),
  );

  // Compile Report (CTU OJT Form 6) state
  const [compileModalOpen, setCompileModalOpen] = useState(false);
  const [compileLoading, setCompileLoading] = useState(false);
  const [compileForm, setCompileForm] = useState({
    traineeName: "",
    course: "",
    industryPartner: "",
    department: "",
    startDate: "",
    endDate: "",
  });

  const handleRequiredHoursChange = (value: string) => {
    const hours = Number(value) || 0;
    setRequiredHours(hours);
    localStorage.setItem("internship_required_hours", String(hours));
  };

  const addReportHistory = (
    item: Omit<ReportHistoryItem, "id" | "createdAt">,
  ) => {
    setReportHistory((prev) => {
      const next = [
        {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 8);
      saveReportHistory(next);
      return next;
    });
  };

  const openCompileReportModal = (range?: { start: string; end: string }) => {
    setCompileForm((form) => ({
      ...form,
      traineeName: form.traineeName || reportName,
      startDate: range?.start ?? form.startDate,
      endDate: range?.end ?? form.endDate,
    }));
    setCompileModalOpen(true);
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
        session.access_token,
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
        session.access_token,
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
    if (user?.id && mainView === "notes") {
      fetchNotes();
    }
  }, [user?.id, mainView, fetchNotes]);

  useEffect(() => {
    if (
      user?.id &&
      (mainView === "gallery" ||
        mainView === "weekly" ||
        mainView === "reports")
    ) {
      fetchGallery();
    }
  }, [user?.id, mainView, fetchGallery]);

  useEffect(() => {
    if (viewingEntry?.id) {
      fetchEntryImages(viewingEntry.id);
      return () => clearEntryImages();
    }
  }, [viewingEntry?.id, fetchEntryImages, clearEntryImages]);

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
    const { timeIn, timeOut } = getDefaultTimes();
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      content: "",
      mood: "neutral",
      tags: "",
      time_in: timeIn,
      time_out: timeOut,
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

  const handleAddNote = async () => {
    if (!noteFormContent.trim() || !user?.id) return;
    try {
      await addNote({
        content: noteFormContent.trim(),
        date: noteFormDate,
        time: noteFormTime.trim() || undefined,
      });
      setNoteFormContent("");
      setNoteFormDate(new Date().toISOString().split("T")[0]);
      setNoteFormTime("");
      toast.success("Note added", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Failed to add note", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const toggleNoteSelection = (id: number) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenMergeModal = () => {
    if (selectedNoteIds.size === 0) return;
    const selectedNotes = notes.filter((n) => selectedNoteIds.has(n.id));
    const firstDate =
      selectedNotes.length > 0
        ? selectedNotes[0].date
        : new Date().toISOString().split("T")[0];
    setMergeDate(firstDate);
    setMergeTitle(`Merged notes (${selectedNoteIds.size})`);
    setMergeModalOpen(true);
  };

  const handleMergeNotes = async () => {
    if (selectedNoteIds.size === 0 || !user?.id) return;
    setMergeSaving(true);
    try {
      await mergeNotes({
        noteIds: Array.from(selectedNoteIds),
        title: mergeTitle.trim() || undefined,
        date: mergeDate,
        deleteNotesAfterMerge,
      });
      setMergeModalOpen(false);
      setSelectedNoteIds(new Set());
      fetchEntries();
      if (deleteNotesAfterMerge) fetchNotes();
      toast.success("Notes merged into journal entry", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Failed to merge notes", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setMergeSaving(false);
    }
  };

  const handleSaveEditingNote = async () => {
    if (editingNoteId == null || !editingNoteContent.trim()) return;
    try {
      await updateNote(editingNoteId, {
        content: editingNoteContent.trim(),
        time: editingNoteTime.trim() || undefined,
      });
      setEditingNoteId(null);
      setEditingNoteContent("");
      setEditingNoteTime("");
      toast.success("Note updated", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Failed to update note", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNote(id);
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Note deleted", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Failed to delete note", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const caption = galleryCaption.trim();
    const entryId = galleryEntryId === "" ? null : Number(galleryEntryId);
    if (!caption) {
      toast.error("Caption is required", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      e.target.value = "";
      return;
    }
    if (entryId == null || !Number.isInteger(entryId) || entryId <= 0) {
      toast.error("Please select a journal entry", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      e.target.value = "";
      return;
    }
    setGalleryUploading(true);
    try {
      const url = await uploadGalleryImage(file, user.id);
      await addGalleryImage({
        image_url: url,
        caption,
        journal_entry_id: entryId,
      });
      setGalleryCaption("");
      setGalleryEntryId("");
      e.target.value = "";
      toast.success("Image added to gallery", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(msg, {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    try {
      await deleteGalleryImage(id);
      toast.success("Image removed", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch {
      toast.error("Failed to remove image", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    }
  };

  const handleEntryViewUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !viewingEntry) return;
    const caption = entryViewCaption.trim();
    if (!caption) {
      toast.error("Caption is required", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      e.target.value = "";
      return;
    }
    setEntryViewUploading(true);
    try {
      const url = await uploadGalleryImage(file, user.id);
      await addGalleryImage({
        image_url: url,
        caption,
        journal_entry_id: viewingEntry.id,
      });
      setEntryViewCaption("");
      e.target.value = "";
      toast.success("Image added to this entry", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      toast.error(msg, {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setEntryViewUploading(false);
    }
  };

  const calculateHours = (
    timeIn: string,
    timeOut: string,
    breakTime?: number | null,
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
        entry.break_time,
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
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
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
      color: "bg-pastel-green text-[#2d5a36] border-pastel-green",
      gradient: "soft-green",
    },
    good: {
      label: "Good",
      color: "bg-pastel-blue text-[#4a6a75] border-pastel-blue",
      gradient: "soft-blue",
    },
    neutral: {
      label: "Neutral",
      color: "bg-pastel-peach text-[#6a5a40] border-pastel-peach",
      gradient: "pastel-peach",
    },
    challenging: {
      label: "Challenging",
      color: "bg-pastel-peach text-[#6a5a40] border-pastel-peach",
      gradient: "pastel-peach",
    },
    stressful: {
      label: "Stressful",
      color: "bg-pastel-pink text-[#8b4a4a] border-pastel-pink",
      gradient: "soft-pink",
    },
  };

  const moodCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const weekBounds = getWeekBounds(new Date(selectedWeekDate));
  const entriesForSelectedWeek = entries.filter((e) =>
    isDateInWeekBounds(e.date, weekBounds),
  );
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
  const galleryByEntryId = galleryImages.reduce(
    (map, image) => {
      if (image.journal_entry_id != null) {
        const list = map.get(image.journal_entry_id) ?? [];
        list.push(image);
        map.set(image.journal_entry_id, list);
      }
      return map;
    },
    new Map<number, typeof galleryImages>(),
  );
  const weeklyHours = entriesForSelectedWeek.reduce(
    (total, entry) =>
      total + calculateHours(entry.time_in ?? "", entry.time_out ?? "", entry.break_time),
    0,
  );
  const weeklyEvidenceCount = entriesForSelectedWeek.reduce(
    (total, entry) => total + (galleryByEntryId.get(entry.id)?.length ?? 0),
    0,
  );
  const entriesMissingTime = entries.filter(
    (entry) => !entry.time_in || !entry.time_out,
  );
  const entriesMissingTags = entries.filter((entry) => entry.tags.length === 0);
  const lowDetailEntries = entries.filter((entry) => {
    const words = entry.content.trim().split(/\s+/).filter(Boolean);
    return words.length > 0 && words.length < 25;
  });
  const entriesMissingEvidence = entries.filter(
    (entry) => (galleryByEntryId.get(entry.id)?.length ?? 0) === 0,
  );
  const selectedRangeEntries =
    compileForm.startDate && compileForm.endDate
      ? entries.filter((entry) => {
          const date = new Date(entry.date);
          const start = new Date(compileForm.startDate);
          const end = new Date(compileForm.endDate);
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        })
      : [];
  const selectedRangeHours = selectedRangeEntries.reduce(
    (total, entry) =>
      total + calculateHours(entry.time_in ?? "", entry.time_out ?? "", entry.break_time),
    0,
  );
  const selectedRangeEvidenceCount = selectedRangeEntries.reduce(
    (total, entry) => total + (galleryByEntryId.get(entry.id)?.length ?? 0),
    0,
  );
  const selectedRangeLabel =
    compileForm.startDate && compileForm.endDate
      ? `${compileForm.startDate} to ${compileForm.endDate}`
      : "No range selected";
  const reportReadinessChecks = [
    {
      label: "Time logs",
      ready: entriesMissingTime.length === 0,
      issueCount: entriesMissingTime.length,
    },
    {
      label: "Tags",
      ready: entriesMissingTags.length === 0,
      issueCount: entriesMissingTags.length,
    },
    {
      label: "Detail",
      ready: lowDetailEntries.length === 0,
      issueCount: lowDetailEntries.length,
    },
    {
      label: "Evidence",
      ready: entriesMissingEvidence.length === 0,
      issueCount: entriesMissingEvidence.length,
    },
  ];

  const handleGenerateWeeklySummary = async () => {
    const entriesToSummarize = entries.filter((e) =>
      isDateInWeekBounds(e.date, weekBounds),
    );
    if (entriesToSummarize.length === 0 || !session?.access_token) {
      if (entriesToSummarize.length === 0) {
        toast.error(
          "No entries in this week. Add entries or pick another week.",
          {
            position: "top-right",
            theme: "light",
            transition: Bounce,
          },
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
        session.access_token,
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

  const [weeklyExportLoading, setWeeklyExportLoading] = useState(false);

  const exportWeeklyReportToPDF = async () => {
    const hasSummary = Boolean(weeklySummary?.trim());

    if (!hasSummary) {
      toast.error("Please generate an AI summary first before exporting.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }

    setWeeklyExportLoading(true);

    try {
      const hasEntries = entriesForSelectedWeek.length > 0;

      // Load images for all entries
      const sortedEntries = [...entriesForSelectedWeek].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const imagesByEntry = new Map<number, PdfThumb[]>();
      await Promise.all(
        sortedEntries.map(async (entry) => {
          const images = await getGalleryForEntry(entry.id);
          const loaded = await Promise.all(
            images.map((img) => loadImageAsResizedDataUrl(img.image_url)),
          );
          const valid = loaded.filter((x): x is PdfThumb => x != null);
          imagesByEntry.set(entry.id, valid);
        }),
      );

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Brand colors (matching web app theme)
      const primaryColor: [number, number, number] = [196, 148, 110]; // #c4946e
      const darkText: [number, number, number] = [34, 34, 34]; // #222222
      const mutedText: [number, number, number] = [102, 102, 102]; // #666666
      const lightAccent: [number, number, number] = [232, 212, 196]; // #e8d4c4
      const rowAltBg: [number, number, number] = [249, 246, 242]; // #f9f6f2

      let y = margin;

      // Header: InternPal branding
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("InternPal", margin, y);
      y += 10;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("Weekly", margin, y);
      doc.setTextColor(...darkText);
      doc.text(" Report", margin + doc.getTextWidth("Weekly"), y);
      y += 10;

      // Divider
      doc.setDrawColor(...lightAccent);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Name and Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedText);
      doc.text(`NAME: `, margin, y);
      doc.setTextColor(...darkText);
      doc.text(reportName || "—", margin + doc.getTextWidth("NAME: "), y);
      y += 6;
      doc.setTextColor(...mutedText);
      doc.text(`DATE: `, margin, y);
      doc.setTextColor(...darkText);
      doc.text(reportDate, margin + doc.getTextWidth("DATE: "), y);
      y += 14;

      // Section header
      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "bold");
      doc.text("PROJECT PROGRESS REPORT", margin, y);
      y += 8;

      // Table
      const colWidths = [36, 28, 26, 20, 20, contentWidth - 130];
      const headers = ["Day", "Phase", "Assigned To", "Start", "End", "Task"];
      const rowHeight = 8;

      // Table header
      let x = margin;
      doc.setFillColor(...primaryColor);
      doc.rect(margin, y - 5, contentWidth, rowHeight + 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      headers.forEach((h, i) => {
        doc.text(h, x + 2, y + 1);
        x += colWidths[i];
      });
      y += rowHeight + 2;

      const formatDayPDF = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      const formatTimePDF = (time: string | null) => {
        if (!time) return "—";
        const parts = time.split(":").map(Number);
        const hour = parts[0] ?? 0;
        const min = parts[1] ?? 0;
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${String(min).padStart(2, "0")}${period}`;
      };

      // Table rows with alternating colors
      sortedEntries.forEach((entry, idx) => {
        if (y + rowHeight > pageHeight - 40) {
          doc.addPage();
          y = margin;
        }
        doc.setDrawColor(...lightAccent);
        if (idx % 2 === 0) {
          doc.setFillColor(...rowAltBg);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(margin, y - 4, contentWidth, rowHeight + 1, "FD");
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        let rowX = margin;
        const dayStr = formatDayPDF(entry.date);
        const cells = [
          dayStr.length > 20 ? dayStr.slice(0, 19) + "…" : dayStr,
          entry.tags?.[0]?.slice(0, 12) ?? "Daily log",
          (reportName || "—").slice(0, 12),
          formatTimePDF(entry.time_in),
          formatTimePDF(entry.time_out),
          entry.title.length > 26
            ? entry.title.slice(0, 25) + "…"
            : entry.title,
        ];
        cells.forEach((cell, i) => {
          const w = colWidths[i];
          doc.text(cell, rowX + 2, y + 1);
          rowX += w;
        });
        y += rowHeight + 1;
      });

      if (!hasEntries) {
        doc.setDrawColor(...lightAccent);
        doc.setFillColor(...rowAltBg);
        doc.rect(margin, y - 4, contentWidth, rowHeight + 2, "FD");
        doc.setTextColor(...mutedText);
        doc.setFontSize(8);
        doc.text("No entries for this week.", margin + 4, y + 1);
        y += rowHeight + 6;
      }

      // Conclusion section
      y += 12;
      if (y + 20 > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "bold");
      doc.text("CONCLUSION", margin, y);
      const headerW = doc.getTextWidth("CONCLUSION");
      doc.setDrawColor(...lightAccent);
      doc.setLineWidth(0.3);
      doc.line(margin + headerW + 4, y - 2, pageWidth - margin, y - 2);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      const conclusionText = hasSummary
        ? (weeklySummary ?? "")
        : "No summary generated for this week.";
      const conclusionLines = doc.splitTextToSize(conclusionText, contentWidth);
      const lineHeight = 5;
      conclusionLines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - 25) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      // Proof of Work section with images
      const hasAnyImages = sortedEntries.some(
        (e) => (imagesByEntry.get(e.id)?.length ?? 0) > 0,
      );
      if (hasAnyImages) {
        y += 12;
        if (y + 30 > pageHeight - 30) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "bold");
        doc.text("PROOF OF WORK", margin, y);
        const powHeaderW = doc.getTextWidth("PROOF OF WORK");
        doc.setDrawColor(...lightAccent);
        doc.setLineWidth(0.3);
        doc.line(margin + powHeaderW + 4, y - 2, pageWidth - margin, y - 2);
        y += 10;

        for (const entry of sortedEntries) {
          const thumbs = imagesByEntry.get(entry.id) ?? [];
          if (thumbs.length === 0) continue;

          if (y + 20 > pageHeight - 30) {
            doc.addPage();
            y = margin;
          }

          // Entry date label
          const entryDateLabel = new Date(entry.date).toLocaleDateString(
            "en-US",
            {
              weekday: "long",
              month: "short",
              day: "numeric",
            },
          );
          doc.setFontSize(9);
          doc.setTextColor(...mutedText);
          doc.setFont("helvetica", "bold");
          doc.text(entryDateLabel, margin, y);
          y += 6;

          const gap = PDF_THUMB_GAP_MM;
          let xOffset = margin;
          let rowMaxH = 0;

          for (const thumb of thumbs) {
            const w = thumb.wMm;
            const h = thumb.hMm;

            if (thumb.isLandscape && xOffset > margin) {
              xOffset = margin;
              y += rowMaxH + gap;
              rowMaxH = 0;
            }

            if (xOffset + w > pageWidth - margin) {
              xOffset = margin;
              y += rowMaxH + gap;
              rowMaxH = 0;
            }
            if (y + h > pageHeight - 25) {
              doc.addPage();
              y = margin;
              xOffset = margin;
              rowMaxH = 0;
            }
            try {
              doc.setDrawColor(230, 230, 230);
              doc.setLineWidth(0.2);
              doc.rect(xOffset - 0.5, y - 0.5, w + 1, h + 1);
              doc.addImage(thumb.dataUrl, "JPEG", xOffset, y, w, h);
            } catch {
              // skip
            }
            rowMaxH = Math.max(rowMaxH, h);
            xOffset += w + gap;

            if (thumb.isLandscape) {
              xOffset = margin;
              y += rowMaxH + gap;
              rowMaxH = 0;
            }
          }
          if (rowMaxH > 0) y += rowMaxH + 6;
        }
      }

      // Add footers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...mutedText);
        doc.text(
          `InternPal  |  Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          {
            align: "center",
          },
        );
      }

      const fileName = `internpal-weekly-${weekBounds.start}-to-${weekBounds.end}.pdf`;
      doc.save(fileName);
      addReportHistory({
        type: "Weekly Report",
        title: "Weekly Report",
        range: `${weekBounds.start} to ${weekBounds.end}`,
        entryCount: sortedEntries.length,
      });

      toast.success("Weekly report exported to PDF", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (err) {
      console.error("Weekly export error:", err);
      toast.error("Failed to export weekly report", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setWeeklyExportLoading(false);
    }
  };

  const openExportPdfModal = (entriesToUse = filteredEntries) => {
    setExportPdfEntryPool(entriesToUse);
    setExportPdfSelectedIds(new Set(entriesToUse.map((e) => e.id)));
    setExportPdfModalOpen(true);
  };

  const toggleExportPdfEntry = (id: number) => {
    setExportPdfSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportPdfSelectAll = () => {
    setExportPdfSelectedIds(new Set(exportPdfEntryPool.map((e) => e.id)));
  };

  const exportPdfClearSelection = () => {
    setExportPdfSelectedIds(new Set());
  };

  type PdfThumb = {
    dataUrl: string;
    wMm: number;
    hMm: number;
    isLandscape: boolean;
  };

  const exportToPDF = (
    entriesToExport: JournalEntry[],
    imagesByEntryId?: Map<number, PdfThumb[]>,
  ) => {
    if (entriesToExport.length === 0) {
      toast.error("Select at least one entry to export", {
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

    // Brand colors (matching web app theme)
    const primaryColor: [number, number, number] = [196, 148, 110]; // #c4946e
    const darkText: [number, number, number] = [34, 34, 34]; // #222222
    const mutedText: [number, number, number] = [102, 102, 102]; // #666666
    const lightAccent: [number, number, number] = [232, 212, 196]; // #e8d4c4

    const sortedEntries = [...entriesToExport].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const addPageFooter = (pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.setFont("helvetica", "normal");
      doc.text(
        `InternPal  |  Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" },
      );
    };

    sortedEntries.forEach((entry, index) => {
      if (index > 0) doc.addPage();

      let yPosition = margin;

      // Header: InternPal branding
      doc.setFontSize(10);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("InternPal", margin, yPosition);
      doc.setTextColor(...mutedText);
      doc.setFont("helvetica", "normal");
      doc.text(
        " - Journal Entry",
        margin + doc.getTextWidth("InternPal"),
        yPosition,
      );
      yPosition += 12;

      // Day badge with background
      const dayText = `Day ${index + 1} of ${sortedEntries.length}`;
      doc.setFillColor(...lightAccent);
      doc.roundedRect(
        margin,
        yPosition - 5,
        doc.getTextWidth(dayText) + 10,
        8,
        2,
        2,
        "F",
      );
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text(dayText, margin + 5, yPosition);
      yPosition += 12;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(entry.title, contentWidth);
      doc.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 7 + 4;

      // Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedText);
      const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      doc.text(dateStr, margin, yPosition);
      yPosition += 5;

      // Time info
      if (entry.time_in && entry.time_out) {
        const hours = calculateHours(
          entry.time_in,
          entry.time_out,
          entry.break_time,
        );
        let timeStr = `${formatTime(entry.time_in)} - ${formatTime(entry.time_out)}`;
        if (entry.break_time) timeStr += `  •  ${entry.break_time} min break`;
        timeStr += `  •  ${hours.toFixed(1)} hours`;
        doc.text(timeStr, margin, yPosition);
        yPosition += 5;
      }

      // Divider line
      yPosition += 6;
      doc.setDrawColor(...lightAccent);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Content
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      doc.setFont("helvetica", "normal");
      const contentLines = doc.splitTextToSize(entry.content, contentWidth);
      const lineHeight = 5;

      contentLines.forEach((line: string) => {
        if (yPosition + lineHeight > pageHeight - 40) {
          addPageFooter(index + 1, sortedEntries.length);
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Tags with styled pills
      if (entry.tags.length > 0) {
        yPosition += 10;
        let xPos = margin;
        doc.setFontSize(8);
        entry.tags.forEach((tag) => {
          const tagText = `#${tag}`;
          const tagWidth = doc.getTextWidth(tagText) + 6;
          if (xPos + tagWidth > pageWidth - margin) {
            xPos = margin;
            yPosition += 7;
          }
          doc.setFillColor(...lightAccent);
          doc.roundedRect(xPos, yPosition - 4, tagWidth, 6, 1.5, 1.5, "F");
          doc.setTextColor(...primaryColor);
          doc.text(tagText, xPos + 3, yPosition);
          xPos += tagWidth + 3;
        });
        yPosition += 10;
      }

      // Images section
      const entryThumbs = imagesByEntryId?.get(entry.id) ?? [];
      if (entryThumbs.length > 0) {
        if (yPosition > pageHeight - 60) {
          addPageFooter(index + 1, sortedEntries.length);
          doc.addPage();
          yPosition = margin;
        }
        yPosition += 6;

        // Section header with line
        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "bold");
        doc.text("Proof of Work", margin, yPosition);
        const headerWidth = doc.getTextWidth("Proof of Work");
        doc.setDrawColor(...lightAccent);
        doc.setLineWidth(0.3);
        doc.line(
          margin + headerWidth + 4,
          yPosition - 2,
          pageWidth - margin,
          yPosition - 2,
        );
        yPosition += 8;

        const gap = PDF_THUMB_GAP_MM;
        let xOffset = margin;
        let rowMaxH = 0;

        for (let i = 0; i < entryThumbs.length; i++) {
          const thumb = entryThumbs[i];
          const w = thumb.wMm;
          const h = thumb.hMm;

          if (thumb.isLandscape && xOffset > margin) {
            xOffset = margin;
            yPosition += rowMaxH + gap;
            rowMaxH = 0;
          }

          if (xOffset + w > pageWidth - margin) {
            xOffset = margin;
            yPosition += rowMaxH + gap;
            rowMaxH = 0;
          }
          if (yPosition + h > pageHeight - 25) {
            addPageFooter(index + 1, sortedEntries.length);
            doc.addPage();
            yPosition = margin;
            xOffset = margin;
            rowMaxH = 0;
          }
          try {
            // Add subtle border around image
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.rect(xOffset - 0.5, yPosition - 0.5, w + 1, h + 1);
            doc.addImage(thumb.dataUrl, "JPEG", xOffset, yPosition, w, h);
          } catch {
            // skip image if addImage fails
          }
          rowMaxH = Math.max(rowMaxH, h);
          xOffset += w + gap;

          if (thumb.isLandscape) {
            xOffset = margin;
            yPosition += rowMaxH + gap;
            rowMaxH = 0;
          }
        }
        if (rowMaxH > 0) yPosition += rowMaxH + 8;
      }

      addPageFooter(index + 1, sortedEntries.length);
    });

    const fileName = `internpal-journal-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    addReportHistory({
      type: "Journal PDF",
      title: `Journal PDF (${sortedEntries.length} entries)`,
      range:
        firstEntry && lastEntry
          ? `${firstEntry.date} to ${lastEntry.date}`
          : "Selected entries",
      entryCount: sortedEntries.length,
    });

    toast.success(`Exported ${sortedEntries.length} entries to PDF`, {
      position: "top-right",
      theme: "light",
      transition: Bounce,
    });
  };

  const handleExportSelectedPdf = async () => {
    const selected = exportPdfEntryPool.filter((e) =>
      exportPdfSelectedIds.has(e.id),
    );
    if (selected.length === 0) return;

    setExportPdfLoading(true);
    try {
      const imageLists = await Promise.all(
        selected.map((e) => getGalleryForEntry(e.id)),
      );
      const thumbMap = new Map<number, PdfThumb[]>();
      await Promise.all(
        selected.map(async (e, i) => {
          const imgs = imageLists[i] ?? [];
          const loaded = await Promise.all(
            imgs.map((img) => loadImageAsResizedDataUrl(img.image_url)),
          );
          const valid = loaded.filter((x): x is PdfThumb => x != null);
          thumbMap.set(e.id, valid);
        }),
      );
      exportToPDF(selected, thumbMap);
      setExportPdfModalOpen(false);
    } catch (err) {
      console.error("Export PDF error:", err);
      toast.error("Failed to prepare images for export. Exporting text only.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      exportToPDF(selected);
      setExportPdfModalOpen(false);
    } finally {
      setExportPdfLoading(false);
    }
  };

  const handleCompileReport = async () => {
    const {
      traineeName,
      course,
      industryPartner,
      department,
      startDate,
      endDate,
    } = compileForm;
    if (!startDate || !endDate) {
      toast.error("Please select a start and end date.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const rangeEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
    if (rangeEntries.length === 0) {
      toast.error("No journal entries found in the selected date range.", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
      return;
    }
    if (!session?.access_token) return;
    setCompileLoading(true);
    try {
      const result = await compileJournalSummary(
        {
          entries: rangeEntries,
          traineeName,
          course,
          industryPartner,
          department,
          dateRange: { start: startDate, end: endDate },
        },
        session.access_token,
      );
      generateCTUJournalPDF({
        traineeName,
        course,
        industryPartner,
        department,
        dateRange: { start: startDate, end: endDate },
        activities: result.activities,
        learnings: result.learnings,
      });
      addReportHistory({
        type: "CTU Form 6",
        title: "CTU OJT Form 6",
        range: `${startDate} to ${endDate}`,
        entryCount: rangeEntries.length,
      });
      setCompileModalOpen(false);
      toast.success("CTU OJT Form 6 exported!", {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } catch (err: unknown) {
      console.error("Compile journal error:", err);
      const msg =
        (err as { response?: { data?: { error?: string; details?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { details?: string } } })?.response?.data
          ?.details ||
        "Failed to compile journal. Please try again.";
      toast.error(msg, {
        position: "top-right",
        theme: "light",
        transition: Bounce,
      });
    } finally {
      setCompileLoading(false);
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-soft-blue animate-ping" />
          </div>
          <p className="text-text/60">Loading journal entries...</p>
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
      <div className="flex min-h-screen bg-surface">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-72 lg:border-r lg:border-border lg:bg-canvas lg:shrink-0">
          <div className="sticky top-0 flex flex-col max-h-screen overflow-y-auto p-5">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Journal
                </span>
              </div>
              <h1 className="text-lg font-bold text-text">
                Internship Journal
              </h1>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors mb-4"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                View
              </p>
              <div className="space-y-1 rounded-xl border border-border p-1">
                <button
                  onClick={() => setMainView("entries")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mainView === "entries"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Entries
                </button>
                <button
                  onClick={() => setMainView("weekly")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mainView === "weekly"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  Weekly
                </button>
                <button
                  onClick={() => setMainView("notes")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mainView === "notes"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes Inbox
                </button>
                <button
                  onClick={() => setMainView("gallery")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mainView === "gallery"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Evidence Gallery
                </button>
                <button
                  onClick={() => setMainView("reports")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mainView === "reports"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Reports
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Entries</span>
                <span className="font-semibold text-text">
                  {entries.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Hours logged</span>
                <span className="font-semibold text-text">
                  {totalHoursLogged.toFixed(1)}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Remaining</span>
                <span
                  className={`font-semibold ${
                    hoursRemaining > 0 ? "text-soft-pink" : "text-soft-green"
                  }`}
                >
                  {hoursRemaining.toFixed(1)}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="text-text-muted">Of (hrs)</span>
                <input
                  type="number"
                  value={requiredHours}
                  onChange={(e) => handleRequiredHoursChange(e.target.value)}
                  className="w-14 px-1.5 py-0.5 border border-border rounded text-center text-sm text-text focus:outline-none focus:border-primary"
                  min="0"
                />
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar: search + export (entries) or title (weekly/notes/gallery) */}
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-4 bg-canvas/95 backdrop-blur border-b border-border">
            {mainView === "entries" ? (
              <>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-border flex items-center justify-center hover:bg-accent/30"
                    >
                      <X className="w-3 h-3 text-text-muted" />
                    </button>
                  )}
                </div>
                {/* Desktop filter dropdown */}
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                  <Filter className="w-4 h-4 text-text-muted" />
                  <div className="relative">
                    <select
                      value={filterMood}
                      onChange={(e) => setFilterMood(e.target.value)}
                      className="appearance-none bg-surface border border-border rounded-lg px-3 py-2.5 pr-8 text-sm font-medium text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      <option value="all">All Moods ({entries.length})</option>
                      {Object.entries(moodConfig).map(([mood, config]) => (
                        <option key={mood} value={mood}>
                          {moodEmojis[mood]} {config.label} (
                          {moodCounts[mood] || 0})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>
                <button
                  onClick={() => openExportPdfModal()}
                  disabled={filteredEntries.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => openCompileReportModal()}
                  disabled={entries.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/40 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  Compile Report
                </button>
              </>
            ) : mainView === "notes" ? (
              <h2 className="text-base sm:text-lg font-bold text-text truncate min-w-0">
                Notes Inbox
              </h2>
            ) : mainView === "gallery" ? (
              <h2 className="text-base sm:text-lg font-bold text-text truncate min-w-0">
                Evidence Gallery
              </h2>
            ) : mainView === "reports" ? (
              <h2 className="text-base sm:text-lg font-bold text-text truncate min-w-0">
                Reports
              </h2>
            ) : (
              <h2 className="text-base sm:text-lg font-bold text-text truncate min-w-0">
                Weekly Report
              </h2>
            )}
          </div>

          {/* Mobile: view toggle + New Entry + filters (sidebar is hidden) */}
          <div className="lg:hidden px-4 sm:px-6 py-3 border-b border-border bg-canvas space-y-3">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 rounded-lg border border-border p-0.5 flex-1">
                <button
                  onClick={() => setMainView("entries")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mainView === "entries"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Entries
                </button>
                <button
                  onClick={() => setMainView("weekly")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mainView === "weekly"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setMainView("notes")}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mainView === "notes"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes
                </button>
                <button
                  onClick={() => setMainView("gallery")}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mainView === "gallery"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Evidence
                </button>
                <button
                  onClick={() => setMainView("reports")}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mainView === "reports"
                      ? "bg-primary text-white"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Reports
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover shrink-0"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
            {mainView === "entries" && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted shrink-0" />
                <div className="relative flex-1">
                  <select
                    value={filterMood}
                    onChange={(e) => setFilterMood(e.target.value)}
                    className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-2 pr-9 text-sm font-medium text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Moods ({entries.length})</option>
                    {Object.entries(moodConfig).map(([mood, config]) => (
                      <option key={mood} value={mood}>
                        {moodEmojis[mood]} {config.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
            )}
            {/* Mobile stats row */}
            <div className="flex items-center justify-between text-xs text-text-muted bg-surface-alt/50 rounded-lg px-3 py-2">
              <span>
                <span className="font-semibold text-text">
                  {entries.length}
                </span>{" "}
                entries
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-semibold text-text">
                  {totalHoursLogged.toFixed(1)}h
                </span>{" "}
                logged
              </span>
              <span className="text-border">|</span>
              <span>
                <span
                  className={`font-semibold ${hoursRemaining > 0 ? "text-soft-pink" : "text-soft-green"}`}
                >
                  {hoursRemaining.toFixed(1)}h
                </span>{" "}
                left
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            {mainView === "weekly" && (
              <div className="max-w-4xl w-full min-w-0 mx-auto space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pt-2 sm:pt-6">
                  <div>
                    <label className="block bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-t w-fit mb-0">
                      NAME
                    </label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-b rounded-tr border border-border bg-white text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-t w-fit mb-0">
                      DATE
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-b rounded-tr border border-border bg-white text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setWeeklyReportMode("view")}
                      className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all touch-manipulation ${
                        weeklyReportMode === "view"
                          ? "bg-primary text-white"
                          : "border border-border text-text hover:border-primary hover:bg-accent/30"
                      }`}
                    >
                      <CalendarRange className="w-4 h-4 shrink-0" />
                      <span>View week</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeeklyReportMode("new")}
                      className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all touch-manipulation ${
                        weeklyReportMode === "new"
                          ? "bg-primary text-white"
                          : "border border-border text-text hover:border-primary hover:bg-accent/30"
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 shrink-0" />
                      <span>New weekly log</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 min-w-0 sm:flex-1 sm:justify-end">
                    <label className="text-sm text-text-muted shrink-0">
                      Week
                    </label>
                    <input
                      type="date"
                      value={
                        weeklyReportMode === "new"
                          ? weekBounds.start
                          : selectedWeekDate
                      }
                      onChange={(e) => setSelectedWeekDate(e.target.value)}
                      className="min-w-0 flex-1 sm:flex-none sm:w-auto min-h-[44px] px-3 py-2 rounded-xl border border-border bg-canvas text-text text-sm focus:outline-none focus:border-primary touch-manipulation"
                    />
                    <span className="text-sm text-text-muted whitespace-nowrap shrink-0">
                      {weekBounds.start} → {weekBounds.end}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Entries
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {entriesForSelectedWeek.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Hours
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {weeklyHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-canvas p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Evidence
                    </p>
                    <p className="mt-1 text-2xl font-bold text-text">
                      {weeklyEvidenceCount}
                    </p>
                  </div>
                </div>

                {/* PROJECT PROGRESS REPORT */}
                <h3 className="text-base sm:text-lg font-bold text-text mb-2 mt-4 sm:mt-6">
                  PROJECT PROGRESS REPORT
                </h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-border mb-6 min-w-0">
                  <table className="w-full text-xs sm:text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold whitespace-nowrap">
                          Day
                        </th>
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold whitespace-nowrap">
                          Project Phase
                        </th>
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold whitespace-nowrap">
                          Assigned To
                        </th>
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold whitespace-nowrap">
                          Start
                        </th>
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold whitespace-nowrap">
                          End
                        </th>
                        <th className="px-2 py-1.5 sm:px-3 sm:py-2.5 text-left font-semibold">
                          Task
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface">
                      {weeklyReportMode === "view" &&
                      entriesForSelectedWeek.length > 0 ? (
                        [...entriesForSelectedWeek]
                          .sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime(),
                          )
                          .map((e) => (
                            <tr
                              key={e.id}
                              className="border-t border-border hover:bg-accent/30 cursor-pointer transition-colors"
                              onClick={() => setViewingEntry(e)}
                            >
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text whitespace-nowrap">
                                {formatReportDay(e.date)}
                              </td>
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text max-w-[120px] sm:max-w-none truncate">
                                {e.tags?.[0] ?? "Daily log"}
                              </td>
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text max-w-[80px] sm:max-w-none truncate">
                                {reportName || "—"}
                              </td>
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text whitespace-nowrap">
                                {formatTimeForTable(e.time_in)}
                              </td>
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text whitespace-nowrap">
                                {formatTimeForTable(e.time_out)}
                              </td>
                              <td className="px-2 py-1.5 sm:px-3 sm:py-2 text-text min-w-[100px] max-w-[180px] sm:max-w-none truncate">
                                {e.title}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-2 sm:px-3 py-6 sm:py-8 text-center text-text-muted text-xs sm:text-sm"
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-text">
                    CONCLUSION
                  </h3>
                  {weeklySummary && (
                    <button
                      type="button"
                      onClick={() => setWeeklySummary(null)}
                      className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-accent/30 border border-border transition-all touch-manipulation shrink-0"
                      aria-label="Clear conclusion"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      Clear
                    </button>
                  )}
                </div>
                <div className="mb-4">
                  <textarea
                    rows={5}
                    value={weeklySummary ?? ""}
                    onChange={(e) => setWeeklySummary(e.target.value)}
                    placeholder="Generate an AI summary from this week's entries to see the conclusion here."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {weeklySummary && (
                    <p className="mt-2 text-xs font-medium text-text-muted">
                      AI draft. Edit before exporting.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {entriesForSelectedWeek.length > 0 && (
                    <button
                      type="button"
                      onClick={handleGenerateWeeklySummary}
                      disabled={weeklySummaryLoading}
                      className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {weeklySummaryLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>Generate AI summary</span>
                        </>
                      )}
                    </button>
                  )}
                  {weeklySummary && (
                    <button
                      type="button"
                      onClick={exportWeeklyReportToPDF}
                      disabled={weeklyExportLoading}
                      className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-border bg-canvas text-text text-sm font-medium hover:border-primary hover:bg-accent/30 transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {weeklyExportLoading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {weeklyExportLoading ? "Exporting..." : "Export PDF"}
                      </span>
                    </button>
                  )}
                </div>

                {weeklyReportMode === "new" && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                    <label className="block text-sm font-semibold text-text mb-2">
                      Weekly log (one entry for the whole week)
                    </label>
                    <textarea
                      rows={4}
                      value={weeklyLogContent}
                      onChange={(e) => setWeeklyLogContent(e.target.value)}
                      placeholder="Summarize your week: tasks, learnings, challenges, hours or highlights..."
                      className="w-full min-w-0 px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWeeklyLog}
                      disabled={!weeklyLogContent.trim() || weeklyLogSaving}
                      className="mt-3 flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <Save className="w-4 h-4 shrink-0" />
                      <span>
                        {weeklyLogSaving ? "Saving..." : "Save weekly log"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {mainView === "entries" && (
              <>
                {filteredEntries.length === 0 ? (
                  <div className="bg-canvas rounded-2xl border border-border p-12 text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-surface-alt flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-primary/40" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-soft-blue/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-soft-blue" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-text mb-2">
                      No journal entries found
                    </h3>
                    <p className="text-text/60 mb-6 max-w-md mx-auto">
                      {searchQuery || filterMood !== "all"
                        ? "Try adjusting your filters or search query"
                        : "Start documenting your internship journey today!"}
                    </p>
                    {!searchQuery && filterMood === "all" && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all"
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
                        className="group bg-canvas rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-text truncate group-hover:text-primary transition-colors">
                              {entry.title}
                            </h3>
                          </div>
                          <span
                            className={`shrink-0 ml-2 px-2 py-1 rounded-lg text-xs font-medium ${
                              moodConfig[entry.mood]?.color || "bg-pastel-peach"
                            }`}
                          >
                            {moodEmojis[entry.mood]}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text/50 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(entry.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {entry.time_in && entry.time_out && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {calculateHours(
                                  entry.time_in,
                                  entry.time_out,
                                  entry.break_time,
                                ).toFixed(1)}
                                h
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-text/60 line-clamp-2 mb-3">
                          {entry.content}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex gap-1 overflow-hidden">
                            {entry.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-surface text-text/60 rounded text-xs truncate max-w-[70px]"
                              >
                                #{tag}
                              </span>
                            ))}
                            {entry.tags.length > 2 && (
                              <span className="text-xs text-text/40">
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
                              className="p-1.5 text-text/50 hover:text-primary hover:bg-accent/30 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(entry.id, entry.title);
                              }}
                              className="p-1.5 text-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {mainView === "notes" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-canvas rounded-2xl border border-border p-5">
                  <label className="block text-sm font-medium text-text mb-2">
                    Capture note
                  </label>
                  <textarea
                    rows={3}
                    value={noteFormContent}
                    onChange={(e) => setNoteFormContent(e.target.value)}
                    placeholder="Jot down a quick note (e.g. what you did today). Merge multiple notes into a journal entry later."
                    className="w-full px-4 py-3 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-sm mb-3"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="date"
                      value={noteFormDate}
                      onChange={(e) => setNoteFormDate(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-border text-text text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={noteFormTime}
                      onChange={(e) => setNoteFormTime(e.target.value)}
                      placeholder="e.g. 11 AM - 12 PM"
                      className="px-4 py-2 rounded-lg border border-border text-text text-sm placeholder-text-muted focus:outline-none focus:border-primary w-40"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!noteFormContent.trim() || notesLoading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add note
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text">
                    Notes Inbox ({notes.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleOpenMergeModal}
                    disabled={selectedNoteIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Merge className="w-4 h-4" />
                    Merge to journal ({selectedNoteIds.size} selected)
                  </button>
                </div>

                {notesLoading && notes.length === 0 ? (
                  <p className="text-text/60 text-sm">Loading notes...</p>
                ) : notes.length === 0 ? (
                  <div className="bg-canvas rounded-2xl border border-border p-10 text-center text-text/60 text-sm">
                    No notes yet. Add a quick note above, then select several
                    and merge them into a journal entry.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="bg-canvas rounded-xl border border-border p-4 flex items-start gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleNoteSelection(note.id)}
                          className="shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-border flex items-center justify-center hover:border-primary transition-colors"
                          aria-label={
                            selectedNoteIds.has(note.id)
                              ? "Deselect note"
                              : "Select note"
                          }
                        >
                          {selectedNoteIds.has(note.id) && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          {editingNoteId === note.id ? (
                            <>
                              <textarea
                                rows={3}
                                value={editingNoteContent}
                                onChange={(e) =>
                                  setEditingNoteContent(e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text focus:outline-none focus:border-primary mb-2"
                              />
                              <input
                                type="text"
                                value={editingNoteTime}
                                onChange={(e) =>
                                  setEditingNoteTime(e.target.value)
                                }
                                placeholder="Time (e.g. 11 AM - 12 PM)"
                                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary mb-2"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleSaveEditingNote}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteContent("");
                                    setEditingNoteTime("");
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-border text-text text-xs font-medium hover:bg-accent/30"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-text whitespace-pre-wrap">
                                {note.content}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(note.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                  {note.time?.trim()
                                    ? ` · ${note.time.trim()}`
                                    : ""}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteContent(note.content);
                                    setEditingNoteTime(note.time ?? "");
                                  }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {mainView === "gallery" && (
              <div className="max-w-4xl mx-auto space-y-6">
                {entries.length === 0 ? (
                  <div className="bg-canvas rounded-2xl border border-border p-10 text-center text-text/60 text-sm">
                    Create a journal entry first, then add proof-of-work images
                    and link them to that entry.
                  </div>
                ) : (
                  <>
                    <div className="bg-canvas rounded-2xl border border-border p-5">
                      <p className="text-sm font-medium text-text mb-3">
                        Add evidence
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-text">
                            Caption *
                          </label>
                          <input
                            type="text"
                            value={galleryCaption}
                            onChange={(e) => setGalleryCaption(e.target.value)}
                            placeholder="e.g. Dashboard update"
                            className="w-40 sm:w-52 px-3 py-2 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-text">
                            Link to entry *
                          </label>
                          <select
                            value={galleryEntryId}
                            onChange={(e) =>
                              setGalleryEntryId(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                              )
                            }
                            className="w-40 sm:w-52 px-3 py-2 rounded-lg border border-border text-sm text-text focus:outline-none focus:border-primary bg-surface"
                          >
                            <option value="">Select entry</option>
                            {entries.slice(0, 50).map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                {entry.title} —{" "}
                                {new Date(entry.date).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium transition-colors ${
                            !galleryCaption.trim() || galleryEntryId === ""
                              ? "cursor-not-allowed opacity-60 text-text-muted"
                              : "text-text hover:bg-accent/30 cursor-pointer"
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {galleryUploading ? "Uploading..." : "Choose image"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="sr-only"
                            onChange={handleGalleryUpload}
                            disabled={
                              galleryUploading ||
                              !galleryCaption.trim() ||
                              galleryEntryId === ""
                            }
                          />
                        </label>
                      </div>
                      <p className="text-xs text-text-muted mt-2">
                        JPEG, PNG, GIF or WebP, max 5MB. Caption and link to
                        entry are required.
                      </p>
                    </div>

                    {galleryLoading && galleryImages.length === 0 ? (
                      <p className="text-text/60 text-sm">Loading gallery...</p>
                    ) : galleryImages.length === 0 ? (
                      <div className="bg-canvas rounded-2xl border border-border p-10 text-center text-text/60 text-sm">
                        No images yet. Upload a photo or screenshot as proof of
                        work for the day.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {galleryImages.map((img) => (
                          <div
                            key={img.id}
                            className="bg-canvas rounded-xl border border-border overflow-hidden group relative"
                          >
                            <a
                              href={img.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block aspect-square bg-surface-alt"
                            >
                              <img
                                src={img.image_url}
                                alt={img.caption || "Gallery image"}
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div className="p-2">
                              {img.caption && (
                                <p className="text-xs text-text line-clamp-2 mb-1">
                                  {img.caption}
                                </p>
                              )}
                              {img.journal_entry_id != null && (
                                <p className="text-xs text-text-muted mb-1 truncate">
                                  {entriesById.get(img.journal_entry_id)?.title ??
                                    `Entry #${img.journal_entry_id}`}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteGalleryImage(img.id)}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {mainView === "reports" && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-border bg-canvas p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Journal
                    </p>
                    <p className="mt-2 text-2xl font-bold text-text">
                      {entries.length}
                    </p>
                    <p className="text-sm text-text-muted">
                      {totalHoursLogged.toFixed(1)}h logged
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-canvas p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Selected range
                    </p>
                    <p className="mt-2 text-2xl font-bold text-text">
                      {selectedRangeEntries.length}
                    </p>
                    <p className="text-sm text-text-muted">
                      {selectedRangeHours.toFixed(1)}h,{" "}
                      {selectedRangeEvidenceCount} evidence
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-canvas p-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                      Weekly
                    </p>
                    <p className="mt-2 text-2xl font-bold text-text">
                      {entriesForSelectedWeek.length}
                    </p>
                    <p className="text-sm text-text-muted">
                      {weekBounds.start} to {weekBounds.end}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                  <section className="rounded-2xl border border-border bg-canvas p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          Report Range
                        </h3>
                        <p className="text-sm text-text-muted">
                          {selectedRangeLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setCompileForm((form) => ({
                            ...form,
                            startDate: weekBounds.start,
                            endDate: weekBounds.end,
                          }))
                        }
                        className="px-3 py-2 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-colors"
                      >
                        Use week
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={compileForm.startDate}
                          onChange={(e) =>
                            setCompileForm((form) => ({
                              ...form,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={compileForm.endDate}
                          onChange={(e) =>
                            setCompileForm((form) => ({
                              ...form,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {reportReadinessChecks.map((check) => (
                        <div
                          key={check.label}
                          className="rounded-xl border border-border bg-surface p-3"
                        >
                          <div className="flex items-center gap-2">
                            {check.ready ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-warning" />
                            )}
                            <span className="text-sm font-semibold text-text">
                              {check.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-text-muted">
                            {check.ready
                              ? "Ready"
                              : `${check.issueCount} to review`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border bg-canvas p-5 flex flex-col justify-between gap-5">
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          Journal PDF
                        </h3>
                        <p className="mt-1 text-sm text-text-muted">
                          {entries.length} entries available
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openExportPdfModal(entries)}
                          disabled={entries.length === 0}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          Export all
                        </button>
                        <button
                          type="button"
                          onClick={() => openExportPdfModal(selectedRangeEntries)}
                          disabled={selectedRangeEntries.length === 0}
                          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Export range
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-canvas p-5 flex flex-col justify-between gap-5">
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          Weekly Report
                        </h3>
                        <p className="mt-1 text-sm text-text-muted">
                          {entriesForSelectedWeek.length} entries,{" "}
                          {weeklyHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateWeeklySummary}
                          disabled={
                            entriesForSelectedWeek.length === 0 ||
                            weeklySummaryLoading
                          }
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {weeklySummaryLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Summary
                        </button>
                        <button
                          type="button"
                          onClick={exportWeeklyReportToPDF}
                          disabled={!weeklySummary || weeklyExportLoading}
                          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Export
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-canvas p-5 flex flex-col justify-between gap-5 md:col-span-2">
                      <div>
                        <h3 className="text-lg font-bold text-text">
                          CTU Form 6
                        </h3>
                        <p className="mt-1 text-sm text-text-muted">
                          {selectedRangeEntries.length} entries in range
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCompileReportModal()}
                        disabled={selectedRangeEntries.length === 0}
                        className="w-fit flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/40 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-4 h-4" />
                        Compile report
                      </button>
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-border bg-canvas p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-bold text-text">
                      Recent Exports
                    </h3>
                    <span className="text-xs font-medium text-text-muted">
                      {reportHistory.length}
                    </span>
                  </div>
                  {reportHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-text-muted text-center">
                      No exports yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {reportHistory.map((report) => (
                        <li
                          key={report.id}
                          className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        >
                          <div>
                            <p className="font-semibold text-text">
                              {report.title}
                            </p>
                            <p className="text-xs text-text-muted">
                              {report.type} - {report.range}
                            </p>
                          </div>
                          <div className="text-xs text-text-muted sm:text-right">
                            <p>{report.entryCount} entries</p>
                            <p>
                              {new Date(report.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* Create/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-text/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-canvas rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text">
                    {editingEntry ? "Edit Entry" : "New Journal Entry"}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-accent/30 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text/60" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="What happened today?"
                      className="w-full px-4 py-3 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Mood *
                      </label>
                      <select
                        value={formData.mood}
                        onChange={(e) =>
                          setFormData({ ...formData, mood: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-border text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                    <TimePickerInput
                      label="Time In"
                      value={formData.time_in}
                      onChange={(val) =>
                        setFormData({ ...formData, time_in: val })
                      }
                    />
                    <TimePickerInput
                      label="Time Out"
                      value={formData.time_out}
                      onChange={(val) =>
                        setFormData({ ...formData, time_out: val })
                      }
                    />
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Break (mins)
                      </label>
                      <input
                        type="number"
                        value={formData.break_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            break_time: e.target.value,
                          })
                        }
                        placeholder="60"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-text">
                        Entry *
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAIMenu(!showAIMenu)}
                          disabled={isEnhancing || !formData.content.trim()}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-soft-blue text-white text-xs font-medium hover:bg-soft-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-border shadow-sm z-10 overflow-hidden">
                            <div className="p-2">
                              <div className="text-xs font-medium text-text/40 px-3 py-1.5 uppercase tracking-wide">
                                AI Actions
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAIEnhance("improve")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-text hover:bg-accent/30 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Zap className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Improve Writing
                                  </div>
                                  <div className="text-xs text-text/50">
                                    Fix grammar & clarity
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAIEnhance("expand")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-text hover:bg-accent/30 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-soft-blue/10 flex items-center justify-center">
                                  <FileEdit className="w-3.5 h-3.5 text-soft-blue" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Expand Content
                                  </div>
                                  <div className="text-xs text-text/50">
                                    Add more detail & depth
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAIEnhance("professional")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-text hover:bg-accent/30 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-pastel-green flex items-center justify-center">
                                  <Sparkles className="w-3.5 h-3.5 text-soft-green" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    Make Professional
                                  </div>
                                  <div className="text-xs text-text/50">
                                    Portfolio-ready style
                                  </div>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAIEnhance("summarize")}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-text hover:bg-accent/30 rounded-lg transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
                                </div>
                                <div>
                                  <div className="font-medium">Summarize</div>
                                  <div className="text-xs text-text/50">
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
                      className="w-full px-4 py-3 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />

                    {originalContent && (
                      <button
                        type="button"
                        onClick={handleRevertContent}
                        className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Revert to original
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-text">
                        Tags (comma-separated)
                      </label>
                      <button
                        type="button"
                        onClick={handleAISuggestTags}
                        disabled={isEnhancing || !formData.content.trim()}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-soft-blue hover:bg-soft-blue/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-3 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {editingEntry ? "Update Entry" : "Save Entry"}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 rounded-xl border border-border text-text font-medium hover:bg-accent/30 transition-all"
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
            <div className="fixed inset-0 bg-text/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-canvas rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text truncate pr-4">
                    {viewingEntry.title}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        handleEdit(viewingEntry);
                        setViewingEntry(null);
                      }}
                      className="p-2 hover:bg-accent/30 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-primary" />
                    </button>
                    <button
                      onClick={() => setViewingEntry(null)}
                      className="p-2 hover:bg-accent/30 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-text/60" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-text/60">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(viewingEntry.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    {viewingEntry.time_in && viewingEntry.time_out && (
                      <div className="flex items-center gap-2 text-text/60">
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
                            viewingEntry.break_time,
                          ).toFixed(1)}{" "}
                          hours
                        </span>
                      </div>
                    )}
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        moodConfig[viewingEntry.mood]?.color ||
                        "bg-pastel-peach"
                      }`}
                    >
                      {moodEmojis[viewingEntry.mood]} {viewingEntry.mood}
                    </span>
                  </div>

                  <div className="bg-surface rounded-xl p-5 mb-6">
                    <p className="text-text whitespace-pre-wrap leading-relaxed">
                      {viewingEntry.content}
                    </p>
                  </div>

                  {viewingEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {viewingEntry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-border text-primary rounded-lg text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-primary" />
                      Proof of work
                    </h3>
                    {entryImagesLoading ? (
                      <p className="text-sm text-text/60">Loading images...</p>
                    ) : entryImages.length === 0 ? (
                      <div className="rounded-xl border border-border border-dashed bg-surface/50 p-6 text-center">
                        <p className="text-sm text-text/60 mb-3">
                          No images for this entry yet.
                        </p>
                        <div className="flex flex-col items-center gap-2 mb-3">
                          <label className="text-xs font-medium text-text w-full text-left max-w-xs">
                            Caption *
                          </label>
                          <input
                            type="text"
                            value={entryViewCaption}
                            onChange={(e) =>
                              setEntryViewCaption(e.target.value)
                            }
                            placeholder="e.g. Screenshot of dashboard"
                            className="w-full max-w-xs px-3 py-2 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
                          />
                        </div>
                        <label
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium transition-colors ${
                            !entryViewCaption.trim() || entryViewUploading
                              ? "cursor-not-allowed opacity-60 text-text-muted"
                              : "text-text hover:bg-accent/30 cursor-pointer"
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          {entryViewUploading ? "Uploading..." : "Add image"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="sr-only"
                            onChange={handleEntryViewUpload}
                            disabled={
                              entryViewUploading || !entryViewCaption.trim()
                            }
                          />
                        </label>
                        <p className="text-xs text-text-muted mt-2">
                          JPEG, PNG, GIF or WebP, max 5MB. Caption is required.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {entryImages.map((img) => (
                            <div
                              key={img.id}
                              className="rounded-xl border border-border overflow-hidden bg-surface-alt"
                            >
                              <a
                                href={img.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block aspect-square"
                              >
                                <img
                                  src={img.image_url}
                                  alt={img.caption || "Proof of work"}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                              <div className="p-2 flex items-center justify-between gap-2">
                                {img.caption ? (
                                  <p className="text-xs text-text truncate flex-1">
                                    {img.caption}
                                  </p>
                                ) : (
                                  <span />
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteGalleryImage(img.id)
                                  }
                                  className="text-xs text-red-500 hover:underline shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={entryViewCaption}
                            onChange={(e) =>
                              setEntryViewCaption(e.target.value)
                            }
                            placeholder="Caption *"
                            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-primary"
                          />
                          <label
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors ${
                              !entryViewCaption.trim() || entryViewUploading
                                ? "cursor-not-allowed opacity-60 text-text-muted"
                                : "text-text hover:bg-accent/30 cursor-pointer"
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            {entryViewUploading
                              ? "Uploading..."
                              : "Add another"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="sr-only"
                              onChange={handleEntryViewUpload}
                              disabled={
                                entryViewUploading || !entryViewCaption.trim()
                              }
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Merge Notes Modal */}
        {mergeModalOpen && (
          <div className="fixed inset-0 bg-text/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-canvas rounded-2xl max-w-md w-full shadow-2xl p-6">
              <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                <Merge className="w-5 h-5 text-primary" />
                Merge to journal
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Create one journal entry from {selectedNoteIds.size} selected
                note(s). You can edit title and date before saving.
              </p>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={mergeTitle}
                    onChange={(e) => setMergeTitle(e.target.value)}
                    placeholder="e.g. Week notes"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={mergeDate}
                    onChange={(e) => setMergeDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-text focus:outline-none focus:border-primary text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteNotesAfterMerge}
                    onChange={(e) => setDeleteNotesAfterMerge(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">
                    Delete notes after merging
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleMergeNotes}
                  disabled={mergeSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mergeSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="w-4 h-4" />
                      Merge to journal
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-border text-text text-sm font-medium hover:bg-accent/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compile Report (CTU OJT Form 6) modal */}
        {compileModalOpen && (
          <div className="fixed inset-0 bg-text/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-canvas rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Compile Report
                </h2>
                <button
                  type="button"
                  onClick={() => setCompileModalOpen(false)}
                  className="p-2 hover:bg-accent/30 rounded-xl transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-text/60" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">
                      Entries
                    </p>
                    <p className="text-lg font-bold text-text">
                      {selectedRangeEntries.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">
                      Hours
                    </p>
                    <p className="text-lg font-bold text-text">
                      {selectedRangeHours.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">
                      Evidence
                    </p>
                    <p className="text-lg font-bold text-text">
                      {selectedRangeEvidenceCount}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Trainee Name
                    </label>
                    <input
                      type="text"
                      value={compileForm.traineeName}
                      onChange={(e) =>
                        setCompileForm((f) => ({
                          ...f,
                          traineeName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Juan Dela Cruz"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Course & Major
                    </label>
                    <input
                      type="text"
                      value={compileForm.course}
                      onChange={(e) =>
                        setCompileForm((f) => ({
                          ...f,
                          course: e.target.value,
                        }))
                      }
                      placeholder="e.g. BSIT — Web Development"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Industry Partner
                    </label>
                    <input
                      type="text"
                      value={compileForm.industryPartner}
                      onChange={(e) =>
                        setCompileForm((f) => ({
                          ...f,
                          industryPartner: e.target.value,
                        }))
                      }
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={compileForm.department}
                      onChange={(e) =>
                        setCompileForm((f) => ({
                          ...f,
                          department: e.target.value,
                        }))
                      }
                      placeholder="e.g. IT Department"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={compileForm.startDate}
                        onChange={(e) =>
                          setCompileForm((f) => ({
                            ...f,
                            startDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={compileForm.endDate}
                        onChange={(e) =>
                          setCompileForm((f) => ({
                            ...f,
                            endDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCompileReport}
                  disabled={
                    compileLoading ||
                    !compileForm.startDate ||
                    !compileForm.endDate
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {compileLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Compiling with AI...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate PDF
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCompileModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export PDF modal */}
        {exportPdfModalOpen && (
          <div className="fixed inset-0 bg-text/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-canvas rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-text flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export journal to PDF
                </h2>
                <button
                  type="button"
                  onClick={() => setExportPdfModalOpen(false)}
                  className="p-2 hover:bg-accent/30 rounded-xl transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-text/60" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <p className="text-sm text-text-muted mb-3">
                  Choose which journal entries to include in the PDF.
                </p>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={exportPdfSelectAll}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-text/40">|</span>
                  <button
                    type="button"
                    onClick={exportPdfClearSelection}
                    className="text-xs font-medium text-text-muted hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-2">
                  {exportPdfEntryPool.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/20 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleExportPdfEntry(entry.id)}
                        className="shrink-0 w-5 h-5 rounded border-2 border-border flex items-center justify-center hover:border-primary transition-colors"
                        aria-label={
                          exportPdfSelectedIds.has(entry.id)
                            ? "Deselect entry"
                            : "Select entry"
                        }
                      >
                        {exportPdfSelectedIds.has(entry.id) && (
                          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {entry.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 border-t border-border flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleExportSelectedPdf}
                  disabled={exportPdfSelectedIds.size === 0 || exportPdfLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportPdfLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Preparing PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export selected ({exportPdfSelectedIds.size})
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setExportPdfModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-text hover:bg-accent/30 transition-all"
                >
                  Cancel
                </button>
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
