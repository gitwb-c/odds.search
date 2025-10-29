import { v4 as uuidv4 } from "uuid";

interface ActiveSession {
  sessionId: string;
  ip: string;
  lastSeen: number;
}

const sessions = new Map<string, ActiveSession>();

export const createSession = (userToken: string, ip: string): string => {
  const sessionId = uuidv4();
  sessions.set(userToken, { sessionId, ip, lastSeen: Date.now() });
  return sessionId;
};

export const validateSession = (
  userToken: string,
  sessionId: string | undefined,
  ip: string
): boolean => {
  if (!sessionId) return false;
  const session = sessions.get(userToken);
  if (!session) return false;
  if (session.sessionId !== sessionId) return false;
  if (session.ip !== ip) return false;

  session.lastSeen = Date.now();
  return true;
};

export const invalidateSession = (userToken: string): void => {
  sessions.delete(userToken);
};

export const invalidateOtherSessions = (
  userToken: string,
  currentSessionId: string
): void => {
  const session = sessions.get(userToken);
  if (session && session.sessionId !== currentSessionId) {
    sessions.delete(userToken);
  }
};
