
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytidovmyivmhocawgbda.supabase.co';
const supabaseAnonKey = 'sb_publishable_3EItrBfMJhK-hn8-l6W87w_2h5XXyna';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
