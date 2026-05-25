const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
global.WebSocket = require('ws');
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAuth() {
  console.log("Clearing wa_auth...");
  const { error } = await supabase.from('wa_auth').delete().neq('id', '__none__');
  if (error) {
    console.error("Error clearing auth:", error);
  } else {
    console.log("Auth cleared successfully.");
  }
}

clearAuth();
