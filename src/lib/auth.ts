import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Initialize Prisma client
const prisma = new PrismaClient();

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Compare password with hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate a random token for password reset
export function generateResetToken(): { token: string; expiresAt: Date } {
  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");

  // Set expiration to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { token, expiresAt };
}

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug mode for troubleshooting
  logger: {
    error: (code, metadata) => {
      console.error(`NextAuth error: ${code}`, metadata);
    },
    warn: (code) => {
      console.warn(`NextAuth warning: ${code}`);
    },
    debug: (code, metadata) => {
      console.log(`NextAuth debug: ${code}`, metadata);
    },
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("Authorize function called with credentials:", credentials?.email);

        // Basic validation
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Missing email or password");
        }

        try {
          console.log("Looking up user:", credentials.email);

          // Create a new Prisma client instance for this request
          const localPrisma = new PrismaClient();

          const user = await localPrisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
            },
          });

          await localPrisma.$disconnect();

          if (!user) {
            console.log("User not found");
            throw new Error("Invalid email or password");
          }

          console.log("User found, checking password");
          console.log("Stored password hash:", user.password);
          console.log("Provided password (first few chars):", credentials.password.substring(0, 3) + "...");

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Invalid password");
            throw new Error("Invalid email or password");
          }

          console.log("Authentication successful for user:", user.id);

          // Return user object without password
          const { password, ...userWithoutPassword } = user;
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          // Rethrow the error to be handled by NextAuth
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  callbacks: {
    async session({ session, token }) {
      console.log("Session callback called", { session, token });
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      console.log("JWT callback called", { token, user });
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  // Enable CSRF protection
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production",
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
