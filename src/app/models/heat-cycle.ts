/** Heat cycles, breeder reminders and the breeder calendar. Dates are 'YYYY-MM-DD' calendar dates. */

export interface IHeatCycle {
  id: string;
  pet_id: string;
  pet_name: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  in_progress: boolean;
  created_at: string;
  updated_at: string;
}

/** Create or full-replace body. No end date = in progress. */
export interface IHeatCycleWrite {
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

export interface IReminder {
  id: string;
  pet_id: string;
  pet_name: string;
  remind_on: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface IReminderWrite {
  remind_on: string;
  note: string | null;
}

export type CalendarEventType = 'heat_start' | 'heat_end' | 'reminder';

export interface ICalendarPet {
  id: string;
  name: string;
  gender: string | null;
}

export interface ICalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  pet_id: string;
  pet_name: string;
  cycle_id: string | null;
  reminder_id: string | null;
  in_progress: boolean;
  note: string | null;
}

/**
 * A cycle overlapping the requested range, including one that started before it
 * and is still going (so it has no start/end event in range).
 */
export interface ICalendarHeatSpan {
  cycle_id: string;
  pet_id: string;
  pet_name: string;
  start_date: string;
  end_date: string | null;
  in_progress: boolean;
}

export interface ICalendar {
  start: string;
  end: string;
  pets: ICalendarPet[];
  events: ICalendarEvent[];
  /** Older backends omit it. */
  in_heat?: ICalendarHeatSpan[];
}

/** A dog option for the event form's select. */
export interface IEventFormPet {
  id: string;
  name: string;
  gender?: string | null;
}

export const CALENDAR_EVENT_LABELS: Record<CalendarEventType, string> = {
  heat_start: 'Heat start',
  heat_end: 'Heat end',
  reminder: 'Reminder',
};

export function isFemale(pet: { gender?: string | null }): boolean {
  return (pet.gender || '').toLowerCase() === 'female';
}
