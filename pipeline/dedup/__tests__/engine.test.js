import { isDuplicate } from '../engine';

describe('isDuplicate', () => {
  it('returns true for identical objects', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    const b = { ...a };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('returns true when titles are very similar (> 0.9 similarity) and other fields match', () => {
    const a = {
      title: 'Jazz Concert at the Park',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Park Arena' },
    };
    const b = {
      title: 'Jazz Concert at the Parkk', // Slight typo, still > 0.9 similar
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Park Arena' },
    };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('returns false when titles are completely different', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    const b = {
      title: 'Rock Festival',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('returns false when startTimes are different', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    const b = {
      title: 'Jazz Concert',
      startTime: '2023-10-02T19:00:00Z', // Different start time
      venue: { name: 'Blue Note' },
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('returns false when venues are different', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    const b = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Red Note' }, // Different venue
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('handles missing venues (undefined venue) gracefully, matching if both are undefined', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
    };
    const b = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
    };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('handles mismatch when one venue is missing', () => {
    const a = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
    };
    const b = {
      title: 'Jazz Concert',
      startTime: '2023-10-01T19:00:00Z',
      venue: { name: 'Blue Note' },
    };
    expect(isDuplicate(a, b)).toBe(false);
  });
});
