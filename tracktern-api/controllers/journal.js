import { supabase } from '../config/supabase.js';
import { io } from "../index.js";
import { geminiModel } from '../config/gemini.js';
import genAI from '../config/gemini.js';

// Higher token limit model for compilation (monthly entries can be large)
const geminiCompileModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.4,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});

function parseLastModified(header) {
  if (!header) return null;
  const d = new Date(header);
  return isNaN(d.getTime()) ? null : d;
}

export const getEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const ifModifiedSince = parseLastModified(req.get('if-modified-since'));

    if (ifModifiedSince) {
      const { data: latest, error: latestError } = await supabase
        .from('journal_entries')
        .select('updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestError && latest?.updated_at) {
        const serverDate = new Date(latest.updated_at).getTime();
        if (serverDate <= ifModifiedSince.getTime() + 1000) {
          return res.status(304).end();
        }
      }
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Get Entries Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch journal entries',
        details: error.message
      });
    }

    const maxUpdated = data?.length
      ? data.reduce((max, e) => (e.updated_at > max ? e.updated_at : max), data[0].updated_at)
      : null;
    if (maxUpdated) {
      res.setHeader('Last-Modified', new Date(maxUpdated).toUTCString());
      res.setHeader('Cache-Control', 'private, max-age=0');
    }
    res.json({ entries: data });

  } catch (error) {
    console.error('Get Entries Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEntryById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Entry not found' });
      }
      return res.status(500).json({
        error: 'Failed to fetch entry',
        details: error.message
      });
    }

    res.json({ entry: data });

  } catch (error) {
    console.error('Get Entry Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, date, content, mood, tags, time_in, time_out, break_time } = req.body;

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title,
        date,
        content,
        mood,
        tags: tags || [],
        time_in,
        time_out,
        break_time: break_time || null
      })
      .select()
      .single();

    if (error) {
      console.error('Add Entry Error:', error);
      return res.status(500).json({
        error: 'Failed to create entry',
        details: error.message
      });
    }

    io.to(userId).emit("journal-entry-added", data);
    res.status(201).json({
      entry: data,
      message: 'Entry created successfully'
    });

  } catch (error) {
    console.error('Add Entry Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, date, content, mood, tags, time_in, time_out, break_time } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = date;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    if (tags !== undefined) updateData.tags = tags;
    if (time_in !== undefined) updateData.time_in = time_in;
    if (time_out !== undefined) updateData.time_out = time_out;
    if (break_time !== undefined) updateData.break_time = break_time;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Entry not found or unauthorized' });
      }
      console.error('Update Entry Error:', error);
      return res.status(500).json({
        error: 'Failed to update entry',
        details: error.message
      });
    }

    io.to(userId).emit("journal-entry-updated", data);
    res.json({
      entry: data,
      message: 'Entry updated successfully'
    });

  } catch (error) {
    console.error('Update Entry Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Delete Entry Error:', error);
      return res.status(500).json({
        error: 'Failed to delete entry',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'Entry not found or unauthorized'
      });
    }

    io.to(userId).emit("journal-entry-deleted", data);
    res.json({
      message: 'Entry deleted successfully',
      deletedEntry: data[0]
    });

  } catch (error) {
    console.error('Delete Entry Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enhanceEntry = async (req, res) => {
  try {
    const { content, title, enhanceType } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY is not set'
      });
    }

    let prompt = '';
    
    switch (enhanceType) {
      case 'improve':
        prompt = `You are an internship journal writing assistant. Improve the following journal entry by:
- Fixing grammar and spelling errors
- Making the writing clearer without sounding inflated or generic
- Avoiding motivational filler, corporate buzzwords, and generic generated phrasing
- Keeping the original meaning and personal voice—do not add or invent events, details, or stories
- Maintaining a first-person perspective. Keep the response concise and natural

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Provide only the improved content. No explanations, no title. Do not fabricate any content.`;
        break;
        
      case 'expand':
        prompt = `You are an internship journal writing assistant. Expand the following journal entry by:
- Elaborating only on what the user actually wrote; add detail and clarity to their existing points
- Do NOT invent events, experiences, anecdotes, or stories that are not in the original text
- Do NOT add fictional details, examples, or hypotheticals—only expand on facts and ideas already present
- If there is not enough detail to expand, improve clarity instead of padding the entry
- You may rephrase for flow and add brief, grounded reflections that directly follow from what they wrote
- Maintain first-person perspective and the user's voice. Keep it authentic and not overly formal

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Provide only the expanded content. No explanations, no title. Stay strictly faithful to the original; do not make up anything.`;
        break;
        
      case 'professional':
        prompt = `You are an internship journal writing assistant. Rewrite the following journal entry to be more professional and suitable for a portfolio or performance review:
- Use plain professional language while maintaining authenticity
- Highlight only achievements, skills, and contributions that are stated or clearly implied in the original—do not invent events or accomplishments
- Structure the content clearly. Keep the first-person perspective
- Quantify only where the original gives numbers or clear basis; do not make up figures or examples
- Avoid buzzwords, exaggerated impact, and generic career-coach phrasing

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Provide only the professional version. No explanations, no title. Do not add fictional or invented content.`;
        break;
        
      case 'summarize':
        prompt = `You are an internship journal writing assistant. Summarize the following journal entry into a brief, useful summary:
- Capture only the key points and takeaways that are actually in the entry—do not add or invent events, learnings, or accomplishments
- Keep it to 2-3 sentences. Maintain the first-person perspective
- Avoid motivational framing and generic filler

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Provide only the summary. No explanations or prefixes. Do not fabricate any content.`;
        break;
        
      default:
        prompt = `You are an internship journal writing assistant. Improve the following journal entry by fixing grammar and clarity while keeping the original voice and meaning. Avoid generic generated phrasing, motivational filler, and inflated claims. Do not add or invent events, details, or stories.

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Provide only the improved content. No explanations, no title. Do not fabricate any content.`;
    }

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const enhancedContent = response.text();

    res.json({ 
      enhancedContent,
      originalContent: content,
      enhanceType: enhanceType || 'improve'
    });

  } catch (error) {
    console.error('Enhance Entry Error:', error);
    
    if (error.message?.includes('API key')) {
      return res.status(500).json({ 
        error: 'AI service configuration error',
        details: 'Invalid or missing API key'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to enhance entry',
      details: error.message 
    });
  }
};

