import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uimmjzuqdqxfqoikcexf.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbW1qenVxZHF4ZnFvaWtjZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNDA1NTcsImV4cCI6MjA1NTYxNjU1N30.gSdv5Q0seyNiWhjEwXCzKzxYN1TUTFGxOpKUZtF06J0";

// Create a safe client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Supabase client:", error);
  // Create a mock client with the same interface but no functionality
  supabase = {
    functions: {
      invoke: async () => ({
        data: null,
        error: { message: "Supabase client not available" },
      }),
    },
  };
}

export { supabase };
