import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
    setProfile(data ?? { role: "user", is_seller: false, store_name: null, email_verified_at: null });
  };

  useEffect(() => {
    if (!user) return setProfile(null);
    fetchProfile(user.id);
  }, [user?.id]);

  return {
    user, profile, ready,
    isAdmin: profile?.role === "admin",
    isSeller: !!profile?.is_seller,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}