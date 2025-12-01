import type { TimeSlot as ApiSlot, TimeSlot as ApiBooking, Settings as ApiSettings } from '../types';

/**
 * Generiert eine iCal (.ics) Datei für Kalender-Export
 */

function formatICalDate(dateStr: string, timeStr: string): string {
  // Parse date (YYYY-MM-DD) and time (HH:MM - HH:MM)
  const [startTime] = timeStr.split(' - ');
  const [hours, minutes] = startTime.split(':');
  
  // Create date object in local time
  const date = new Date(dateStr);
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Format as iCal date (YYYYMMDDTHHMMSS)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}T${hour}${minute}00`;
}

function getEndTime(dateStr: string, timeStr: string): string {
  // Parse end time from "HH:MM - HH:MM" format
  const [, endTime] = timeStr.split(' - ');
  const [hours, minutes] = endTime.split(':');
  
  const date = new Date(dateStr);
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}T${hour}${minute}00`;
}

function getCurrentTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Export einzelner gebuchter Slot als iCal für User
 */
export function exportSlotToICal(
  slot: ApiSlot,
  teacherName: string,
  settings?: ApiSettings
): void {
  const startDate = formatICalDate(slot.date, slot.time);
  const endDate = getEndTime(slot.date, slot.time);
  const timestamp = getCurrentTimestamp();
  const eventName = settings?.event_name || 'BKSB Elternsprechtag';
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BKSB Elternsprechtag//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:slot-${slot.id}@bksb-elternsprechtag.de`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${eventName} - ${teacherName}`,
    `DESCRIPTION:Elterngespräch mit ${teacherName}\\nSchüler/in: ${slot.studentName}\\nKlasse: ${slot.className}`,
    `LOCATION:BKSB`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Erinnerung: Elternsprechtag in 15 Minuten',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  downloadICalFile(icalContent, `Elternsprechtag-${teacherName}-${slot.time.replace(/[: ]/g, '')}.ics`);
}

/**
 * Export aller Buchungen für Admin als iCal
 */
export function exportBookingsToICal(
  bookings: ApiBooking[],
  settings?: ApiSettings
): void {
  const timestamp = getCurrentTimestamp();
  const eventName = settings?.event_name || 'BKSB Elternsprechtag';
  
  const events = bookings.map(booking => {
    const startDate = formatICalDate(booking.date, booking.time);
    const endDate = getEndTime(booking.date, booking.time);
    
    return [
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@bksb-elternsprechtag.de`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${booking.teacherName} - ${booking.parentName}`,
      `DESCRIPTION:Schüler/in: ${booking.studentName}\\nKlasse: ${booking.className}\\nEltern: ${booking.parentName}`,
      `LOCATION:BKSB`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BKSB Elternsprechtag//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${eventName} - Alle Buchungen`,
    `X-WR-CALDESC:Übersicht aller Termine für ${eventName}`,
    events,
    'END:VCALENDAR'
  ].join('\r\n');

  const dateStr = settings?.event_date ? new Date(settings.event_date).toISOString().split('T')[0] : 'termine';
  downloadICalFile(icalContent, `Elternsprechtag-Alle-Buchungen-${dateStr}.ics`);
}

/**
 * Export Slots einer Lehrkraft für Admin als iCal
 */
export function exportTeacherSlotsToICal(
  slots: ApiSlot[],
  teacherName: string,
  settings?: ApiSettings
): void {
  const timestamp = getCurrentTimestamp();
  const eventName = settings?.event_name || 'BKSB Elternsprechtag';
  const bookedSlots = slots.filter(s => s.booked);
  
  if (bookedSlots.length === 0) {
    alert('Keine gebuchten Termine für diese Lehrkraft vorhanden.');
    return;
  }
  
  const events = bookedSlots.map(slot => {
    const startDate = formatICalDate(slot.date, slot.time);
    const endDate = getEndTime(slot.date, slot.time);
    
    return [
      'BEGIN:VEVENT',
      `UID:teacher-slot-${slot.id}@bksb-elternsprechtag.de`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${eventName} - ${slot.parentName}`,
      `DESCRIPTION:Schüler/in: ${slot.studentName}\\nKlasse: ${slot.className}\\nEltern: ${slot.parentName}`,
      `LOCATION:BKSB`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BKSB Elternsprechtag//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${eventName} - ${teacherName}`,
    `X-WR-CALDESC:Termine für ${teacherName}`,
    events,
    'END:VCALENDAR'
  ].join('\r\n');

  downloadICalFile(icalContent, `Elternsprechtag-${teacherName}.ics`);
}

/**
 * Helper: Download iCal file
 */
function downloadICalFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
