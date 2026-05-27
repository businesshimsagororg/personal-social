import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, addUser, verifyPassword } from "@/lib/userUtils";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const user = await findUserByEmail(credentials.email);
        if (user && (await verifyPassword(credentials.password, user.hashedPassword))) {
          return { id: user.id, name: user.name, email: user.email };
        }
        // If not found, create a new user (sign‑up flow)
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(credentials.password, 10);
        const newUser = {
          id: Date.now().toString(),
          name: credentials.email.split("@")[0],
          email: credentials.email,
          hashedPassword: hashed,
        };
        await addUser(newUser);
        return { id: newUser.id, name: newUser.name, email: newUser.email };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // Attach user id to session
      if (token && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
