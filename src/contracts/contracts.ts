export interface GatewayData {
  search: string;
}

export interface Event {
  id: number;
  home: string;
  away: string;
  date: string;
  sport: {
    name: string;
    slug: string;
  };
  league: {
    name: string;
    slug: string;
  };
  status: string;
  scores: {
    home: number;
    away: number;
  };
}

export interface EventOdd {
  id: number;
  home: string;
  away: string;
  date: string;
  sport: {
    name: string;
    slug: string;
  };
  league: {
    name: string;
    slug: string;
  };
  urls: {
    [key: string]: string;
  };
  bookmakers: {
    [key: string]: [
      {
        odds: [{ away: string; draw: string; home: string }];
        updatedAt: string;
      }
    ];
  };
  status: string;
}

export interface UI {
  bookmaker: string;
  teams: {
    home: string;
    away: string;
  };

  odds: {
    home: string;
    draw: string;
    away: string;
  };
  date: string;
}
