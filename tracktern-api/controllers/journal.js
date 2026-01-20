import { supabase } from '../config/supabase.js';
import { io } from "../index.js"; 

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
    const { title, date, content, mood, tags } = req.body;

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title,
        date,
        content,
        mood,
        tags: tags || []
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
    const { title, date, content, mood, tags } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = date;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    if (tags !== undefined) updateData.tags = tags;
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