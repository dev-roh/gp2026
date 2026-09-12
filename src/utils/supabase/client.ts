import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  const url = (supabaseUrl && !supabaseUrl.includes('[SENSITIVE]')) ? supabaseUrl : 'https://example.supabase.co';
  const key = (supabaseKey && !supabaseKey.includes('[SENSITIVE]')) ? supabaseKey : 'mock-key';
  return createBrowserClient(url, key);
};
