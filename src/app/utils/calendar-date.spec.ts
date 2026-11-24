import {
  addDays,
  buildMonthGrid,
  daysBetween,
  formatCalendarDate,
  formatCalendarMonthKey,
  formatCalendarMonthLabel,
  formatCalendarRange,
  parseCalendarDate,
  parseCalendarMonth,
  shiftMonth,
  toCalendarDate,
  todayCalendarDate,
  weekdayLabels,
} from './calendar-date';

describe('calendar-date', () => {
  describe('parseCalendarDate / toCalendarDate', () => {
    it('parses to local midnight on the same calendar day (no UTC shift)', () => {
      const d = parseCalendarDate('2026-03-03')!;
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(3);
      expect(d.getHours()).toBe(0);
    });

    it('round-trips every day of a year, including DST changes', () => {
      for (let i = 0; i < 366; i++) {
        const iso = toCalendarDate(new Date(2026, 0, 1 + i));
        expect(toCalendarDate(parseCalendarDate(iso)!)).toBe(iso);
      }
    });

    it('rejects invalid strings and rollovers', () => {
      expect(parseCalendarDate('')).toBeNull();
      expect(parseCalendarDate(null)).toBeNull();
      expect(parseCalendarDate('2026-3-3')).toBeNull();
      expect(parseCalendarDate('2026-02-30')).toBeNull();
      expect(parseCalendarDate('2026-03-03T00:00:00Z')).toBeNull();
    });

    it('uses the local calendar day for today, late at night', () => {
      expect(todayCalendarDate(new Date(2026, 10, 24, 23, 59))).toBe('2026-11-24');
      expect(todayCalendarDate(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
    });
  });

  describe('formatting', () => {
    it('formats the calendar day as given', () => {
      expect(formatCalendarDate('2026-03-03')).toBe('Mar 3, 2026');
      expect(formatCalendarDate('2026-03-03', false)).toBe('Mar 3');
      expect(formatCalendarDate('2026-01-01')).toBe('Jan 1, 2026');
      expect(formatCalendarDate(null)).toBe('—');
    });

    it('formats ranges', () => {
      expect(formatCalendarRange('2026-03-03', '2026-03-21')).toBe('Mar 3 – Mar 21, 2026');
      expect(formatCalendarRange('2025-12-28', '2026-01-09')).toBe('Dec 28, 2025 – Jan 9, 2026');
      expect(formatCalendarRange('2026-03-03', null)).toBe('Mar 3, 2026 – In progress');
    });
  });

  describe('arithmetic', () => {
    it('adds days across month, year and DST boundaries', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
      expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    });

    it('counts days between dates', () => {
      expect(daysBetween('2026-03-03', '2026-03-21')).toBe(18);
      expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
      expect(daysBetween('2026-11-01', '2026-11-01')).toBe(0);
    });
  });

  describe('months', () => {
    it('parses and formats month keys', () => {
      expect(parseCalendarMonth('2026-03')).toEqual({ year: 2026, month: 3 });
      expect(parseCalendarMonth('2026-13')).toBeNull();
      expect(parseCalendarMonth('nope')).toBeNull();
      expect(formatCalendarMonthKey({ year: 2026, month: 3 })).toBe('2026-03');
      expect(formatCalendarMonthLabel({ year: 2026, month: 3 })).toBe('March 2026');
    });

    it('shifts months across years', () => {
      expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
      expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    });
  });

  describe('buildMonthGrid', () => {
    it('builds a Sunday-start grid of whole weeks', () => {
      // November 2026: the 1st is a Sunday, 30 days → 5 weeks.
      const grid = buildMonthGrid({ year: 2026, month: 11 });
      expect(grid.length).toBe(35);
      expect(grid[0]).toEqual({ date: '2026-11-01', day: 1, inMonth: true });
      expect(grid[29].date).toBe('2026-11-30');
      expect(grid[30]).toEqual({ date: '2026-12-01', day: 1, inMonth: false });
    });

    it('includes leading days of the previous month', () => {
      // March 2026: the 1st is a Sunday too; April 2026 starts on a Wednesday.
      const grid = buildMonthGrid({ year: 2026, month: 4 });
      expect(grid[0]).toEqual({ date: '2026-03-29', day: 29, inMonth: false });
      expect(grid[3]).toEqual({ date: '2026-04-01', day: 1, inMonth: true });
      expect(grid.length % 7).toBe(0);
      expect(grid.filter(d => d.inMonth).length).toBe(30);
    });

    it('never exceeds 42 days and has consecutive dates', () => {
      for (let month = 1; month <= 12; month++) {
        const grid = buildMonthGrid({ year: 2026, month });
        expect(grid.length).toBeLessThanOrEqual(42);
        expect(parseCalendarDate(grid[0].date)!.getDay()).toBe(0);
        for (let i = 1; i < grid.length; i++) {
          expect(daysBetween(grid[i - 1].date, grid[i].date)).toBe(1);
        }
      }
    });

    it('supports a Monday start', () => {
      const grid = buildMonthGrid({ year: 2026, month: 11 }, 1);
      expect(grid[0].date).toBe('2026-10-26');
      expect(weekdayLabels(1)[0]).toBe('Mon');
      expect(weekdayLabels(0)[0]).toBe('Sun');
    });
  });
});
