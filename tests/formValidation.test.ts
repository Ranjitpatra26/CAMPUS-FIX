import { describe, it, expect } from 'vitest';

// Pure validation logic matching ComplaintForm
export function validateComplaintInput(input: {
  title: string;
  location: string;
  description: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.title || !input.title.trim()) {
    errors.title = 'Complaint title is required.';
  } else if (input.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long.';
  } else if (input.title.trim().length > 120) {
    errors.title = 'Title must not exceed 120 characters.';
  }

  if (!input.location || !input.location.trim()) {
    errors.location = 'Please specify the building, room, or campus area.';
  } else if (input.location.trim().length > 100) {
    errors.location = 'Location must not exceed 100 characters.';
  }

  if (!input.description || !input.description.trim()) {
    errors.description = 'Please provide detailed context about the problem.';
  } else if (input.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters for technicians to evaluate.';
  } else if (input.description.trim().length > 1500) {
    errors.description = 'Description must not exceed 1500 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

describe('Complaint Form Validation Rules', () => {
  it('accepts valid input meeting all criteria', () => {
    const res = validateComplaintInput({
      title: 'Broken fluorescent tube in Tech Tower 302',
      location: 'Tech Tower Room 302 Ceiling Grid',
      description: 'The light flickers violently and buzzes, creating an unbearable disruption during class.'
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('rejects empty or whitespace-only title', () => {
    const resEmpty = validateComplaintInput({
      title: '',
      location: 'Room 101',
      description: 'Long enough description for technicians to read.'
    });
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.errors.title).toBe('Complaint title is required.');

    const resWhitespace = validateComplaintInput({
      title: '     ',
      location: 'Room 101',
      description: 'Long enough description for technicians to read.'
    });
    expect(resWhitespace.isValid).toBe(false);
    expect(resWhitespace.errors.title).toBe('Complaint title is required.');
  });

  it('rejects titles that are too short (< 5 chars)', () => {
    const res = validateComplaintInput({
      title: 'Fix!',
      location: 'Room 101',
      description: 'Long enough description for technicians to read.'
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.title).toContain('at least 5 characters');
  });

  it('rejects excessively long titles (> 120 chars)', () => {
    const res = validateComplaintInput({
      title: 'A'.repeat(125),
      location: 'Room 101',
      description: 'Long enough description for technicians to read.'
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.title).toContain('not exceed 120 characters');
  });

  it('rejects empty or whitespace-only location', () => {
    const res = validateComplaintInput({
      title: 'Air conditioning dripping',
      location: '   ',
      description: 'Long enough description for technicians to read.'
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.location).toBe('Please specify the building, room, or campus area.');
  });

  it('rejects description that is too short (< 20 chars)', () => {
    const res = validateComplaintInput({
      title: 'Air conditioning dripping',
      location: 'Room 204',
      description: 'Too short.'
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.description).toContain('at least 20 characters');
  });

  it('rejects description exceeding 1500 characters', () => {
    const res = validateComplaintInput({
      title: 'Air conditioning dripping',
      location: 'Room 204',
      description: 'A'.repeat(1505)
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.description).toContain('not exceed 1500 characters');
  });
});
