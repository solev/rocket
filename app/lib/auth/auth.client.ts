import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
  // client config if needed
  baseURL: "http://localhost:5173",
  plugins: [polarClient()],
});
