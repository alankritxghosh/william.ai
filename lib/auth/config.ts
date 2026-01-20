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
  password: string;
  image?: string;
  createdAt: string;
}

/**
 * DEMO MODE CONFIGURATION
 * 
 * SECURITY WARNING:
 * Demo mode should ONLY be enabled for local development or controlled demos.
 * Demo credentials use plaintext passwords and are NOT secure for production.
 * 
 * To enable demo mode:
 * 1. Set NODE_ENV=development
 * 2. Set ENABLE_DEMO_AUTH=true in your .env.local
 * 
 * In production, you MUST use OAuth providers (Google, GitHub) or
 * implement proper database authentication with hashed passwords.
 */
const isDemoModeEnabled = 
  process.env.NODE_ENV === "development" && 
  process.env.ENABLE_DEMO_AUTH === "true";

// Demo users - ONLY available when explicitly enabled in development
const demoUsers: StoredUser[] = isDemoModeEnabled
  ? [
      {
        id: "demo-user-1",
        email: "demo@william.ai",
        name: "Demo User",
        password: "demo123",
        createdAt: new Date().toISOString(),
      },
    ]
  : [];

// Log demo mode status
if (isDemoModeEnabled) {
  console.warn(
    "⚠️ DEMO AUTH ENABLED: Using insecure demo credentials.\n" +
    "This should ONLY be used for local development.\n" +
    "Demo user: demo@william.ai / demo123"
  );
}

// Log warning if no OAuth providers configured in production
if (process.env.NODE_ENV === "production" && 
    !process.env.GOOGLE_CLIENT_ID && 
    !process.env.GITHUB_ID) {
  console.error(
    "🚨 CRITICAL: No OAuth providers configured in production!\n" +
    "Demo credentials are DISABLED in production for security.\n" +
    "Users will NOT be able to authenticate.\n" +
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

      // In production without demo mode, credentials auth is disabled
      if (!isDemoModeEnabled) {
        console.warn(
          "[Auth] Credentials login attempted but demo mode is disabled. " +
          "Use OAuth providers instead."
        );
        return null;
      }

      // Find user in demo users list
      const user = demoUsers.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        return null;
      }

      // Log demo login for audit trail
      console.warn(`[Auth] Demo user login: ${user.email}`);

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
