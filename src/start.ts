import { createStart } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const startInstance = createStart(() => ({
  serverFns: {
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);

      if (typeof window !== "undefined" && !headers.has("authorization")) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          headers.set("authorization", `Bearer ${session.access_token}`);
        }
      }

      return fetch(input, {
        ...init,
        headers,
      });
    },
  },
}));