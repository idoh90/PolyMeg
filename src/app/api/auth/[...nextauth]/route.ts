import { handlers } from "@/auth";

// Auth.js catch-all (Google handshake: /api/auth/signin, /callback/google, etc.).
// Our explicit /api/auth/login, /signup, /logout, /debug routes take precedence
// over this dynamic segment, so they keep working.
export const { GET, POST } = handlers;
