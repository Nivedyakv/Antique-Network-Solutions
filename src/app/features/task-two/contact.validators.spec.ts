import { FormControl } from '@angular/forms';

import {
  integer,
  localToday,
  nonBlank,
  validDate,
} from './contact.validators';

describe('Contact validators', () => {
  describe('localToday', () => {
    beforeEach(() => {
      jasmine.clock().install();

      // Use a local date to avoid timezone-dependent expectations.
      jasmine.clock().mockDate(new Date(2026, 0, 5, 12, 0, 0));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return the local date in YYYY-MM-DD format', () => {
      expect(localToday()).toBe('2026-01-05');
    });

    it('should pad single-digit months and days', () => {
      jasmine.clock().mockDate(new Date(2026, 2, 9, 12, 0, 0));

      expect(localToday()).toBe('2026-03-09');
    });

    it('should handle the final day of the year', () => {
      jasmine.clock().mockDate(new Date(2026, 11, 31, 12, 0, 0));

      expect(localToday()).toBe('2026-12-31');
    });
  });

  describe('nonBlank', () => {
    it('should reject an empty string', () => {
      expect(nonBlank(new FormControl('')))
        .toEqual({ blank: true });
    });

    it('should reject whitespace-only input', () => {
      expect(nonBlank(new FormControl(' \t\n ')))
        .toEqual({ blank: true });
    });

    it('should reject null', () => {
      expect(nonBlank(new FormControl(null)))
        .toEqual({ blank: true });
    });

    it('should accept text', () => {
      expect(nonBlank(new FormControl('Anu'))).toBeNull();
    });

    it('should accept text with surrounding whitespace', () => {
      expect(nonBlank(new FormControl('  Anu  '))).toBeNull();
    });

    it('should not modify the original value', () => {
      const control = new FormControl('  Anu  ');

      nonBlank(control);

      expect(control.value).toBe('  Anu  ');
    });
  });

  describe('integer', () => {
    it('should accept positive whole numbers', () => {
      expect(integer(new FormControl(25))).toBeNull();
    });

    it('should accept zero', () => {
      expect(integer(new FormControl(0))).toBeNull();
    });

    it('should accept negative whole numbers', () => {
      // Range restrictions are handled by separate validators.
      expect(integer(new FormControl(-5))).toBeNull();
    });

    it('should reject decimal values', () => {
      expect(integer(new FormControl(25.5)))
        .toEqual({ integer: true });
    });

    it('should reject numeric strings', () => {
      expect(integer(new FormControl('25')))
        .toEqual({ integer: true });
    });

    it('should reject NaN', () => {
      expect(integer(new FormControl(NaN)))
        .toEqual({ integer: true });
    });

    it('should reject Infinity', () => {
      expect(integer(new FormControl(Infinity)))
        .toEqual({ integer: true });
    });

    it('should allow null so required validation can handle it', () => {
      expect(integer(new FormControl(null))).toBeNull();
    });

    it('should allow an empty string', () => {
      expect(integer(new FormControl(''))).toBeNull();
    });
  });

  describe('validDate', () => {
    beforeEach(() => {
      jasmine.clock().install();

      // Freeze today so date tests remain deterministic.
      jasmine.clock().mockDate(new Date(2026, 9, 16, 12, 0, 0));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should allow an empty value', () => {
      expect(validDate(new FormControl(''))).toBeNull();
    });

    it('should allow null', () => {
      expect(validDate(new FormControl(null))).toBeNull();
    });

    it('should accept a valid past date', () => {
      expect(validDate(new FormControl('2024-01-15')))
        .toBeNull();
    });

    it('should accept today', () => {
      expect(validDate(new FormControl('2026-10-16')))
        .toBeNull();
    });

    it('should reject tomorrow', () => {
      expect(validDate(new FormControl('2026-10-17')))
        .toEqual({ future: true });
    });

    it('should reject a future year', () => {
      expect(validDate(new FormControl('2027-01-01')))
        .toEqual({ future: true });
    });

    it('should accept February 29 in a leap year', () => {
      expect(validDate(new FormControl('2024-02-29')))
        .toBeNull();
    });

    it('should reject February 29 in a non-leap year', () => {
      expect(validDate(new FormControl('2025-02-29')))
        .toEqual({ date: true });
    });

    it('should reject February 30', () => {
      expect(validDate(new FormControl('2024-02-30')))
        .toEqual({ date: true });
    });

    it('should reject April 31', () => {
      expect(validDate(new FormControl('2024-04-31')))
        .toEqual({ date: true });
    });

    it('should reject an invalid month', () => {
      expect(validDate(new FormControl('2024-13-01')))
        .toEqual({ date: true });
    });

    it('should reject a zero month', () => {
      expect(validDate(new FormControl('2024-00-10')))
        .toEqual({ date: true });
    });

    it('should reject a zero day', () => {
      expect(validDate(new FormControl('2024-01-00')))
        .toEqual({ date: true });
    });

    it('should reject DD/MM/YYYY format', () => {
      expect(validDate(new FormControl('15/01/2024')))
        .toEqual({ date: true });
    });

    it('should reject dates without zero padding', () => {
      expect(validDate(new FormControl('2024-1-5')))
        .toEqual({ date: true });
    });

    it('should reject a timestamp instead of a date', () => {
      expect(
        validDate(new FormControl('2024-01-15T12:00:00Z')),
      ).toEqual({ date: true });
    });

    it('should reject arbitrary text', () => {
      expect(validDate(new FormControl('invalid-date')))
        .toEqual({ date: true });
    });
  });
});