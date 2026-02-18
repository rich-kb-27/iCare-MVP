import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zrqbhotefdxmzbejchsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycWJob3RlZmR4bXpiZWpjaHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzkyMzMsImV4cCI6MjA4NTk1NTIzM30.E7ZC21EeVbfrCYLoYx7dd842_ae4EkdZROJARbOjcN0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
