import { supabase } from '../config/supabase.js';

const BUCKET = 'journal-gallery';

function getStoragePathFromPublicUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().split('?')[0];
  const match = trimmed.match(new RegExp(`/${BUCKET}/(.+)$`));
  return match ? match[1] : null;
}

function parseLastModified(header) {
  if (!header) return null;
  const d = new Date(header);
  return isNaN(d.getTime()) ? null : d;
}

export const getGallery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entryId } = req.query;
    const ifModifiedSince = parseLastModified(req.get('if-modified-since'));

    if (ifModifiedSince) {
      let latestQuery = supabase
        .from('journal_gallery')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (entryId !== undefined && entryId !== '') {
        const id = parseInt(entryId, 10);
        if (!Number.isNaN(id)) {
          latestQuery = latestQuery.eq('journal_entry_id', id);
        }
      }

      const { data: latest, error: latestError } = await latestQuery.maybeSingle();

      if (!latestError && latest?.created_at) {
        const serverDate = new Date(latest.created_at).getTime();
        if (serverDate <= ifModifiedSince.getTime() + 1000) {
          return res.status(304).end();
        }
      }
    }

    let query = supabase
      .from('journal_gallery')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (entryId !== undefined && entryId !== '') {
      const id = parseInt(entryId, 10);
      if (!Number.isNaN(id)) {
        query = query.eq('journal_entry_id', id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get Gallery Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch gallery',
        details: error.message,
      });
    }

    const maxCreated = data?.length
      ? data.reduce((max, img) => (img.created_at > max ? img.created_at : max), data[0].created_at)
      : null;
    if (maxCreated) {
      res.setHeader('Last-Modified', new Date(maxCreated).toUTCString());
      res.setHeader('Cache-Control', 'private, max-age=0');
    }
    res.json({ images: data });
  } catch (error) {
    console.error('Get Gallery Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addGalleryImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { image_url, caption, journal_entry_id } = req.body;

    if (!image_url || typeof image_url !== 'string' || !image_url.trim()) {
      return res.status(400).json({
        error: 'image_url is required',
      });
    }

    const entryId = Number(journal_entry_id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({
        error: 'journal_entry_id is required and must be a positive integer',
      });
    }

    const { data, error } = await supabase
      .from('journal_gallery')
      .insert({
        user_id: userId,
        image_url: image_url.trim(),
        caption: caption.trim(),
        journal_entry_id: entryId,
      })
      .select()
      .single();

    if (error) {
      console.error('Add Gallery Image Error:', error);
      return res.status(500).json({
        error: 'Failed to add image',
        details: error.message,
      });
    }

    res.status(201).json({
      image: data,
      message: 'Image added successfully',
    });
  } catch (error) {
    console.error('Add Gallery Image Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('journal_gallery')
      .select('id, image_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      if (fetchError?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Image not found or unauthorized' });
      }
      console.error('Delete Gallery Image Fetch Error:', fetchError);
      return res.status(500).json({
        error: 'Failed to fetch image',
        details: fetchError?.message,
      });
    }

    const storagePath = getStoragePathFromPublicUrl(existing.image_url);
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);
      if (storageError) {
        console.error('Delete Gallery Image Storage Error:', storageError);
      }
    }

    const { data, error } = await supabase
      .from('journal_gallery')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Delete Gallery Image Error:', error);
      return res.status(500).json({
        error: 'Failed to delete image',
        details: error.message,
      });
    }

    res.json({
      message: 'Image deleted successfully',
      deletedImage: data[0],
    });
  } catch (error) {
    console.error('Delete Gallery Image Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
