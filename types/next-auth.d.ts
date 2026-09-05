import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      language: string;
    } & DefaultSession["user"];
  }

  interface User {
    language?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    language: string;
  }
}
