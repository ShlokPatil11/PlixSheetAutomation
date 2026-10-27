import { cookies } from "next/headers";
import { findUserById } from "./users";

export const SESSION_COOKIE_NAME = "plix_auth_session";

export function serializeSession(user) {
  return Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      initials: user.initials,
      tone: user.tone,
      teamName: user.teamName,
      isTeamLead: Boolean(user.isTeamLead),
      issuedAt: Date.now(),
    })
  ).toString("base64");
}

export function deserializeSession(token) {
  try {
    if (!token) return null;
    const json = Buffer.from(token, "base64").toString("utf8");
    const payload = JSON.parse(json);
    return findUserById(payload.id) || payload;
  } catch (_) {
    return null;
  }
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return deserializeSession(token);
}

