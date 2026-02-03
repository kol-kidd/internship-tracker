import { supabase } from '../config/supabase.js';

function parseLastModified(header) {
  if (!header) return null;
  const d = new Date(header);
  return isNaN(d.getTime()) ? null : d;
}

export const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const ifModifiedSince = parseLastModified(req.get('if-modified-since'));

    if (ifModifiedSince) {
      const { data: latest, error: latestError } = await supabase
        .from('journal_notes')
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
      .from('journal_notes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Get Notes Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch notes',
        details: error.message,
      });
    }

    const maxUpdated = data?.length
      ? data.reduce((max, n) => (n.updated_at > max ? n.updated_at : max), data[0].updated_at)
      : null;
    if (maxUpdated) {
      res.setHeader('Last-Modified', new Date(maxUpdated).toUTCString());
      res.setHeader('Cache-Control', 'private, max-age=0');
    }
    res.json({ notes: data });
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, date, time } = req.body;

    const noteDate = date || new Date().toISOString().split('T')[0];
    const noteTime = time != null && String(time).trim() !== '' ? String(time).trim() : null;

    const { data, error } = await supabase
      .from('journal_notes')
      .insert({
        user_id: userId,
        content: content?.trim() || '',
        date: noteDate,
        time: noteTime,
      })
      .select()
      .single();

    if (error) {
      console.error('Add Note Error:', error);
      return res.status(500).json({
        error: 'Failed to create note',
        details: error.message,
      });
    }

    res.status(201).json({
      note: data,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Add Note Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, date, time } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (content !== undefined) updateData.content = content.trim();
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time != null && String(time).trim() !== '' ? String(time).trim() : null;

    const { data, error } = await supabase
      .from('journal_notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Note not found' });
      }
      console.error('Update Note Error:', error);
      return res.status(500).json({
        error: 'Failed to update note',
        details: error.message,
      });
    }

    res.json({
      note: data,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Update Note Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('journal_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Delete Note Error:', error);
      return res.status(500).json({
        error: 'Failed to delete note',
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    res.json({
      message: 'Note deleted successfully',
      deletedNote: data[0],
    });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const mergeNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { noteIds, title, date, deleteNotesAfterMerge } = req.body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        error: 'noteIds array with at least one id is required',
      });
    }

    const { data: notes, error: fetchError } = await supabase
      .from('journal_notes')
      .select('id, content, date, time')
      .eq('user_id', userId)
      .in('id', noteIds)
      .order('date', { ascending: true });

    if (fetchError) {
      console.error('Merge Notes Fetch Error:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch notes',
        details: fetchError.message,
      });
    }

    if (!notes || notes.length === 0) {
      return res.status(404).json({ error: 'No matching notes found' });
    }

    const mergedContent = notes
      .map((n) => {
        const d = n.date
          ? new Date(n.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '';
        const timePart = n.time && String(n.time).trim() ? `, ${String(n.time).trim()}` : '';
        return d ? `[${d}${timePart}]\n${n.content || ''}` : (n.content || '').trim();
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    const entryDate = date || notes[0]?.date || new Date().toISOString().split('T')[0];
    const entryTitle = title?.trim() || `Merged notes (${notes.length})`;

    const { data: entry, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        title: entryTitle,
        date: entryDate,
        content: mergedContent,
        mood: 'neutral',
        tags: [],
        time_in: null,
        time_out: null,
        break_time: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Merge Notes Insert Error:', insertError);
      return res.status(500).json({
        error: 'Failed to create journal entry',
        details: insertError.message,
      });
    }

    const io = (await import('../index.js')).io;
    if (io) io.to(userId).emit('journal-entry-added', entry);

    if (deleteNotesAfterMerge) {
      await supabase
        .from('journal_notes')
        .delete()
        .eq('user_id', userId)
        .in('id', noteIds);
    }

    res.status(201).json({
      entry,
      message: 'Notes merged into journal entry successfully',
    });
  } catch (error) {
    console.error('Merge Notes Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
