import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://zgkljxesvngwjajpdohw.supabase.co";


const supabaseKey = "sb_publishable_dO-prLd1Vf2oH_dplqOyXQ_WjR6JBcu";


export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);