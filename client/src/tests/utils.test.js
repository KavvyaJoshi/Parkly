import { describe, it, expect } from 'vitest';

import { formatINR, formatHours, formatDistance } from '../utils/format.js';
import { formatAvailability, formatDays, isOpenForSlot } from '../utils/availability.js';

describe('availability helpers', () => {
  it('summarises days', () => {
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
    expect(formatDays([1, 2, 3, 4, 5])).toBe('Mon–Fri');
    expect(formatDays([1, 2, 3, 4, 5, 6])).toBe('Mon–Sat');
    expect(formatDays([0, 6])).toBe('Sat & Sun');
    expect(formatDays([1, 3])).toBe('Mon, Wed');
  });

  it('formats opening hours', () => {
    expect(formatAvailability({ is24x7: true })).toBe('Open 24×7');
    expect(formatAvailability({ is24x7: false, days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '19:00' })).toBe(
      'Mon–Fri, 9:00 AM – 7:00 PM',
    );
  });

  it('checks whether a slot fits the schedule', () => {
    const weekdays = { is24x7: false, days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '19:00' };
    // 2030-01-07 is a Monday, 2030-01-06 a Sunday.
    expect(isOpenForSlot(weekdays, { date: '2030-01-07', time: '09:00', duration: '10' })).toBe(true);
    expect(isOpenForSlot(weekdays, { date: '2030-01-07', time: '18:00', duration: '2' })).toBe(false);
    expect(isOpenForSlot(weekdays, { date: '2030-01-06', time: '10:00', duration: '1' })).toBe(false);
    expect(isOpenForSlot({ is24x7: true }, { date: '2030-01-06', time: '23:00', duration: '4' })).toBe(true);
    expect(isOpenForSlot(weekdays, { date: '2030-01-07' })).toBeNull();
  });
});

describe('formatDistance', () => {
  it('uses metres below 1 km', () => {
    expect(formatDistance(354)).toBe('350 m');
    expect(formatDistance(2394)).toBe('2.4 km');
  });
});
import { combineDateAndTime, getNextSlot, toDateInputValue, toTimeInputValue } from '../utils/datetime.js';

describe('formatINR', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(formatINR(40)).toBe('₹40');
    expect(formatINR(125000)).toBe('₹1,25,000');
  });
});

describe('formatHours', () => {
  it('pluralises correctly', () => {
    expect(formatHours(1)).toBe('1 hour');
    expect(formatHours(3)).toBe('3 hours');
  });
});

describe('datetime helpers', () => {
  it('rounds up to the next half-hour slot', () => {
    expect(toTimeInputValue(getNextSlot(new Date(2026, 0, 5, 10, 7)))).toBe('10:30');
    expect(toTimeInputValue(getNextSlot(new Date(2026, 0, 5, 10, 40)))).toBe('11:00');
  });

  it('rolls over to the next day near midnight', () => {
    const slot = getNextSlot(new Date(2026, 0, 5, 23, 45));
    expect(toDateInputValue(slot)).toBe('2026-01-06');
    expect(toTimeInputValue(slot)).toBe('00:00');
  });

  it('combines date and time strings into a local Date', () => {
    const date = combineDateAndTime('2026-03-15', '09:30');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });
});
