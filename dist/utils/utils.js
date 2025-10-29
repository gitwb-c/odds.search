"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertEventsToUI = exports.mapEventToUI = exports.filterEvents = exports.fetchEvents = exports.fetchOdds = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const apiKey = process.env.ODDS_API_KEY;
const DEFAULT_BOOKMAKERS = ["Bet365", "Betano", "Novibet", "Stake", "Superbet"];
const DEFAULT_SLUGS = ["football", "basketball"];
const fetchOdds = (events_1, ...args_1) => __awaiter(void 0, [events_1, ...args_1], void 0, function* (events, bookmakers = DEFAULT_BOOKMAKERS) {
    if (!(events === null || events === void 0 ? void 0 : events.length))
        return [];
    if (!(bookmakers === null || bookmakers === void 0 ? void 0 : bookmakers.length))
        return [];
    const _bookmakers = bookmakers.join(",");
    const eventIds = events.map((e) => e.id).join(",");
    const url = `https://api.odds-api.io/v3/odds/multi?apiKey=${apiKey}&eventIds=${eventIds}&bookmakers=${_bookmakers}`;
    try {
        const response = yield fetch(url);
        if (!response.ok) {
            const errorText = yield response.text();
            throw new Error(`odds api failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = yield response.json();
        if (!Array.isArray(data)) {
            throw new Error("odds api response is not an array");
        }
        return data;
    }
    catch (error) {
        throw error instanceof Error
            ? error
            : new Error("unknown error while fetching odds");
    }
});
exports.fetchOdds = fetchOdds;
const fetchEvents = (query) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(query === null || query === void 0 ? void 0 : query.trim())) {
        throw new Error("Search query is required");
    }
    const encodedQuery = encodeURIComponent(query.trim());
    const url = `https://api.odds-api.io/v3/events/search?apiKey=${apiKey}&query=${encodedQuery}`;
    try {
        const response = yield fetch(url);
        if (!response.ok) {
            const errorText = yield response.text();
            throw new Error(`events api failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = yield response.json();
        if (!Array.isArray(data)) {
            throw new Error("events api response is not an array");
        }
        return data;
    }
    catch (error) {
        throw error instanceof Error
            ? error
            : new Error("unknown error while fetching events");
    }
});
exports.fetchEvents = fetchEvents;
const filterEvents = (events, slugs = DEFAULT_SLUGS) => {
    if (!(events === null || events === void 0 ? void 0 : events.length) || !(slugs === null || slugs === void 0 ? void 0 : slugs.length))
        return [];
    const slugSet = new Set(slugs.map((s) => s.toLowerCase()));
    return events.filter((e) => {
        var _a;
        if (!((_a = e === null || e === void 0 ? void 0 : e.sport) === null || _a === void 0 ? void 0 : _a.slug))
            return false;
        return slugSet.has(e.sport.slug.toLowerCase());
    });
};
exports.filterEvents = filterEvents;
const mapEventToUI = (eventOdd, bookmakers = DEFAULT_BOOKMAKERS) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (!eventOdd || !(bookmakers === null || bookmakers === void 0 ? void 0 : bookmakers.length))
        return [];
    const result = [];
    for (const bookmaker of bookmakers) {
        try {
            const oddsData = (_d = (_c = (_b = (_a = eventOdd.bookmakers) === null || _a === void 0 ? void 0 : _a[bookmaker]) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.odds) === null || _d === void 0 ? void 0 : _d[0];
            if (!oddsData)
                continue;
            const ui = {
                teams: {
                    home: (_e = eventOdd.home) !== null && _e !== void 0 ? _e : "Unknown",
                    away: (_f = eventOdd.away) !== null && _f !== void 0 ? _f : "Unknown",
                },
                bookmaker: bookmaker,
                odds: {
                    home: (_h = (_g = oddsData.home) === null || _g === void 0 ? void 0 : _g.toString()) !== null && _h !== void 0 ? _h : "-",
                    draw: (_k = (_j = oddsData.draw) === null || _j === void 0 ? void 0 : _j.toString()) !== null && _k !== void 0 ? _k : "-",
                    away: (_m = (_l = oddsData.away) === null || _l === void 0 ? void 0 : _l.toString()) !== null && _m !== void 0 ? _m : "-",
                },
                date: (_o = eventOdd.date) !== null && _o !== void 0 ? _o : new Date().toISOString(),
                sport: eventOdd.sport.slug,
                url: eventOdd.urls[bookmaker],
            };
            result.push(ui);
        }
        catch (err) {
            continue;
        }
    }
    return result;
};
exports.mapEventToUI = mapEventToUI;
const convertEventsToUI = (eventsOdds, bookmakers = DEFAULT_BOOKMAKERS) => {
    if (!(eventsOdds === null || eventsOdds === void 0 ? void 0 : eventsOdds.length) || !(bookmakers === null || bookmakers === void 0 ? void 0 : bookmakers.length))
        return [];
    return eventsOdds
        .map((eventOdd) => {
        try {
            return (0, exports.mapEventToUI)(eventOdd, bookmakers);
        }
        catch (error) {
            return [];
        }
    })
        .filter((uiArray) => uiArray.length > 0);
};
exports.convertEventsToUI = convertEventsToUI;