export const suggestTags = async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY is not set'
      });
    }

    const prompt = `You are an internship journal assistant. Suggest relevant tags for this journal entry. 
Return only a JSON array of 3-5 single-word or short tags (no hashtags, no explanation).
Tags should be relevant to internship experiences, skills, or activities mentioned.

Title: "${title || 'Untitled'}"
Content: ${content}

Respond with only a JSON array like: ["tag1", "tag2", "tag3"]`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    let tags;
    try {
      tags = JSON.parse(text);
    } catch {
      const match = text.match(/\[.*\]/);
      tags = match ? JSON.parse(match[0]) : [];
    }

    res.json({ tags: Array.isArray(tags) ? tags : [] });

  } catch (error) {
    console.error('Suggest Tags Error:', error);
    res.status(500).json({ 
      error: 'Failed to suggest tags',
      details: error.message 
    });
  }
};

export const summarizeWeek = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'At least one entry is required for weekly summary',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY is not set',
      });
    }

    const entriesText = entries
      .map((e, i) => {
        const dateStr = e.date
          ? new Date(e.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown date';
        const hours =
          e.time_in && e.time_out
            ? (() => {
                const [inH, inM] = e.time_in.split(':').map(Number);
                const [outH, outM] = e.time_out.split(':').map(Number);
                const breakM = e.break_time || 0;
                const totalM =
                  outH * 60 + outM - (inH * 60 + inM) - breakM;
                return Math.max(0, totalM / 60).toFixed(1);
              })()
            : null;
        return `[${i + 1}] Date: ${dateStr}\nTitle: ${e.title || 'Untitled'}\n${hours ? `Hours: ${hours}\n` : ''}Mood: ${e.mood || '—'}\nContent:\n${e.content || ''}\n${(e.tags && e.tags.length) ? `Tags: ${e.tags.join(', ')}\n` : ''}`;
      })
      .join('\n---\n');

    const prompt = `You are an internship journal assistant. Summarize the following week's journal entries into one plain weekly report.

Guidelines:
- Write in first person, as the intern. Use only information that appears in the entries below.
- Do NOT invent events, activities, learnings, challenges, or accomplishments—only summarize what is actually written.
- Highlight main activities, learnings, challenges, and accomplishments that are stated in the entries.
- Use direct language. Avoid motivational filler, buzzwords, and exaggerated claims.
- Keep the summary to 1–2 short paragraphs suitable for a weekly report or supervisor update.
- Do not add headers or labels; output only the summary text.

Journal entries for the week:

${entriesText}

Provide only the summary text, no preamble. Stay strictly faithful to the entries; do not make up stories or details.`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    res.json({ summary });
  } catch (error) {
    console.error('Summarize Week Error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service configuration error',
        details: 'Invalid or missing API key',
      });
    }

    res.status(500).json({
      error: 'Failed to generate weekly summary',
      details: error.message,
    });
  }
};

