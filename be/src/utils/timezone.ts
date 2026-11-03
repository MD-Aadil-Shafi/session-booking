export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return true;
  } catch {
    return false;
  }
}

// eg:
/*
Asia/Kolkata
Asia/Riyadh
Europe/London
America/New_York
Australia/Sydney
*/