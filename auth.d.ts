import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session extends DefaultSession {
    user: {
      accessToken?: string;
      refreshToken?: string;
    } & DefaultSession["user"];
  }
}
