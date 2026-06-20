import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
}

const password = process.env.SESSION_SECRET;
if (!password || password.length < 32) {
  // Fail loudly in dev if the secret is missing/short so sessions are secure.
  throw new Error(
    "SESSION_SECRET env var must be set and at least 32 characters long.",
  );
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "grubet_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

/** Read (and create, if absent) the current session. */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** Return the logged-in user id or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId ?? null;
}
