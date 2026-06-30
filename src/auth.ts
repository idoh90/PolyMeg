import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale } from "@/lib/i18n/config";

// Auth.js (NextAuth v5) — Google sign-in only. We keep the existing iron-session
// as the app's source of truth; this bridges Google identity into our Prisma
// User table and stashes our user id on the JWT. `getCurrentUserId` (lib/session)
// falls back to this session when no iron-session cookie is present.
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only on initial sign-in: upsert our user and remember its id.
      if (account && profile?.sub) {
        const username = `gg_${profile.sub}`;
        const displayName =
          (typeof profile.name === "string" && profile.name) ||
          (typeof profile.email === "string" && profile.email.split("@")[0]) ||
          getDictionary(defaultLocale).auth.googleUser;
        const avatarUrl = typeof profile.picture === "string" ? profile.picture : null;
        const user = await prisma.user.upsert({
          where: { username },
          update: { displayName, ...(avatarUrl ? { avatarUrl } : {}) },
          create: {
            username,
            displayName,
            avatarUrl,
            passwordHash: await bcrypt.hash(randomUUID(), 10),
          },
        });
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) (session as { uid?: string }).uid = token.uid as string;
      return session;
    },
  },
});
