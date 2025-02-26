import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uimmjzuqdqxfqoikcexf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbW1qenVxZHF4ZnFvaWtjZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDA1NTcsImV4cCI6MjA1NTYxNjU1N30.gSdv5Q0seyNiWhjEwXCzKzxYN1TUTFGxOpKUZtF06J0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
