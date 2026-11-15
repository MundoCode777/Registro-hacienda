import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY en el archivo .env');
}

export const supabase = createClient(url, key);