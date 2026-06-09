/**
 * Returns the calendar date (YYYY-MM-DD) for the given instant in the given
 * IANA time zone. Used to key the "quest of the day" by the user's local date.
 */
export function getQuestDateKey(date: Date, timeZone: string): string {
  // en-CA locale formats as YYYY-MM-DD, which is exactly the key shape we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
