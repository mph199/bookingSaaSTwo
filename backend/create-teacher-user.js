import bcrypt from 'bcryptjs';
import { supabase } from './config/supabase.js';

async function createTeacherUser() {
  // Hash password: teacher123
  const password = 'teacher123';
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Get first teacher from database
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .limit(1);
  
  if (!teachers || teachers.length === 0) {
    console.log('Keine Lehrer in der Datenbank gefunden. Bitte erst einen Lehrer anlegen.');
    return;
  }
  
  const teacherId = teachers[0].id;
  const teacherName = teachers[0].name;
  
  // Create teacher user
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: 'lehrer',
      password_hash: passwordHash,
      role: 'teacher',
      teacher_id: teacherId
    })
    .select();
  
  if (error) {
    if (error.code === '23505') { // Unique violation
      console.log('User "lehrer" existiert bereits');
    } else {
      console.error('Fehler:', error);
    }
    return;
  }
  
  console.log(`✓ Teacher-User erstellt:`);
  console.log(`  Username: lehrer`);
  console.log(`  Password: teacher123`);
  console.log(`  Verknüpft mit: ${teacherName} (ID: ${teacherId})`);
}

createTeacherUser().then(() => process.exit(0));
