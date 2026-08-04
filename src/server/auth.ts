import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { type DefaultSession } from "next-auth";
import { db } from "~/server/db";

/**
 * Module augmentation untuk next-auth. Menambahkan `id` ke Session.user
 * supaya seluruh aplikasi dapat mengaksesnya secara type-safe.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login", // Mengarahkan NextAuth ke form login custom Anda
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error("Email dan password wajib diisi");
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) {
          throw new Error("User tidak ditemukan atau password salah");
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("User tidak ditemukan atau password salah");
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

export const getSession = auth;
export const getServerAuthSession = auth;