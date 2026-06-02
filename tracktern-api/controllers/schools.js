import { supabase } from "../config/supabase.js";

/**
 * GET /api/schools
 * Returns all schools for dropdown selection.
 */
export const listSchools = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("schools")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;

    res.json({ schools: data || [] });
  } catch (err) {
    console.error("listSchools error:", err);
    res.status(500).json({ error: "Failed to list schools" });
  }
};

/**
 * GET /api/schools/search?q=ctu
 * Returns matching schools (by canonical name or alias, case-insensitive).
 */
export const searchSchools = async (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  if (!q || q.length < 2) return res.json({ schools: [] });

  try {
    // Search by alias first (covers abbreviations like "CTU")
    const { data: aliasMatches } = await supabase
      .from("school_aliases")
      .select("school_id, schools(id, name)")
      .ilike("alias", `%${q}%`)
      .limit(10);

    const fromAliases = (aliasMatches || [])
      .map((r) => r.schools)
      .filter(Boolean);

    // Also search canonical names
    const { data: nameMatches } = await supabase
      .from("schools")
      .select("id, name")
      .ilike("name", `%${q}%`)
      .limit(10);

    // Merge, deduplicate by id
    const seen = new Set();
    const merged = [...fromAliases, ...(nameMatches || [])].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });

    res.json({ schools: merged.slice(0, 8) });
  } catch (err) {
    console.error("searchSchools error:", err);
    res.status(500).json({ error: "Failed to search schools" });
  }
};

/**
 * POST /api/schools
 * Create a new school (if not existing) and return it.
 * Body: { name: string }
 */
export const createSchool = async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  try {
    // Check if canonical name already exists (case-insensitive)
    const { data: existing } = await supabase
      .from("schools")
      .select("id, name")
      .ilike("name", name)
      .maybeSingle();

    if (existing) return res.json({ school: existing });

    const { data, error } = await supabase
      .from("schools")
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    // Also insert a lowercase alias so it's searchable
    await supabase.from("school_aliases").upsert({
      school_id: data.id,
      alias: name.toLowerCase(),
    });

    res.json({ school: data });
  } catch (err) {
    console.error("createSchool error:", err);
    res.status(500).json({ error: "Failed to create school" });
  }
};

/**
 * POST /api/schools/:id/aliases
 * Add an alias to a school (e.g. "CTU Danao" for a school id).
 * Body: { alias: string }
 */
export const addAlias = async (req, res) => {
  const schoolId = Number(req.params.id);
  const alias = (req.body.alias || "").trim().toLowerCase();
  if (!alias) return res.status(400).json({ error: "alias is required" });

  try {
    const { data, error } = await supabase
      .from("school_aliases")
      .upsert({ school_id: schoolId, alias })
      .select()
      .single();

    if (error) throw error;
    res.json({ alias: data });
  } catch (err) {
    console.error("addAlias error:", err);
    res.status(500).json({ error: "Failed to add alias" });
  }
};
