import { supabase } from "../config/supabase.js";

// Unambiguous invite-code alphabet (no 0/O/1/I).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode();
    const { data } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  // Extremely unlikely fallback.
  return generateCode(8);
}

// POST /api/groups  { name }
export const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Group name is required" });

    const invite_code = await generateUniqueCode();

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, invite_code, owner_id: userId })
      .select()
      .single();

    if (error) {
      console.error("createGroup error:", error.message);
      return res.status(500).json({ error: "Failed to create group" });
    }

    // Owner auto-joins.
    await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId });

    res.status(201).json({ group });
  } catch (err) {
    console.error("createGroup error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/groups/join  { invite_code }
export const joinGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const code = (req.body?.invite_code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Invite code is required" });

    const { data: group, error } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();

    if (error) {
      console.error("joinGroup lookup error:", error.message);
      return res.status(500).json({ error: "Failed to look up group" });
    }
    if (!group) return res.status(404).json({ error: "Invalid invite code" });

    const { error: joinError } = await supabase
      .from("group_members")
      .upsert({ group_id: group.id, user_id: userId });

    if (joinError) {
      console.error("joinGroup error:", joinError.message);
      return res.status(500).json({ error: "Failed to join group" });
    }

    res.json({ group });
  } catch (err) {
    console.error("joinGroup error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/mine
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: memberships, error } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, invite_code, owner_id, created_at)")
      .eq("user_id", userId);

    if (error) {
      console.error("getMyGroups error:", error.message);
      return res.status(500).json({ error: "Failed to load groups" });
    }

    const groups = (memberships || [])
      .map((m) => m.groups)
      .filter(Boolean);

    res.json({ groups });
  } catch (err) {
    console.error("getMyGroups error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/groups/:id/leaderboard
export const getGroupLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;

    // Ensure requester is a member.
    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const { data: members, error } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (error) {
      console.error("getGroupLeaderboard members error:", error.message);
      return res.status(500).json({ error: "Failed to load leaderboard" });
    }

    const ids = (members || []).map((m) => m.user_id);
    if (ids.length === 0) return res.json({ leaderboard: [] });

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nickname, full_name, school, total_hours, required_hours")
      .in("id", ids)
      .order("total_hours", { ascending: false });

    if (profilesError) {
      console.error("getGroupLeaderboard profiles error:", profilesError.message);
      return res.status(500).json({ error: "Failed to load leaderboard" });
    }

    res.json({ leaderboard: profiles || [] });
  } catch (err) {
    console.error("getGroupLeaderboard error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
};
