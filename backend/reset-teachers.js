import { supabase } from './config/supabase.js';

async function resetTeachers() {
  try {
    console.log('Starte Lehrkräfte-Reset...');

    // 1. Alle Slots löschen
    console.log('Lösche alle Slots...');
    const { error: slotsError } = await supabase
      .from('slots')
      .delete()
      .neq('id', 0); // Löscht alle Einträge

    if (slotsError) {
      console.error('Fehler beim Löschen der Slots:', slotsError);
      throw slotsError;
    }
    console.log('✓ Alle Slots gelöscht');

    // 2. Alle Lehrkräfte löschen
    console.log('Lösche alle Lehrkräfte...');
    const { error: teachersError } = await supabase
      .from('teachers')
      .delete()
      .neq('id', 0); // Löscht alle Einträge

    if (teachersError) {
      console.error('Fehler beim Löschen der Lehrkräfte:', teachersError);
      throw teachersError;
    }
    console.log('✓ Alle Lehrkräfte gelöscht');

    // 3. Sequenz zurücksetzen (funktioniert nur mit direktem SQL)
    console.log('Setze ID-Sequenzen zurück...');
    
    // Für PostgreSQL müssen wir die Sequenzen zurücksetzen
    const { error: seqErrorTeachers } = await supabase.rpc('reset_teacher_sequence');
    const { error: seqErrorSlots } = await supabase.rpc('reset_slot_sequence');

    // Falls die RPC-Funktionen nicht existieren, geben wir eine Warnung aus
    if (seqErrorTeachers || seqErrorSlots) {
      console.warn('⚠ Warnung: ID-Sequenzen konnten nicht automatisch zurückgesetzt werden.');
      console.warn('Führe folgende SQL-Befehle manuell in Supabase aus:');
      console.warn('ALTER SEQUENCE teachers_id_seq RESTART WITH 1;');
      console.warn('ALTER SEQUENCE slots_id_seq RESTART WITH 1;');
    } else {
      console.log('✓ ID-Sequenzen zurückgesetzt');
    }

    console.log('\n✅ Reset erfolgreich abgeschlossen!');
    console.log('Alle Lehrkräfte und Slots wurden gelöscht.');
    
  } catch (error) {
    console.error('❌ Fehler beim Reset:', error);
    process.exit(1);
  }
}

// Script ausführen
resetTeachers();
