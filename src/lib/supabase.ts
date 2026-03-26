import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhoisyafyyemjxkpwaut.supabase.co';
// Anon (public) key only — safe to include in frontend
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZob2lzeWFmeXllbWp4a3B3YXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjczNjksImV4cCI6MjA5MDEwMzM2OX0.ive5lHM9sQixu8ZHqEEzLLBvEKvmxSxFCI4pwT4i1wY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
