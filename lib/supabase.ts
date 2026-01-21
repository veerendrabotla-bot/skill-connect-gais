
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = 'https://xbguzcnzpoteuthohtzq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZ3V6Y256cG90ZXV0aG9odHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODUxODgsImV4cCI6MjA4NDU2MTE4OH0.9Q1MWqZveVXy6SWL2Ps1b7RxDRVrH0unel2EQ7ShSH0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
