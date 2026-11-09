/** Today's date (YYYY-MM-DD) in Africa/Johannesburg, the zone every effective date is checked in. */
export const alphaToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
