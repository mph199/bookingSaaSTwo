import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * Middleware: Require teacher role
 */
function requireTeacher(req, res, next) {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ 
    error: 'Forbidden', 
    message: 'Teacher access required' 
  });
}

/**
 * GET /api/teacher/bookings
 * Get all bookings for the logged-in teacher
 */
router.get('/bookings', requireAuth, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID not found in token' });
    }

    const { data, error } = await supabase
      .from('slots')
      .select(`
        *,
        teacher:teachers(name, subject)
      `)
      .eq('teacher_id', teacherId)
      .eq('booked', true)
      .order('date')
      .order('time');
    
    if (error) throw error;
    
    // Map to camelCase with teacher info
    const bookings = data.map(slot => ({
      id: slot.id,
      teacherId: slot.teacher_id,
      time: slot.time,
      date: slot.date,
      booked: slot.booked,
      status: slot.status,
      visitorType: slot.visitor_type,
      parentName: slot.parent_name,
      companyName: slot.company_name,
      studentName: slot.student_name,
      traineeName: slot.trainee_name,
      className: slot.class_name,
      email: slot.email,
      message: slot.message,
      teacherName: slot.teacher?.name || 'Unknown',
      teacherSubject: slot.teacher?.subject || 'Unknown'
    }));
  
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching teacher bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * GET /api/teacher/slots
 * Get all slots for the logged-in teacher
 */
router.get('/slots', requireAuth, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID not found in token' });
    }

    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('date')
      .order('time');
    
    if (error) throw error;
    
    // Map snake_case to camelCase
    const slots = data.map(slot => ({
      id: slot.id,
      teacherId: slot.teacher_id,
      time: slot.time,
      date: slot.date,
      booked: slot.booked,
      status: slot.status,
      visitorType: slot.visitor_type,
      parentName: slot.parent_name,
      companyName: slot.company_name,
      studentName: slot.student_name,
      traineeName: slot.trainee_name,
      className: slot.class_name,
      email: slot.email,
      message: slot.message
    }));
    
    res.json({ slots });
  } catch (error) {
    console.error('Error fetching teacher slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

/**
 * GET /api/teacher/info
 * Get info about the logged-in teacher
 */
router.get('/info', requireAuth, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID not found in token' });
    }

    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', teacherId)
      .single();
    
    if (error) throw error;
    
    res.json({ 
      teacher: {
        id: data.id,
        name: data.name,
        subject: data.subject,
        system: data.system,
        room: data.room
      }
    });
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    res.status(500).json({ error: 'Failed to fetch teacher info' });
  }
});

/**
 * DELETE /api/teacher/bookings/:slotId
 * Cancel a booking (teacher can cancel their own bookings)
 */
router.delete('/bookings/:slotId', requireAuth, requireTeacher, async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  
  if (isNaN(slotId)) {
    return res.status(400).json({ error: 'Invalid slotId' });
  }

  try {
    const teacherId = req.user.teacherId;
    
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID not found in token' });
    }

    // Clear booking data, but only for own slots
    const { data, error } = await supabase
      .from('slots')
      .update({
        booked: false,
        status: null,
        visitor_type: null,
        parent_name: null,
        company_name: null,
        student_name: null,
        trainee_name: null,
        class_name: null,
        email: null,
        message: null
      })
      .eq('id', slotId)
      .eq('teacher_id', teacherId) // Only allow canceling own bookings
      .eq('booked', true)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Slot not found, not booked, or not yours' });
      }
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

/**
 * PUT /api/teacher/bookings/:slotId/accept
 * Accept a reserved booking (set status to confirmed)
 */
router.put('/bookings/:slotId/accept', requireAuth, requireTeacher, async (req, res) => {
  const slotId = parseInt(req.params.slotId, 10);
  if (isNaN(slotId)) {
    return res.status(400).json({ error: 'Invalid slotId' });
  }

  try {
    const teacherId = req.user.teacherId;
    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID not found in token' });
    }

    const { data, error } = await supabase
      .from('slots')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', slotId)
      .eq('teacher_id', teacherId)
      .eq('booked', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Slot not found or not booked' });
      }
      throw error;
    }

    res.json({ success: true, slot: data });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: 'Failed to accept booking' });
  }
});

export default router;
