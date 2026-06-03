import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bkujciownpxmsgipiomv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWpjaW93bnB4bXNnaXBpb212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjAxNDIsImV4cCI6MjA5NTY5NjE0Mn0.PqRWfAfGtV7tbLI37gEDt3N_Qu0_M0gqpTKMAvD1h8Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
