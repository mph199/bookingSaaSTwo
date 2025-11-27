import express from 'express';
import { verifyCredentials, ADMIN_USER, generateToken, verifyToken } from '../middleware/auth.js';
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
      const user = { username: ADMIN_USER.username, role: 'admin' };
      const token = generateToken(user);

      console.log('Admin login successful');

      return res.json({ 
        success: true, 
        message: 'Login successful',
        token,
        user
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
 * Token wird clientseitig gelöscht
 */
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

/**
 * GET /api/auth/verify
 * Checks if token is valid
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.json({ authenticated: false });
  }
  
  res.json({ 
    authenticated: true, 
    user: { username: decoded.username, role: decoded.role }
  });
});

export default router;
