import { supabase } from '../config/supabase.js';
import { io } from "../index.js";
import { geminiModel } from '../config/gemini.js'; 

export const getEntries = async (req, res) => {
  try {
    const userId = req.user.id;

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
- Making the writing more professional and clear
- Keeping the original meaning and personal voice
- Maintaining a first-person perspective
- Keep the response concise and natural

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Please provide only the improved content without any explanations or prefixes. Do not include the title.`;
        break;
        
      case 'expand':
        prompt = `You are an internship journal writing assistant. Expand the following journal entry by:
- Adding more detail and depth to the experiences described
- Including potential reflections on what was learned
- Suggesting connections to career goals or skills gained
- Maintaining a first-person perspective and personal voice
- Keep it authentic and not overly formal

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Please provide only the expanded content without any explanations or prefixes. Do not include the title.`;
        break;
        
      case 'professional':
        prompt = `You are an internship journal writing assistant. Rewrite the following journal entry to be more professional and suitable for a portfolio or performance review:
- Use professional language while maintaining authenticity
- Highlight achievements, skills gained, and contributions
- Structure the content clearly
- Keep the first-person perspective
- Quantify accomplishments where possible

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Please provide only the professional version without any explanations or prefixes. Do not include the title.`;
        break;
        
      case 'summarize':
        prompt = `You are an internship journal writing assistant. Summarize the following journal entry into a brief, impactful summary:
- Capture the key points and main takeaways
- Keep it to 2-3 sentences
- Maintain the first-person perspective
- Focus on accomplishments and learnings

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Please provide only the summary without any explanations or prefixes.`;
        break;
        
      default:
        prompt = `You are an internship journal writing assistant. Improve the following journal entry by fixing grammar, improving clarity, and making it more engaging while keeping the original voice and meaning:

Original entry title: "${title || 'Untitled'}"
Original content:
${content}

Please provide only the improved content without any explanations or prefixes. Do not include the title.`;
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

    const prompt = `You are an internship journal assistant. Summarize the following week's journal entries into one concise weekly report.

Guidelines:
- Write in first person, as the intern.
- Highlight main activities, learnings, challenges, and accomplishments across the week.
- Keep the summary to 1–2 short paragraphs suitable for a weekly report or supervisor update.
- Do not add headers or labels; output only the summary text.

Journal entries for the week:

${entriesText}

Provide only the summary text, no preamble.`;

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