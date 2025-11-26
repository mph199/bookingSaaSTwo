import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BookingFormData } from '../types';
import { exportSlotToICal } from '../utils/icalExport';
import type { ApiSlot } from '../services/api';

interface BookingFormProps {
  selectedSlotId: number | null;
  onSubmit: (formData: BookingFormData) => void;
  onCancel: () => void;
  message: string;
  bookedSlot?: ApiSlot;
  teacherName?: string;
}

export const BookingForm = ({
  selectedSlotId,
  onSubmit,
  onCancel,
  message,
  bookedSlot,
  teacherName,
}: BookingFormProps) => {
  const [formData, setFormData] = useState<BookingFormData>({
    parentName: '',
    studentName: '',
    className: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.parentName || !formData.studentName || !formData.className) {
      return;
    }

    onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      parentName: '',
      studentName: '',
      className: '',
    });
  };

  const handleCancel = () => {
    setFormData({
      parentName: '',
      studentName: '',
      className: '',
    });
    onCancel();
  };

  if (!selectedSlotId) {
    return null;
  }

  return (
    <div className="booking-form-container" role="region" aria-label="Buchungsformular">
      <h2>Termin buchen</h2>
      <form onSubmit={handleSubmit} className="booking-form" aria-label="Termin buchen">
        <div className="form-group">
          <label htmlFor="parentName">Name der Eltern</label>
          <input
            type="text"
            id="parentName"
            value={formData.parentName}
            onChange={(e) =>
              setFormData({ ...formData, parentName: e.target.value })
            }
            placeholder="z.B. Familie Müller"
            autoComplete="name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentName">Name des Kindes</label>
          <input
            type="text"
            id="studentName"
            value={formData.studentName}
            onChange={(e) =>
              setFormData({ ...formData, studentName: e.target.value })
            }
            placeholder="z.B. Max Müller"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="className">Klasse</label>
          <input
            type="text"
            id="className"
            value={formData.className}
            onChange={(e) =>
              setFormData({ ...formData, className: e.target.value })
            }
            placeholder="z.B. 5a"
            autoComplete="off"
            inputMode="text"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Termin buchen
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Abbrechen
          </button>
        </div>
      </form>

      {message && (
        <div 
          className={`message ${message.includes('erfolgreich') ? 'success' : 'error'}`}
          role="alert"
          aria-live="polite"
        >
          {message}
          {message.includes('erfolgreich') && bookedSlot && teacherName && (
            <button
              type="button"
              onClick={() => exportSlotToICal(bookedSlot, teacherName)}
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
            >
              📅 Zum Kalender hinzufügen
            </button>
          )}
        </div>
      )}
    </div>
  );
};
