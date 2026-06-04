import { supabase } from '../config/supabase.js';
import { io } from "../index.js"; 

const DEFAULT_CHECKLIST_ITEMS = [
  'Contract signed',
  'Documents submitted',
  'Equipment and access ready',
  'Supervisor added',
  'First day prepared',
];

function cleanString(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function cleanDate(value) {
  const text = cleanString(value);
  if (!text) return null;
  return text.slice(0, 10);
}

function cleanPriority(value) {
  const priority = cleanString(value)?.toLowerCase();
  return ['low', 'normal', 'high'].includes(priority) ? priority : 'normal';
}

function buildApplicationFields(body, { includeRequired = false } = {}) {
  const fields = {};

  if (includeRequired || body.companyName !== undefined) {
    fields.company_name = cleanString(body.companyName);
  }
  if (includeRequired || body.companyAddress !== undefined) {
    fields.company_address = cleanString(body.companyAddress);
  }
  if (body.position !== undefined || includeRequired) {
    fields.position = cleanString(body.position);
  }
  if (body.stipend !== undefined || includeRequired) {
    fields.stipend =
      body.stipend === 'paid' || body.stipend === 'unpaid' ? body.stipend : null;
  }
  if (body.applicationUrl !== undefined) fields.application_url = cleanString(body.applicationUrl);
  if (body.contactName !== undefined) fields.contact_name = cleanString(body.contactName);
  if (body.contactEmail !== undefined) fields.contact_email = cleanString(body.contactEmail);
  if (body.deadlineDate !== undefined) fields.deadline_date = cleanDate(body.deadlineDate);
  if (body.interviewDate !== undefined) fields.interview_date = cleanDate(body.interviewDate);
  if (body.followUpDate !== undefined) fields.follow_up_date = cleanDate(body.followUpDate);
  if (body.priority !== undefined || includeRequired) fields.priority = cleanPriority(body.priority);
  if (body.startDate !== undefined) fields.start_date = cleanDate(body.startDate);
  if (body.endDate !== undefined) fields.end_date = cleanDate(body.endDate);
  if (body.supervisorName !== undefined) fields.supervisor_name = cleanString(body.supervisorName);
  if (body.supervisorEmail !== undefined) fields.supervisor_email = cleanString(body.supervisorEmail);
  if (body.department !== undefined) fields.department = cleanString(body.department);

  return fields;
}

async function getOwnedApplication(userId, applicationId, columns = 'id, status') {
  const id = Number(applicationId);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { status: 400, body: { error: 'Invalid application ID' } } };
  }

  const { data, error } = await supabase
    .from('applications')
    .select(columns)
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return {
      error: {
        status: 500,
        body: { error: 'Failed to validate application', details: error.message },
      },
    };
  }

  if (!data) {
    return {
      error: {
        status: 404,
        body: { error: 'Application not found or unauthorized' },
      },
    };
  }

  return { application: data };
}

