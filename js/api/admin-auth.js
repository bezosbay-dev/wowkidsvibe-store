// Admin auth — thin wrapper around Supabase auth that locks the dashboard
// down to a single allowlisted email. Real enforcement is the RLS policy on
// the server (`auth.jwt() ->> 'email' = 'bezosbay@gmail.com'`); this is just
// the client-side gate.

import { getSupabase } from './supabase-client.js';
import { ADMIN_EMAIL } from '../supabase-config.js';

export async function signIn(email, password) {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data?.user || data.user.email !== ADMIN_EMAIL) {
    await supabase.auth.signOut();
    throw new Error('Not authorized');
  }
  return data.user;
}

export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function isAdmin() {
  const session = await getSession();
  return !!(session && session.user && session.user.email === ADMIN_EMAIL);
}
