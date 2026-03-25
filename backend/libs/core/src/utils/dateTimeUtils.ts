import { z } from 'zod';
import { Result, ok, BasicError, basicErr } from './result';

// Strict ISO 8601 UTC format validation (YYYY-MM-DDTHH:mm:ss.SSSZ)
const isoUtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const isoDateStringSchema = z.string().refine(
  (value) => {
    if (!isoUtcRegex.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
  },
  { message: 'Invalid ISO date string' }
);

export function parseLocalISOStringToUTC(
  isoDateStr: string
): Result<Date, BasicError> {
  const validation = isoDateStringSchema.safeParse(isoDateStr);
  if (!validation.success) {
    return basicErr(validation.error.message);
  }
  const localDate = new Date(isoDateStr);
  const utcDate = new Date(
    Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours(),
      localDate.getMinutes(),
      localDate.getSeconds(),
      localDate.getMilliseconds()
    )
  );
  return ok(utcDate);
}

export function formatUTCDateToISOString(
  date: Date
): Result<string, BasicError> {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return basicErr('Invalid Date object');
  }
  return ok(date.toISOString());
}

export function parseUTCISOStringToUTCDate(
  isoUtcString: string
): Result<Date, BasicError> {
  const date = new Date(isoUtcString);
  if (isNaN(date.getTime())) {
    return basicErr('Invalid UTC ISO date string');
  }
  return ok(date);
}
