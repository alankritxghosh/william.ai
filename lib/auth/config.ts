/**
 * NextAuth.js Configuration
 * 
 * Provides authentication for William.ai with support for:
 * - Email/Password (credentials)
 * - Google OAuth (optional)
 * - GitHub OAuth (optional)
 */

import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { z } from "zod";

// Simple in-memory user store for demo purposes
// In production, replace with database (Prisma, Drizzle, etc.)
interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string; // In production, this should be hashed with bcrypt
  image?: string;
  createdAt: string;
}

// Demo users - ONLY available in development mode
// In production, these are disabled and you must use OAuth or implement proper database auth
const demoUsers: StoredUser[] = process.env.NODE_ENV === "development" 
  ? [
      {
        id: "demo-user-1",
        email: "demo@william.ai",
        name: "Demo User",
        password: "demo123", // Only for development testing
        createdAt: new Date().toISOString(),
      },
    ]
  : [];

// Log warning if credentials auth is used in production without OAuth
if (process.env.NODE_ENV === "production" && 
    !process.env.GOOGLE_CLIENT_ID && 
    !process.env.GITHUB_ID) {
  console.warn(
    "⚠️ WARNING: No OAuth providers configured in production.\n" +
    "Demo credentials are disabled in production for security.\n" +
    "Please configure GOOGLE_CLIENT_ID/SECRET or GITHUB_ID/SECRET."
  );
}

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Build providers array based on available env vars
const providers: NextAuthConfig["providers"] = [];

// Always add credentials provider
providers.push(
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "you@example.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const { email, password } = parsed.data;

      // Find user (in production, query database)
      const user = demoUsers.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  })
);

// Add Google provider if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Add GitHub provider if configured
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedPage = nextUrl.pathname.startsWith("/create") ||
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/voice-profile");
      const isOnApiRoute = nextUrl.pathname.startsWith("/api/generate") ||
        nextUrl.pathname.startsWith("/api/extract-insight");

      // Protect API routes
      if (isOnApiRoute) {
        return isLoggedIn;
      }

      // Protect app pages
      if (isOnProtectedPage) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
