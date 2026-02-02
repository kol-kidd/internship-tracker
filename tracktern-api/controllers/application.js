import { supabase } from '../config/supabase.js';
import { io } from "../index.js"; 

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
      company_name: body.companyName,
      company_address: body.companyAddress,
      status: body.status || 'applied',
      position: (body.position != null && body.position !== '') ? String(body.position).trim() : null,
      stipend: (body.stipend === 'paid' || body.stipend === 'unpaid') ? body.stipend : null
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[applications] POST body received:', JSON.stringify({ companyName: body.companyName, companyAddress: body.companyAddress, position: body.position, stipend: body.stipend }));
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
      company_name: body.companyName,
      company_address: body.companyAddress,
      position: (body.position != null && body.position !== '') ? String(body.position).trim() : null,
      stipend: (body.stipend === 'paid' || body.stipend === 'unpaid') ? body.stipend : null
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[applications] PUT body received:', JSON.stringify({ companyName: body.companyName, companyAddress: body.companyAddress, position: body.position, stipend: body.stipend }));
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

   io.to(userId).emit("application-deleted", appData);

    res.json({
      message: 'Application deleted successfully',
      deletedApplication: appData[0]
    });

  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};