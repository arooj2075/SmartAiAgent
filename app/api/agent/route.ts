import { NextRequest } from 'next/server';
import { createCalendarEvent, listCalendarEvents } from '@/lib/googleApi';

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

  const start = new Date();
  start.setSeconds(0, 0);

  const explicitDate = parseExplicitDate(message);

  if (explicitDate) {
    start.setFullYear(explicitDate.year, explicitDate.month, explicitDate.day);
  } else if (lower.includes('tomorrow')) {
    start.setDate(start.getDate() + 1);
  }

  start.setHours(hour, minute, 0, 0);

  const end = new Date(start.getTime() + 60 * 60 * 1000);

  let summary = 'New Event';
  const titleMatch = message.match(
    /(?:create|schedule|add event)\s+(.*?)(?:\s+on\s+\d{1,2}\/\d{1,2}\/\d{4}|\s+on\s+\d{4}-\d{2}-\d{2}|\s+tomorrow|\s+today|\s+at\s+\d|$)/i
  );

  if (titleMatch?.[1]) {
    summary = titleMatch[1].trim().replace(/^a\s+/i, '').replace(/^an\s+/i, '');
  }

  return {
    summary,
    start: start.toISOString(),
    end: end.toISOString(),
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
