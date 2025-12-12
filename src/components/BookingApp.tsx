import { useState, useMemo, useEffect } from 'react';
import { TeacherList } from './TeacherList';
import { SlotList } from './SlotList';
import { BookingForm } from './BookingForm';
import { useBooking } from '../hooks/useBooking';
import type { Teacher } from '../types';
import api from '../services/api';
import './BookingApp.css';

export const BookingApp = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState<boolean>(true);
  const [teachersError, setTeachersError] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  
  
  const {
    slots,
    selectedSlotId,
    message,
    bookingNoticeOpen,
    loading: slotsLoading,
    error: slotsError,
    handleSelectSlot,
    handleBooking,
    resetSelection,
  } = useBooking(selectedTeacherId);

  // Lade Lehrkräfte beim Mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const fetchedTeachers = await api.getTeachers();
        setTeachers(fetchedTeachers);
      } catch (err) {
        setTeachersError(err instanceof Error ? err.message : 'Fehler beim Laden der Lehrkräfte');
      } finally {
        setTeachersLoading(false);
      }
    };

    loadTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const searchLower = teacherSearch.trim().toLowerCase();
      const matchesSearch = searchLower
        ? t.name.toLowerCase().includes(searchLower)
        : true;
      return matchesSearch;
    });
  }, [teachers, teacherSearch]);

  const handleTeacherSelect = (teacherId: number) => {
    setSelectedTeacherId(teacherId);
    resetSelection();
  };

  return (
    <div className="booking-app">
      {bookingNoticeOpen && (
        <div className="booking-notice-overlay" role="dialog" aria-modal="true" aria-label="Hinweis zur E-Mail-Bestätigung">
          <div className="booking-notice">
            <h3>Fast fertig</h3>
            <p>
              Danke für Ihre Buchungsanfrage!
            </p>
            <p>
              <span className="booking-notice-important">Wichtig:</span>{' '}
              Die Lehrkraft kann den Termin erst bestätigen, nachdem Sie Ihre E-Mail-Adresse bestätigt haben.
              Bitte prüfen Sie Ihr Postfach (ggf. Spam) und klicken Sie auf den Bestätigungslink.
            </p>
            <button type="button" className="btn btn-primary" onClick={resetSelection}>
              Verstanden
            </button>
          </div>
        </div>
      )}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-content">
            <div className="header-text">
              <div className="brand">
                <h1 className="brand-title">BKSB Navi</h1>
                <span className="subpage-badge">Elternsprechtag</span>
              </div>
              <p className="header-date">Mittwoch, 15. Januar 2025 | 16:00 - 18:00 Uhr</p>
              <p>
                Willkommen im Buchungssystem des BKSB für Termine am Eltern- und
                Ausbildersprechtag.
              </p>
            </div>
            <a href="/login" className="admin-button">
              Login
            </a>
          </div>
        </div>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <form
            className="teacher-search"
            aria-label="Lehrkraft suchen"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="teacher-search-group">
              <label htmlFor="teacherSearch">Lehrkraft</label>
              <input
                id="teacherSearch"
                type="text"
                placeholder="Name suchen..."
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  setSelectedTeacherId(null);
                }}
                aria-label="Lehrkraft nach Namen filtern"
                disabled={teachersLoading}
              />
              {teacherSearch && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small clear-btn"
                  onClick={() => {
                    setTeacherSearch('');
                    setSelectedTeacherId(null);
                  }}
                  aria-label="Suche zurücksetzen"
                >
                  Löschen
                </button>
              )}
            </div>
          </form>
          {teachersLoading && <p className="loading-message">Lade Lehrkräfte...</p>}
          {teachersError && <p className="error-message">{teachersError}</p>}
          {!teachersLoading && !teachersError && (
            <TeacherList
              teachers={filteredTeachers}
              selectedTeacherId={selectedTeacherId}
              onSelectTeacher={handleTeacherSelect}
            />
          )}
        </aside>

        <main className="main-content">
          {slotsLoading && <p className="loading-message">Lade Termine...</p>}
          {slotsError && <p className="error-message">{slotsError}</p>}
          {!slotsLoading && !slotsError && (
            <SlotList
              slots={slots}
              selectedSlotId={selectedSlotId}
              onSelectSlot={handleSelectSlot}
            />
          )}

          <BookingForm
            selectedSlotId={selectedSlotId}
            onSubmit={handleBooking}
            onCancel={resetSelection}
            message={message}
          />
        </main>
      </div>
    </div>
  );
};
// Force rebuild
