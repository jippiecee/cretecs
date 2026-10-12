import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
// null = mode demo (produk lokal, tanpa login/order)
export const supabase = url && key ? createClient(url, key) : null;
