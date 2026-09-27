import { describe, it, expect } from 'vitest';

import { formatINR, formatHours } from '../utils/format.js';
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
