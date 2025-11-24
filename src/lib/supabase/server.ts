import { createClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabaseClient?: ReturnType<typeof createClient>;
};

export function getServiceSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  if (!globalForSupabase.supabaseClient) {
    globalForSupabase.supabaseClient = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            'x-application-name': 'adopet-admin',
          },
        },
      }
    );
  }

  return globalForSupabase.supabaseClient;
}