async function ensureDefaultChecklist(userId, applicationId, application) {
  if (application?.checklist_seeded_at) return;

  const { count, error: countError } = await supabase
    .from('application_checklist_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('application_id', applicationId);

  if (countError) return;

  if (count !== 0) {
    await supabase
      .from('applications')
      .update({ checklist_seeded_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('user_id', userId);
    return;
  }

  const rows = DEFAULT_CHECKLIST_ITEMS.map((label, index) => ({
    user_id: userId,
    application_id: applicationId,
    label,
    sort_order: index,
  }));

  const { error } = await supabase
    .from('application_checklist_items')
    .insert(rows);

  if (error) {
    console.error('Default checklist insert error:', error.message);
    return;
  }

  await supabase
    .from('applications')
    .update({ checklist_seeded_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('user_id', userId);
}

export const addApplication = async (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user.id;

    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Database error',
        details: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const insertData = {
      user_id: userId,
      date_applied: body.dateApplied || new Date().toISOString(),
      status: body.status || 'applied',
      ...buildApplicationFields(body, { includeRequired: true }),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[applications] POST body received:', JSON.stringify({ companyName: body.companyName, companyAddress: body.companyAddress, position: body.position, stipend: body.stipend, priority: body.priority }));
      console.log('[applications] Insert payload to DB:', JSON.stringify(insertData));
    }

    // Create application
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .insert(insertData)
      .select()
      .single();

    if (appError) {
      console.error('Application insert error:', appError.message);
      return res.status(500).json({
        error: 'Failed to create application',
        details: appError.message
      });
    }

    io.to(userId).emit("application-added", appData);

    res.status(201).json({
      application: appData,
      message: 'Application created successfully'
    });

  } catch (error) {
    console.error('Add Application Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    let query = supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get Applications Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch applications',
        details: error.message
      });
    }

    res.json({
      applications: data,
      count: data.length
    });

  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found' });
      }
      console.error('Get Application Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch application',
        details: error.message
      });
    }

    res.json({ application: data });

  } catch (error) {
    console.error('Get Application Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const id = req.params.id;
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }
    const userId = req.user.id;
    const body = req.body || {};

    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Database error',
        details: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
      ...buildApplicationFields(body),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[applications] PUT body received:', JSON.stringify({ companyName: body.companyName, companyAddress: body.companyAddress, position: body.position, stipend: body.stipend, priority: body.priority }));
      console.log('[applications] Update payload to DB:', JSON.stringify(updateData));
    }

    const { data: appData, error: appError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', idNum)
      .eq('user_id', userId)
      .select()
      .single();

    if (appError) {
      if (appError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found or unauthorized' });
      }
      console.error('Application update error:', appError.message, appError.details);
      return res.status(500).json({
        error: 'Failed to update application',
        details: appError.message
      });
    }

    io.to(userId).emit("application-updated", appData);

    res.json({
      application: appData,
      message: 'Application updated successfully'
    });

  } catch (error) {
    console.error('Update Application Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const normalizedStatus = status?.toLowerCase().trim();

    const validStatuses = ['applied', 'interviewing', 'offer', 'rejected', 'accepted', 'withdrawn'];
    
    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
        received: status,
        validStatuses
      });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Database error',
        details: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update status with normalized value
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (appError) {
      if (appError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Application not found or unauthorized' });
      }
      console.error('Application status update error:', appError.message);
      return res.status(500).json({
        error: 'Failed to update application status',
        details: appError.message
      });
    }

    io.to(userId).emit("application-status-updated", appData);

    res.json({
      application: appData,
      message: 'Application status updated successfully'
    });

  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Deleting application:', {
      userId,
      applicationId: id,
      typeOfId: typeof id
    });

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({
        error: 'Database error',
        details: checkError.message
      });
    }

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete application
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (appError) {
      console.error('Application delete error:', appError.message);
      return res.status(500).json({
        error: 'Failed to delete application',
        details: appError.message
      });
    }

    if (!appData || appData.length === 0) {
      return res.status(404).json({
        error: 'Application not found or unauthorized'
      });
    }

   io.to(userId).emit("application-deleted", appData[0].id);

    res.json({
      message: 'Application deleted successfully',
      deletedApplication: appData[0]
    });

  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getApplicationChecklist = async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = Number(req.params.id);
    const ownership = await getOwnedApplication(
      userId,
      applicationId,
      'id, status, checklist_seeded_at',
    );
    if (ownership.error) {
      return res.status(ownership.error.status).json(ownership.error.body);
    }

    await ensureDefaultChecklist(userId, applicationId, ownership.application);

    const { data, error } = await supabase
      .from('application_checklist_items')
      .select('*')
      .eq('user_id', userId)
      .eq('application_id', applicationId)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch checklist',
        details: error.message,
      });
    }

    res.json({ items: data ?? [] });
  } catch (error) {
    console.error('Get Application Checklist Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addChecklistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = Number(req.params.id);
    const ownership = await getOwnedApplication(userId, applicationId);
    if (ownership.error) {
      return res.status(ownership.error.status).json(ownership.error.body);
    }

    const { count } = await supabase
      .from('application_checklist_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('application_id', applicationId);

    const { data, error } = await supabase
      .from('application_checklist_items')
      .insert({
        user_id: userId,
        application_id: applicationId,
        label: cleanString(req.body.label),
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        error: 'Failed to add checklist item',
        details: error.message,
      });
    }

    res.status(201).json({ item: data });
  } catch (error) {
    console.error('Add Checklist Item Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateChecklistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const ownership = await getOwnedApplication(userId, applicationId);
    if (ownership.error) {
      return res.status(ownership.error.status).json(ownership.error.body);
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (req.body.label !== undefined) updateData.label = cleanString(req.body.label);
    if (req.body.completed !== undefined) updateData.completed = Boolean(req.body.completed);
    if (req.body.sortOrder !== undefined) updateData.sort_order = Number(req.body.sortOrder);

    const { data, error } = await supabase
      .from('application_checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('application_id', applicationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Checklist item not found' });
      }
      return res.status(500).json({
        error: 'Failed to update checklist item',
        details: error.message,
      });
    }

    res.json({ item: data });
  } catch (error) {
    console.error('Update Checklist Item Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteChecklistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const applicationId = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const ownership = await getOwnedApplication(userId, applicationId);
    if (ownership.error) {
      return res.status(ownership.error.status).json(ownership.error.body);
    }

    const { data, error } = await supabase
      .from('application_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('application_id', applicationId)
      .eq('user_id', userId)
      .select();

    if (error) {
      return res.status(500).json({
        error: 'Failed to delete checklist item',
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    res.json({ item: data[0], message: 'Checklist item deleted' });
  } catch (error) {
    console.error('Delete Checklist Item Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
