import {
  isoDateStringSchema,
  parseLocalISOStringToUTC,
  formatUTCDateToISOString,
  parseUTCISOStringToUTCDate,
} from '../dateTimeUtils';
import { isOk, isErr } from '../result';

describe('dateTimeUtils', () => {
  describe('isoDateStringSchema', () => {
    it('should validate valid ISO date strings', () => {
      const validDates = [
        '2023-01-01T00:00:00.000Z',
        '2023-12-31T23:59:59.999Z',
        '2020-02-29T12:30:45.123Z',
        '1999-01-01T00:00:00.000Z',
        '2030-12-31T23:59:59.999Z',
      ];

      validDates.forEach((dateStr) => {
        const result = isoDateStringSchema.safeParse(dateStr);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(dateStr);
        }
      });
    });

    it('should reject invalid ISO date strings', () => {
      const invalidDates = [
        '2023-13-01T00:00:00.000Z',
        '2023-01-32T00:00:00.000Z',
        '2023-01-01T25:00:00.000Z',
        '2023-01-01T00:60:00.000Z',
        '2023-01-01T00:00:60.000Z',
        '2023-01-01',
        '2023-01-01T00:00:00',
        'invalid-date',
        '',
        '2023/01/01T00:00:00.000Z',
        '2023-01-01T00:00:00.000+00:00',
      ];

      invalidDates.forEach((dateStr) => {
        const result = isoDateStringSchema.safeParse(dateStr);
        expect(result.success).toBe(false);
        if (!result.success) {
          const firstIssue = result.error.issues[0];
          expect(firstIssue.message).toBe('Invalid ISO date string');
        }
      });
    });

    it('should reject non-string values', () => {
      const invalidValues = [null, undefined, 123, new Date(), {}, []];

      invalidValues.forEach((value) => {
        const result = isoDateStringSchema.safeParse(value);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('parseLocalISOStringToUTC', () => {
    it('should successfully parse valid ISO date strings to UTC', () => {
      const testCases = [
        {
          input: '2023-01-01T00:00:00.000Z',
          expected: new Date('2023-01-01T00:00:00.000Z'),
        },
        {
          input: '2023-12-31T23:59:59.999Z',
          expected: new Date('2023-12-31T23:59:59.999Z'),
        },
        {
          input: '2020-02-29T12:30:45.123Z',
          expected: new Date('2020-02-29T12:30:45.123Z'),
        },
      ];

      testCases.forEach(({ input }) => {
        const result = parseLocalISOStringToUTC(input);
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeInstanceOf(Date);
          expect(result.value.getTime()).toBeGreaterThan(0);
        }
      });
    });

    it('should return error for invalid ISO date strings', () => {
      const invalidDates = [
        '2023-13-01T00:00:00.000Z',
        'invalid-date',
        '2023-01-01',
        '',
      ];

      invalidDates.forEach((dateStr) => {
        const result = parseLocalISOStringToUTC(dateStr);
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toContain('Invalid ISO date string');
        }
      });
    });

    it('should handle edge cases correctly', () => {
      const result = parseLocalISOStringToUTC('2023-01-01T00:00:00.000Z');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBeInstanceOf(Date);
        expect(result.value.getTime()).toBeGreaterThan(0);
      }
    });
  });

  describe('formatUTCDateToISOString', () => {
    it('should successfully format valid Date objects to ISO strings', () => {
      const testCases = [
        {
          input: new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0)),
          expected: '2023-01-01T00:00:00.000Z',
        },
        {
          input: new Date(Date.UTC(2023, 11, 31, 23, 59, 59, 999)),
          expected: '2023-12-31T23:59:59.999Z',
        },
        {
          input: new Date(Date.UTC(2020, 1, 29, 12, 30, 45, 123)),
          expected: '2020-02-29T12:30:45.123Z',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatUTCDateToISOString(input);
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBe(expected);
        }
      });
    });

    it('should return error for invalid Date objects', () => {
      const invalidDates = [
        new Date('invalid-date'),
        new Date(NaN),
        new Date(Infinity),
        new Date(-Infinity),
      ];

      invalidDates.forEach((date) => {
        const result = formatUTCDateToISOString(date);
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toBe('Invalid Date object');
        }
      });
    });

    it('should return error for non-Date objects', () => {
      const invalidInputs = [
        null,
        undefined,
        '2023-01-01T00:00:00.000Z',
        123,
        {},
        [],
      ];

      invalidInputs.forEach((input) => {
        const result = formatUTCDateToISOString(input as unknown as Date);
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toBe('Invalid Date object');
        }
      });
    });

    it('should handle edge cases correctly', () => {
      const earlyDate = new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 0));
      const result = formatUTCDateToISOString(earlyDate);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('1970-01-01T00:00:00.000Z');
      }
    });
  });

  describe('parseUTCISOStringToUTCDate', () => {
    it('should successfully parse valid UTC ISO strings to Date objects', () => {
      const testCases = [
        {
          input: '2023-01-01T00:00:00.000Z',
          expected: new Date('2023-01-01T00:00:00.000Z'),
        },
        {
          input: '2023-12-31T23:59:59.999Z',
          expected: new Date('2023-12-31T23:59:59.999Z'),
        },
        {
          input: '2020-02-29T12:30:45.123Z',
          expected: new Date('2020-02-29T12:30:45.123Z'),
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseUTCISOStringToUTCDate(input);
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.getTime()).toBe(expected.getTime());
        }
      });
    });

    it('should return error for invalid UTC ISO strings', () => {
      const invalidDates = ['invalid-date', ''];

      invalidDates.forEach((dateStr) => {
        const result = parseUTCISOStringToUTCDate(dateStr);
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.message).toBe('Invalid UTC ISO date string');
        }
      });
    });

    it('should handle edge cases correctly', () => {
      const result = parseUTCISOStringToUTCDate('1970-01-01T00:00:00.000Z');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.getTime()).toBe(0);
      }
    });

    it('should preserve timezone information correctly', () => {
      const isoString = '2023-01-01T12:00:00.000Z';
      const result = parseUTCISOStringToUTCDate(isoString);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toISOString()).toBe(isoString);
      }
    });
  });

  describe('integration tests', () => {
    it('should maintain consistency between parse and format operations', () => {
      const originalDate = new Date(Date.UTC(2023, 5, 15, 14, 30, 45, 123));

      const formatResult = formatUTCDateToISOString(originalDate);
      expect(isOk(formatResult)).toBe(true);

      if (isOk(formatResult)) {
        const isoString = formatResult.value;

        const parseResult = parseUTCISOStringToUTCDate(isoString);
        expect(isOk(parseResult)).toBe(true);

        if (isOk(parseResult)) {
          const parsedDate = parseResult.value;
          expect(parsedDate.getTime()).toBe(originalDate.getTime());
        }
      }
    });

    it('should handle round-trip conversion through local ISO parsing', () => {
      const originalIsoString = '2023-01-01T12:00:00.000Z';

      const parseResult = parseLocalISOStringToUTC(originalIsoString);
      expect(isOk(parseResult)).toBe(true);

      if (isOk(parseResult)) {
        const utcDate = parseResult.value;

        const formatResult = formatUTCDateToISOString(utcDate);
        expect(isOk(formatResult)).toBe(true);

        if (isOk(formatResult)) {
          expect(formatResult.value).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          );
        }
      }
    });
  });
});
