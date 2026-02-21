import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side admin client — never expose service key to the browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
