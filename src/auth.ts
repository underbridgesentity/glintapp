import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, isNull, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Role } from "@/lib/roles";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(
            and(eq(users.email, parsed.data.email), isNull(users.deletedAt))
          )
          .limit(1);
        if (!user) return null;
        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as Role;
      session.user.id = token.userId as string;
      return session;
    },
  },
});
