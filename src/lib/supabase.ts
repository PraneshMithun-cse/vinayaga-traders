import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vunkhbwzmyyzdddnturs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bmtoYnd6bXl5emRkZG50dXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDY3MDIsImV4cCI6MjA5NTEyMjcwMn0.H8t3HruKpWbu_XiRJ1wEr5bUGnVfqMV9G3T-T03WhpE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
