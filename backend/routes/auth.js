import express from 'express';
import { verifyCredentials, ADMIN_USER } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Sets session on success
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Bad Request', 
      message: 'Username and password required' 
    });
  }

  try {
    // First verify credentials against hardcoded admin
    const isValidAdmin = await verifyCredentials(username, password);
    
    if (isValidAdmin) {
      // Set session for admin user
      req.session.isAuthenticated = true;
      req.session.user = { username: ADMIN_USER.username, role: 'admin' };

      console.log('Admin login successful, session:', req.session);

      // Save session explicitly
      return req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Failed to save session' 
          });
        }
        
        return res.json({ 
          success: true, 
          message: 'Login successful',
          user: { username: ADMIN_USER.username, role: 'admin' }
        });
      });
    }

    // Check if users table exists and query it
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (error) {
      // Users table doesn't exist yet and not admin
      console.warn('Users table not found and credentials invalid');
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid credentials' 
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];
    
    // Verify password for database user
    // TODO: Implement proper password verification for DB users
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Database user authentication not yet implemented' 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Login failed' 
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroys session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'Logout failed' 
      });
    }
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

/**
 * GET /api/auth/verify
 * Checks if session is authenticated
 */
router.get('/verify', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    return res.json({ 
      authenticated: true, 
      user: req.session.user || { username: ADMIN_USER.username }
    });
  }
  res.json({ 
    authenticated: false 
  });
});

export default router;