export const compileJournal = async (req, res) => {
  try {
    const { entries, traineeName, course, industryPartner, department, dateRange } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'At least one entry is required to compile a journal',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY is not set',
      });
    }

    const entriesText = entries
      .map((e, i) => {
        const dateStr = e.date
          ? new Date(e.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown date';
        const hours =
          e.time_in && e.time_out
            ? (() => {
                const [inH, inM] = e.time_in.split(':').map(Number);
                const [outH, outM] = e.time_out.split(':').map(Number);
                const breakM = e.break_time || 0;
                const totalM = outH * 60 + outM - (inH * 60 + inM) - breakM;
                return Math.max(0, totalM / 60).toFixed(1);
              })()
            : null;
        return `[${i + 1}] Date: ${dateStr}\nTitle: ${e.title || 'Untitled'}\n${hours ? `Hours: ${hours}\n` : ''}Mood: ${e.mood || '—'}\nContent:\n${e.content || ''}\n${e.tags && e.tags.length ? `Tags: ${e.tags.join(', ')}\n` : ''}`;
      })
      .join('\n---\n');

    const prompt = `You are an internship report assistant. Analyze the following journal entries and produce a structured JSON summary suitable for a CTU (Cebu Technological University) OJT Form 6 Monthly Report.

STRICT RULES:
- Extract ONLY what is explicitly mentioned. Do NOT invent anything.
- "activities": concrete tasks done. "learnings": skills and insights gained.
- EXACTLY 3 to 5 bullets per array. Never more than 5. Merge aggressively.
- Each bullet = one short sentence, max 8 words.
- Use plain, specific wording. No buzzwords or inflated claims.
- Return ONLY a valid JSON object. No markdown, no code fences, no extra text.

Expected format:
{"activities":["bullet 1","bullet 2"],"learnings":["bullet 1","bullet 2"]}

Journal entries (${entries.length} total):

${entriesText}`;

    const result = await geminiCompileModel.generateContent(prompt);
    const response = await result.response;
    const fullText = response.text().trim();

    // Extract the first JSON object from the response regardless of surrounding text/fences
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Compile Journal: no JSON object found in response:', fullText.slice(0, 300));
      return res.status(500).json({
        error: 'AI returned malformed JSON',
        details: fullText.slice(0, 200),
      });
    }

    // Strip trailing commas before ] or } — Gemini thinking model often produces these
    const sanitized = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');

    let parsed;
    try {
      parsed = JSON.parse(sanitized);
    } catch {
      console.error('Compile Journal: JSON.parse failed on:', sanitized.slice(0, 300));
      return res.status(500).json({
        error: 'AI returned malformed JSON',
        details: sanitized.slice(0, 200),
      });
    }

    const activities = Array.isArray(parsed.activities) ? parsed.activities.filter(Boolean) : [];
    const learnings = Array.isArray(parsed.learnings) ? parsed.learnings.filter(Boolean) : [];

    if (activities.length === 0 && learnings.length === 0) {
      return res.status(500).json({
        error: 'AI returned empty summary',
        details: 'No activities or learnings could be extracted from the entries.',
      });
    }

    res.json({ activities, learnings });
  } catch (error) {
    console.error('Compile Journal Error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service configuration error',
        details: 'Invalid or missing API key',
      });
    }

    res.status(500).json({
      error: 'Failed to compile journal summary',
      details: error.message,
    });
  }
};

export const journeySummary = async (req, res) => {
  try {
    const { applications } = req.body;

    if (!applications || !Array.isArray(applications)) {
      return res.status(400).json({
        error: 'Applications array is required',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'AI service not configured',
        details: 'GEMINI_API_KEY is not set',
      });
    }

    const sorted = [...applications].sort(
      (a, b) => new Date(a.date_applied || 0) - new Date(b.date_applied || 0)
    );
    const eventsText = sorted
      .map((app, i) => {
        const dateStr = app.date_applied
          ? new Date(app.date_applied).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown date';
        const role = app.position ? ` (${app.position})` : '';
        return `[${i + 1}] ${dateStr} — Applied to ${app.company_name}${role}. Current status: ${app.status || 'applied'}.`;
      })
      .join('\n');

    const prompt = `You write concise summaries for an internship tracker. The user has been tracking applications. Below is a short timeline of events (company, role, date applied, current status).

Your task: Write 2-3 factual sentences in second person ("You applied...", "You're interviewing with...").
- Use only the facts from the timeline. Do not invent companies, dates, outcomes, or lessons.
- If there is an accepted offer, mention it plainly.
- If the search is still in progress, summarize the current statuses without cheerleading.
- Use clear, direct language. Avoid motivational filler, hype, and generic career-coach phrasing.
- No bullet points or headers; output only the paragraph.`;

    const fullPrompt = `${prompt}

Timeline of applications (chronological, oldest first):
${eventsText}

Provide only the narrative paragraph.`;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const narrative = response.text().trim();

    res.json({ narrative });
  } catch (error) {
    console.error('Journey Summary Error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'AI service configuration error',
        details: 'Invalid or missing API key',
      });
    }

    res.status(500).json({
      error: 'Failed to generate journey summary',
      details: error.message,
    });
  }
};
