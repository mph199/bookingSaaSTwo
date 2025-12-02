import type { TimeSlot as ApiSlot, TimeSlot as ApiBooking, Settings as ApiSettings } from '../types';

/**
 * Generiert eine iCal (.ics) Datei für Kalender-Export
 */

function formatICalDateLocal(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) throw new Error('Invalid date/time for ICS');
  const parts = timeStr.split(' - ');
  if (!parts[0]) throw new Error('Invalid start time for ICS');
  const [hoursStr, minutesStr] = parts[0].split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) throw new Error('NaN time values');

  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date value');
  date.setHours(hours, minutes, 0, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function getEndTimeLocal(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) throw new Error('Invalid date/time for ICS');
  const parts = timeStr.split(' - ');
  if (!parts[1]) throw new Error('Invalid end time for ICS');
  const [hoursStr, minutesStr] = parts[1].split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) throw new Error('NaN time values');

  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date value');
  date.setHours(hours, minutes, 0, 0);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function getCurrentTimestamp(): string {
  // DTSTAMP should be UTC
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

/**
 * Export einzelner gebuchter Slot als iCal für User
 */
export function exportSlotToICal(
  slot: ApiSlot,
  teacherName: string,
  settings?: ApiSettings
): void {
  const startDate = formatICalDateLocal(slot.date, slot.time);
  const endDate = getEndTimeLocal(slot.date, slot.time);
  const timestamp = getCurrentTimestamp();
  const eventName = settings?.event_name || 'BKSB Elternsprechtag';
  
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BKSB Elternsprechtag//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'X-LIC-LOCATION:Europe/Berlin',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:slot-${slot.id}@bksb-elternsprechtag.de`,
    `DTSTAMP:${timestamp}`,
    `DTSTART;TZID=Europe/Berlin:${startDate}`,
    `DTEND;TZID=Europe/Berlin:${endDate}`,
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
    'END:VCALENDAR',
    ''
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
    const startDate = formatICalDateLocal(booking.date, booking.time);
    const endDate = getEndTimeLocal(booking.date, booking.time);
    
    return [
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@bksb-elternsprechtag.de`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;TZID=Europe/Berlin:${startDate}`,
      `DTEND;TZID=Europe/Berlin:${endDate}`,
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
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'X-LIC-LOCATION:Europe/Berlin',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    `X-WR-CALNAME:${eventName} - Alle Buchungen`,
    `X-WR-CALDESC:Übersicht aller Termine für ${eventName}`,
    events,
    'END:VCALENDAR',
    ''
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
    const startDate = formatICalDateLocal(slot.date, slot.time);
    const endDate = getEndTimeLocal(slot.date, slot.time);
    
    return [
      'BEGIN:VEVENT',
      `UID:teacher-slot-${slot.id}@bksb-elternsprechtag.de`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;TZID=Europe/Berlin:${startDate}`,
      `DTEND;TZID=Europe/Berlin:${endDate}`,
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
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'X-LIC-LOCATION:Europe/Berlin',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
    `X-WR-CALNAME:${eventName} - ${teacherName}`,
    `X-WR-CALDESC:Termine für ${teacherName}`,
    events,
    'END:VCALENDAR',
    ''
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
