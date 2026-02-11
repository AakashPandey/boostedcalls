import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type JwtPayload = {
  exp?: number;
};

function decodeJwt(token: string): JwtPayload {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return {};
  }
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await res.json();
  return {
    accessToken: data.access as string,
    refreshToken: (data.refresh as string | undefined) ?? refreshToken,
  };
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password required");
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const contentType = res.headers.get("content-type");
            let errorMessage = "Invalid credentials";
            
            if (contentType?.includes("application/json")) {
              try {
                const error = await res.json();
                errorMessage = error.message || errorMessage;
              } catch (e) {
                errorMessage = `Server error (${res.status})`;
              }
            } else {
              errorMessage = `Server error (${res.status})`;
            }
            throw new Error(errorMessage);
          }

          const data = await res.json();
          const decoded = decodeJwt(data.access);
          const accessTokenExpires = decoded.exp ? decoded.exp * 1000 : Date.now() + 5 * 60 * 1000;

          return {
            id: credentials.username as string,
            email: credentials.username as string,
            name: credentials.username as string,
            accessToken: data.access,
            refreshToken: data.refresh,
            accessTokenExpires,
          } as any;
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        return token;
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires - 60_000) {
        return token;
      }

      if (!token.refreshToken) {
        token.error = "NoRefreshToken";
        return token;
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken);
        const decoded = decodeJwt(refreshed.accessToken);
        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.accessTokenExpires = decoded.exp ? decoded.exp * 1000 : Date.now() + 5 * 60 * 1000;
        token.error = undefined;
      } catch {
        token.error = "RefreshAccessTokenError";
      }

      return token;
    },
    async session({ session, token }: any) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
