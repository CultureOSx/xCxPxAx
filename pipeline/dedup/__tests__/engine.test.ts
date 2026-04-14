import { isDuplicate } from '../engine';

describe('isDuplicate', () => {
  it('returns true for exact identical events', () => {
    const a = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    const b = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('returns true for highly similar titles (>0.9)', () => {
    const a = {
      title: 'Jazz Night at the Blue Note',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    const b = {
      title: 'Jazz Night at the Blue Note!', // High similarity (>0.9)
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('returns false for dissimilar titles', () => {
    const a = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    const b = {
      title: 'Rock Concert', // Very different title
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('returns false for different start times', () => {
    const a = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    const b = {
      title: 'Jazz Night',
      startTime: '2023-10-28T19:00:00Z', // Different start time
      venue: { name: 'Blue Note' }
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('returns false for different venues', () => {
    const a = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Blue Note' }
    };
    const b = {
      title: 'Jazz Night',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Village Vanguard' } // Different venue
    };
    expect(isDuplicate(a, b)).toBe(false);
  });

  it('handles missing venues gracefully and returns true if both missing', () => {
    const a = {
      title: 'Outdoor Festival',
      startTime: '2023-10-27T19:00:00Z',
      venue: null
    };
    const b = {
      title: 'Outdoor Festival',
      startTime: '2023-10-27T19:00:00Z',
      // Venue is undefined
    };
    expect(isDuplicate(a, b)).toBe(true);
  });

  it('returns false when one venue is provided and the other is missing', () => {
    const a = {
      title: 'Outdoor Festival',
      startTime: '2023-10-27T19:00:00Z',
      venue: { name: 'Central Park' }
    };
    const b = {
      title: 'Outdoor Festival',
      startTime: '2023-10-27T19:00:00Z',
      venue: null
    };
    expect(isDuplicate(a, b)).toBe(false);
  });
});
