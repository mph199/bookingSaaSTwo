import { useEffect, useMemo, useRef, useState } from 'react';
import type { Teacher } from '../types';
import { teacherDisplayName } from '../utils/teacherDisplayName';

type Props = {
  teachers: Teacher[];
  selectedTeacherId: number | null;
  disabled?: boolean;
  onSelectTeacher: (teacherId: number) => void;
  onClearSelection: () => void;
};

export function TeacherCombobox({
  teachers,
  selectedTeacherId,
  disabled,
  onSelectTeacher,
  onClearSelection,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const selectedTeacher = useMemo(() => {
    return selectedTeacherId ? teachers.find((t) => t.id === selectedTeacherId) ?? null : null;
  }, [teachers, selectedTeacherId]);

  const listboxId = 'teacher-combobox-listbox';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const a = (t.name || '').toLowerCase();
      const b = teacherDisplayName(t).toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [teachers, query]);

  const activeOptionId = useMemo(() => {
    if (!open) return undefined;
    if (activeIndex < 0 || activeIndex >= filtered.length) return undefined;
    return `teacher-combobox-option-${filtered[activeIndex].id}`;
  }, [open, activeIndex, filtered]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const commitSelection = (teacherId: number) => {
    onSelectTeacher(teacherId);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    // Keep focus in input for fast subsequent use
    inputRef.current?.focus();
  };

  return (
    <div className="teacher-combobox" ref={wrapperRef}>
      <label htmlFor="teacherComboboxInput" className="teacher-combobox-label">
        Lehrkraft
      </label>

      <div className="teacher-combobox-inputRow">
        <input
          id="teacherComboboxInput"
          ref={inputRef}
          className="teacher-combobox-input"
          type="text"
          placeholder="Lehrkraft suchen…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
            if (selectedTeacherId !== null) {
              onClearSelection();
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (disabled) return;

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) setOpen(true);
              setActiveIndex((prev) => {
                const next = prev + 1;
                return next >= filtered.length ? (filtered.length ? 0 : -1) : next;
              });
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (!open) setOpen(true);
              setActiveIndex((prev) => {
                const next = prev - 1;
                return next < 0 ? (filtered.length ? filtered.length - 1 : -1) : next;
              });
            } else if (e.key === 'Enter') {
              if (!open) return;
              e.preventDefault();
              if (activeIndex >= 0 && activeIndex < filtered.length) {
                commitSelection(filtered[activeIndex].id);
              }
            } else if (e.key === 'Escape') {
              if (open) {
                e.preventDefault();
                setOpen(false);
                setActiveIndex(-1);
              }
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-label="Lehrkraft auswählen"
          disabled={disabled}
        />

        {(query || selectedTeacherId !== null) && (
          <button
            type="button"
            className="btn btn-secondary btn-small teacher-combobox-clear"
            onClick={() => {
              setQuery('');
              setOpen(false);
              setActiveIndex(-1);
              if (selectedTeacherId !== null) {
                onClearSelection();
              }
              inputRef.current?.focus();
            }}
            aria-label="Auswahl und Suche löschen"
            disabled={disabled}
          >
            Löschen
          </button>
        )}
      </div>

      {selectedTeacher && (
        <div className="teacher-combobox-selected" aria-live="polite">
          <span className="teacher-combobox-selectedLabel">Ausgewählt:</span>
          <span className="teacher-combobox-selectedValue">{teacherDisplayName(selectedTeacher)}</span>

          {selectedTeacher.room && (
            <>
              <span className="teacher-combobox-selectedSpacer" aria-hidden="true" />
              <span className="teacher-combobox-selectedMeta" aria-label={`Raum ${selectedTeacher.room}`}>
                <span className="teacher-combobox-pin" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                    <path d="M12 22s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11zm0-8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                </span>
                <span className="teacher-combobox-room">{selectedTeacher.room}</span>
              </span>
            </>
          )}
        </div>
      )}

      {open && !disabled && (
        <div className="teacher-combobox-popover">
          <ul id={listboxId} role="listbox" className="teacher-combobox-list">
            {filtered.length === 0 ? (
              <li className="teacher-combobox-empty" aria-live="polite">
                Keine Treffer
              </li>
            ) : (
              filtered.map((t, idx) => (
                <li
                  key={t.id}
                  id={`teacher-combobox-option-${t.id}`}
                  role="option"
                  aria-selected={selectedTeacherId === t.id}
                  className={`teacher-combobox-option${idx === activeIndex ? ' active' : ''}${selectedTeacherId === t.id ? ' selected' : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    // Prevent input blur before click
                    e.preventDefault();
                  }}
                  onClick={() => commitSelection(t.id)}
                >
                  {teacherDisplayName(t)}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
