export interface Teacher {
  id: number;
  name: string;
  subject: string;
  room?: string;
}

export interface TimeSlot {
  id: number;
  teacherId: number;
  time: string;
  date: string;
  booked: boolean;
  status?: 'reserved' | 'confirmed';
  visitorType?: 'parent' | 'company';
  parentName?: string;
  companyName?: string;
  studentName?: string;
  traineeName?: string;
  representativeName?: string;
  className?: string;
  email?: string;
  message?: string;
}

export interface BookingFormData {
  visitorType: 'parent' | 'company';
  parentName?: string;
  companyName?: string;
  studentName?: string;
  traineeName?: string;
  representativeName?: string;
  className: string;
  email: string;
  message?: string;
}

export interface Settings {
  id?: number;
  event_name: string;
  event_date: string;
}
