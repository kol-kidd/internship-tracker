import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import {
  Typography,
  TextField,
  InputAdornment,
  Collapse,
  Button,
} from "@mui/material";
import { useAuthStore } from "@/store/authStore";
import { useJournalStore } from "@/store/journalStore";
import { Bounce, toast } from "react-toastify";
import LoadingOverlay from "@/components/Loading";
import ConfirmationDialog from "@/components/Application/ConfirmationDialog";

interface JournalEntry {
  id: number;
  user_id: string;
  title: string;
  date: string;
  content: string;
  mood: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const LogsPage = () => {
  const { user } = useAuthStore();
  const {
    entries,
    loading,
    fetchEntries,
    subscribeEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useJournalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryTitle, setSelectedEntryTitle] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    content: "",
    mood: "neutral",
    tags: "",
  });

  // Fetch entries and subscribe to real-time changes
  useEffect(() => {
    if (user?.id) {
      fetchEntries(user.id);
      const unsubscribe = subscribeEntries(user.id);
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id, fetchEntries, subscribeEntries]);

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

      let result;
      if (editingEntry) {
        // Update existing entry
        result = await updateEntry(user.id, editingEntry.id, {
          title: formData.title,
          date: formData.date,
          content: formData.content,
          mood: formData.mood,
          tags: tagsArray,
        });

        if (result.error) throw result.error;

        toast.success("Entry updated successfully", {
          position: "top-right",
          theme: "light",
          transition: Bounce,
        });
      } else {
        // Create new entry
        result = await addEntry(user.id, {
          title: formData.title,
          date: formData.date,
          content: formData.content,
          mood: formData.mood,
          tags: tagsArray,
        });

        if (result.error) throw result.error;

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
    });
    setEditingEntry(null);
    setIsModalOpen(false);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      date: entry.date,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags.join(", "),
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
      const result = await deleteEntry(user.id, selectedEntryId);

      if (result.error) throw result.error;

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

  // Filter and search entries
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

  const moodColors: Record<string, string> = {
    great: "bg-green-100 text-green-700 border-green-200",
    good: "bg-blue-100 text-blue-700 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    challenging: "bg-orange-100 text-orange-700 border-orange-200",
    stressful: "bg-red-100 text-red-700 border-red-200",
  };

  const moodConfig: Record<string, { label: string; color: string }> = {
    great: { label: "Great", color: "green" },
    good: { label: "Good", color: "blue" },
    neutral: { label: "Neutral", color: "gray" },
    challenging: { label: "Challenging", color: "orange" },
    stressful: { label: "Stressful", color: "red" },
  };

  // Calculate stats
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const thisMonth = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    return (
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const thisWeek = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return entryDate >= weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <Typography sx={{ mt: 2, color: "grey.600" }}>
            Loading journal entries...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "grey.900" }}
              >
                Internship Journal
              </Typography>
              <Typography variant="body2" sx={{ color: "grey.500", mt: 0.5 }}>
                Document your journey, reflections, and daily experiences
              </Typography>
            </div>
            <Button
              variant="contained"
              startIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
              sx={{
                bgcolor: "black",
                "&:hover": { bgcolor: "grey.800" },
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 2,
              }}
            >
              New Entry
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} color="#9CA3AF" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    height: "40px",
                    "&:hover fieldset": {
                      borderColor: "grey.400",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "black",
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<SlidersHorizontal className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  minWidth: 120,
                  height: "40px",
                  bgcolor: showFilters ? "grey.100" : "white",
                  color: "grey.700",
                  borderColor: "grey.300",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: showFilters ? "grey.200" : "grey.50",
                    borderColor: "grey.400",
                  },
                }}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          <Collapse in={showFilters}>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "grey.900", mb: 2 }}
              >
                Filter by Mood
              </Typography>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterMood === "all" ? "contained" : "outlined"}
                  onClick={() => setFilterMood("all")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    bgcolor: filterMood === "all" ? "black" : "white",
                    color: filterMood === "all" ? "white" : "grey.700",
                    borderColor: "grey.300",
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: filterMood === "all" ? "grey.800" : "grey.50",
                      borderColor: "grey.400",
                    },
                  }}
                >
                  All ({entries.length})
                </Button>
                {Object.entries(moodConfig).map(([mood, config]) => (
                  <Button
                    key={mood}
                    variant={filterMood === mood ? "contained" : "outlined"}
                    onClick={() => setFilterMood(mood)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      bgcolor: filterMood === mood ? "black" : "white",
                      color: filterMood === mood ? "white" : "grey.700",
                      borderColor: filterMood === mood ? "black" : "grey.300",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: filterMood === mood ? "grey.800" : "grey.50",
                        opacity: 0.9,
                      },
                    }}
                  >
                    {moodEmojis[mood]} {config.label} ({moodCounts[mood] || 0})
                  </Button>
                ))}
              </div>
            </div>
          </Collapse>
        </div>
      </div>

      {/* Applications Grid/List */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Typography variant="body2" sx={{ color: "grey.600", mb: 1 }}>
              Total Entries
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: "grey.900" }}
            >
              {entries.length}
            </Typography>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Typography variant="body2" sx={{ color: "grey.600", mb: 1 }}>
              This Month
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: "grey.900" }}
            >
              {thisMonth}
            </Typography>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Typography variant="body2" sx={{ color: "grey.600", mb: 1 }}>
              This Week
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, color: "grey.900" }}
            >
              {thisWeek}
            </Typography>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, color: "grey.900", mb: 1 }}
            >
              No journal entries found
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.500" }}>
              {searchQuery || filterMood !== "all"
                ? "Try adjusting your filters or search query"
                : "Start documenting your internship journey today!"}
            </Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "grey.900", mb: 1 }}
                    >
                      {entry.title}
                    </Typography>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <Typography variant="body2" sx={{ color: "grey.600" }}>
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        moodColors[entry.mood]
                      }`}
                    >
                      {moodEmojis[entry.mood]} {entry.mood}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entry.id, entry.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Typography
                  variant="body2"
                  sx={{
                    color: "grey.700",
                    mb: 2,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {entry.content}
                </Typography>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: "grey.900" }}
              >
                {editingEntry ? "Edit Entry" : "New Journal Entry"}
              </Typography>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="What happened today?"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "grey.400",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "black",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "grey.400",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "black",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood *
                  </label>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    value={formData.mood}
                    onChange={(e) =>
                      setFormData({ ...formData, mood: e.target.value })
                    }
                    SelectProps={{
                      native: true,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                          borderColor: "grey.400",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "black",
                          borderWidth: 2,
                        },
                      },
                    }}
                  >
                    <option value="great">😊 Great</option>
                    <option value="good">🙂 Good</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="challenging">😔 Challenging</option>
                    <option value="stressful">😰 Stressful</option>
                  </TextField>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry *
                </label>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write about your day, what you learned, challenges faced, accomplishments..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "grey.400",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "black",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="learning, meeting, project, milestone"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      "&:hover fieldset": {
                        borderColor: "grey.400",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "black",
                        borderWidth: 2,
                      },
                    },
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="contained"
                  startIcon={<Save className="w-4 h-4" />}
                  onClick={handleSubmit}
                  disabled={saving}
                  fullWidth
                  sx={{
                    bgcolor: "black",
                    "&:hover": { bgcolor: "grey.800" },
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: 2,
                    py: 1.5,
                  }}
                >
                  {editingEntry ? "Update Entry" : "Save Entry"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderColor: "grey.300",
                    color: "grey.700",
                    borderRadius: 2,
                    py: 1.5,
                    minWidth: 120,
                    "&:hover": {
                      bgcolor: "grey.50",
                      borderColor: "grey.400",
                    },
                  }}
                >
                  Cancel
                </Button>
              </div>
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
  );
};

export default LogsPage;
