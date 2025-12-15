import type { Teacher } from '../types';

export function teacherDisplayName(teacher: Teacher): string {
  const rawName = String(teacher?.name || '').trim();
  if (!rawName) return '';
  const salutationRaw = teacher?.salutation ? String(teacher.salutation).trim() : '';
  const salutationLower = salutationRaw.toLowerCase();
  const salutation = salutationRaw
    ? salutationLower === 'herr'
      ? 'Herr'
      : salutationLower === 'frau'
        ? 'Frau'
        : salutationLower === 'divers'
          ? 'Divers'
          : salutationRaw
    : '';

  return salutation ? `${salutation} ${rawName}` : rawName;
}

export function teacherDisplayNameAccusative(teacher: Teacher): string {
  const rawName = String(teacher?.name || '').trim();
  if (!rawName) return '';
  const salutationRaw = teacher?.salutation ? String(teacher.salutation).trim() : '';
  const salutationLower = salutationRaw.toLowerCase();

  if (!salutationRaw) return rawName;
  if (salutationLower === 'herr') return `Herrn ${rawName}`;
  if (salutationLower === 'frau') return `Frau ${rawName}`;
  if (salutationLower === 'divers') return `Divers ${rawName}`;
  return `${salutationRaw} ${rawName}`;
}
