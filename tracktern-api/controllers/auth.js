import { supabase } from '../config/supabase.js';

export const signUp = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if email already exists in profiles
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ 
        error: 'Database error',
        details: checkError.message 
      });
    }

    if (existingUser) {
      return res.status(400).json({
        error: 'This email is already registered. Please sign in instead or use Google login.'
      });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if user was actually created
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return res.status(400).json({
        error: 'This email is already registered. Please sign in instead or use Google login.'
      });
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName && fullName.trim() !== "" ? fullName.trim() : data.user.email
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    res.status(201).json({
      user: data.user,
      message: 'User created successfully. Please sign in.'
    });

  } catch (error) {
    console.error('SignUp Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  } catch (error) {
    console.error('SignIn Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signInWithGoogle = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ url: data.url });

  } catch (error) {
    console.error('Google SignIn Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createOrUpdateProfile = async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = req.user;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName && fullName.trim() !== "" ? fullName.trim() : user.email
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ profile: data });

  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkEmailProvider = async (req, res) => {
  try {
    const { email } = req.body;

    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to check email' });
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return res.json({ provider: 'none', exists: false });
    }

    const provider = user.app_metadata?.provider || 'email';
    
    res.json({ 
      provider,
      exists: true,
      confirmed: user.email_confirmed_at !== null
    });

  } catch (error) {
    console.error('Check Email Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ 
      refresh_token 
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      session: data.session,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });

  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const signOut = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await supabase.auth.admin.signOut(token);
    }

    res.json({ message: 'Signed out successfully' });

  } catch (error) {
    console.error('SignOut Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};