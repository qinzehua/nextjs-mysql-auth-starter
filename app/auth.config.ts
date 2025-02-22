import { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized: async ({ auth, request: { nextUrl, cookies } }) => {
      let isOnDashboard = nextUrl.pathname.startsWith("/protected");
      const searchParams = nextUrl.searchParams;
      const jwt = cookies.get("jwt")?.value || searchParams.get("jwt");

      if (isOnDashboard) {
        if (!jwt) {
          return false;
        }
        try {
          const response = await fetch("http://localhost:8080/users", {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          });
          const authData = await response.json();
          if (authData) {
            if (!cookies.get("jwt")?.value) {
              const newResponse = NextResponse.next();
              newResponse.cookies.set("jwt", jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7,
              });
              return newResponse;
            }

            if (cookies.get("jwt")?.value && searchParams.get("jwt")) {
              return Response.redirect(new URL(nextUrl.pathname, nextUrl));
            }

            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.error("Error validating JWT:", error);
          return false;
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
