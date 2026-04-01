import { google } from 'googleapis';

export async function listCalendarEvents(googleAccessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: googleAccessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items ?? [];
}

export async function createCalendarEvent(
  googleAccessToken: string,
  input: {
    summary: string;
    start: string;
    end: string;
    timeZone?: string;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: googleAccessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.summary,
      start: {
        dateTime: input.start,
        timeZone: input.timeZone,
      },
      end: {
        dateTime: input.end,
        timeZone: input.timeZone,
      },
    },
  });

  return res.data;
}
