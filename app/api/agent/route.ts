import { NextRequest } from 'next/server';
import { createCalendarEvent, listCalendarEvents } from '@/lib/googleApi';

const DEFAULT_TIME_ZONE = process.env.DEFAULT_TIME_ZONE || 'Asia/Dubai';
const DEFAULT_TIME_OFFSET = process.env.DEFAULT_TIME_OFFSET || '+04:00';

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DEFAULT_TIME_ZONE,
  }).format(date);
}

function formatEventsReply(
  events: Awaited<ReturnType<typeof listCalendarEvents>>
) {
  if (!events || events.length === 0) {
    return 'You have no upcoming calendar events.';
  }

  const lines = events.slice(0, 5).map((event) => {
    const start = event.start?.dateTime ?? event.start?.date ?? 'Unknown time';
    return `- ${event.summary ?? 'Untitled event'} at ${formatDateTime(start)}`;
  });

  return `Here are your upcoming events:\n${lines.join('\n')}`;
}

function parseExplicitDate(message: string) {
  const slashMatch = message.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]) - 1;
    const year = Number(slashMatch[3]);
    return { year, month, day };
  }

  const dashMatch = message.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (dashMatch) {
    const year = Number(dashMatch[1]);
    const month = Number(dashMatch[2]) - 1;
    const day = Number(dashMatch[3]);
    return { year, month, day };
  }

  return null;
}

function getTodayParts(timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return { year, month, day };
}

function addDays(
  dateParts: { year: number; month: number; day: number },
  days: number
) {
  const utcDate = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days)
  );

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function formatCalendarDateTime(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}) {
  const year = String(input.year);
  const month = String(input.month).padStart(2, '0');
  const day = String(input.day).padStart(2, '0');
  const hour = String(input.hour).padStart(2, '0');
  const minute = String(input.minute).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00${DEFAULT_TIME_OFFSET}`;
}

function parseCreateEvent(message: string) {
  const lower = message.toLowerCase();
  const createIntent =
    lower.includes('create') ||
    lower.includes('schedule') ||
    lower.includes('add event');

  if (!createIntent) {
    return null;
  }

  const timeMatch = message.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  if (!timeMatch) {
    return {
      error:
        "I can create events, but I need a time. Try: 'schedule meeting on 1/04/2026 at 3 PM'.",
    };
  }

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? '0');
  const meridiem = timeMatch[3]?.toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  const explicitDate = parseExplicitDate(message);
  const today = getTodayParts(DEFAULT_TIME_ZONE);
  let eventDate = today;

  if (explicitDate) {
    eventDate = {
      year: explicitDate.year,
      month: explicitDate.month + 1,
      day: explicitDate.day,
    };
  } else if (lower.includes('tomorrow')) {
    eventDate = addDays(today, 1);
  }

  let summary = 'New Event';
  const titleMatch = message.match(
    /(?:create|schedule|add event)\s+(.*?)(?:\s+on\s+\d{1,2}\/\d{1,2}\/\d{4}|\s+on\s+\d{4}-\d{2}-\d{2}|\s+tomorrow|\s+today|\s+at\s+\d|$)/i
  );

  if (titleMatch?.[1]) {
    summary = titleMatch[1].trim().replace(/^a\s+/i, '').replace(/^an\s+/i, '');
  }

  const start = formatCalendarDateTime({
    ...eventDate,
    hour,
    minute,
  });

  const endHour = (hour + 1) % 24;
  const endDate = hour === 23 ? addDays(eventDate, 1) : eventDate;
  const end = formatCalendarDateTime({
    ...endDate,
    hour: endHour,
    minute,
  });

  return {
    summary,
    start,
    end,
    timeZone: DEFAULT_TIME_ZONE,
  };
}

async function exchangeGoogleToken(cookieHeader: string) {
  const exchangeRes = await fetch(`${process.env.AUTH0_BASE_URL}/api/exchange-google-token`, {
    method: 'POST',
    headers: {
      cookie: cookieHeader,
    },
  });

  const exchangeData = await exchangeRes.json();

  if (!exchangeRes.ok) {
    return {
      error:
        exchangeData.error || 'Failed to exchange Auth0 token for Google token.',
    };
  }

  if (!exchangeData.access_token) {
    return {
      error: 'No Google access token was returned from Token Vault exchange.',
    };
  }

  return { accessToken: exchangeData.access_token };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { message?: string };
    const message = body?.message?.trim();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const normalizedMessage = message.toLowerCase();
    const wantsCreate =
      normalizedMessage.includes('create') ||
      normalizedMessage.includes('schedule') ||
      normalizedMessage.includes('add event');

    const wantsCalendar =
      normalizedMessage.includes('calendar') ||
      normalizedMessage.includes('event') ||
      normalizedMessage.includes('schedule');

    if (wantsCalendar) {
      const cookieHeader = req.headers.get('cookie') ?? '';
      const exchange = await exchangeGoogleToken(cookieHeader);

      if (exchange.error) {
        return Response.json({ reply: exchange.error }, { status: 200 });
      }

      if (wantsCreate) {
        const parsed = parseCreateEvent(message);

        if (!parsed) {
          return Response.json(
            { reply: "I couldn't understand the event details." },
            { status: 200 }
          );
        }

        if ('error' in parsed) {
          return Response.json({ reply: parsed.error }, { status: 200 });
        }

        const createdEvent = await createCalendarEvent(exchange.accessToken, parsed);
        const createdStart =
          createdEvent.start?.dateTime ?? createdEvent.start?.date ?? parsed.start;

        return Response.json(
          {
            reply: `Scheduled '${createdEvent.summary ?? parsed.summary}' for ${formatDateTime(createdStart)}.`,
          },
          { status: 200 }
        );
      }

      const events = await listCalendarEvents(exchange.accessToken);
      return Response.json({ reply: formatEventsReply(events) }, { status: 200 });
    }

    return Response.json(
      {
        reply:
          "I can help with your calendar right now. Try asking 'show my calendar events' or 'schedule meeting on 1/04/2026 at 3 PM'.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to handle agent request:', err);
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
