import type { Event, EventOdd, UI } from "../contracts/contracts";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ODDS_API_KEY;

const DEFAULT_BOOKMAKERS = ["Bet365", "Betano", "Novibet", "Stake", "Superbet"];
const DEFAULT_SLUGS = ["football", "basketball"];

export const fetchOdds = async (
  events: Event[],
  bookmakers: string[] = DEFAULT_BOOKMAKERS
): Promise<EventOdd[]> => {
  if (!events?.length) return [];
  if (!bookmakers?.length) return [];

  const _bookmakers = bookmakers.join(",");
  const eventIds = events.map((e) => e.id).join(",");

  const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${apiKey}&eventIds=${eventIds}&bookmakers=${_bookmakers}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `odds api failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("odds api response is not an array");
    }

    return data as EventOdd[];
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("unknown error while fetching odds");
  }
};

export const fetchEvents = async (query: string): Promise<Event[]> => {
  if (!query?.trim()) {
    throw new Error("Search query is required");
  }

  const encodedQuery = encodeURIComponent(query.trim());
  const url = `https://api.odds-api.io/v3/events/search?apiKey=${apiKey}&query=${encodedQuery}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `events api failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("events api response is not an array");
    }

    return data as Event[];
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("unknown error while fetching events");
  }
};

export const filterEvents = (
  events: Event[],
  slugs: string[] = DEFAULT_SLUGS
): Event[] => {
  if (!events?.length || !slugs?.length) return [];

  const slugSet = new Set(slugs.map((s) => s.toLowerCase()));

  return events.filter((e) => {
    if (!e?.sport?.slug) return false;
    return slugSet.has(e.sport.slug.toLowerCase());
  });
};

export const mapEventToUI = (
  eventOdd: EventOdd,
  bookmakers: string[] = DEFAULT_BOOKMAKERS
): UI[] => {
  if (!eventOdd || !bookmakers?.length) return [];

  const result: UI[] = [];

  for (const bookmaker of bookmakers) {
    try {
      const oddsData = eventOdd.bookmakers?.[bookmaker]?.[0]?.odds?.[0];

      if (!oddsData) continue;

      const ui: UI = {
        teams: {
          home: eventOdd.home ?? "Unknown",
          away: eventOdd.away ?? "Unknown",
        },
        bookmaker: bookmaker,
        odds: {
          home: oddsData.home?.toString() ?? "-",
          draw: oddsData.draw?.toString() ?? "-",
          away: oddsData.away?.toString() ?? "-",
        },
        date: eventOdd.date ?? new Date().toISOString(),
        sport: eventOdd.sport.slug,
      };

      result.push(ui);
    } catch (err) {
      continue;
    }
  }

  return result;
};

export const convertEventsToUI = (
  eventsOdds: EventOdd[],
  bookmakers: string[] = DEFAULT_BOOKMAKERS
): UI[][] => {
  if (!eventsOdds?.length || !bookmakers?.length) return [];

  return eventsOdds
    .map((eventOdd) => {
      try {
        return mapEventToUI(eventOdd, bookmakers);
      } catch (error) {
        return [];
      }
    })
    .filter((uiArray) => uiArray.length > 0);
};
