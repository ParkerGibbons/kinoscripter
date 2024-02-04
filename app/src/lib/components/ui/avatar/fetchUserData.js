import { supabase } from '$lib/supabaseClient';

function fetchUserData() {
    const currentUserId = supabase.auth.getUser
  return supabase.from("users").select("id, initials, profile_image_url").eq("id", userId).single();
}

export { fetchUserData };