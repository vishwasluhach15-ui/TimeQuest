"use client";
// Abhi real login/auth nahi hai (Phase 3+ me aayega). Yeh ek anonymous
// player row banata hai aur uska id localStorage me save kar deta hai,
// taaki same browser me progress persist rahe.
import { supabase } from "./supabase/client";

const STORAGE_KEY = "timequest_player_id";

export async function getOrCreatePlayerId(): Promise<string> {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const guestName = `Explorer-${Math.floor(Math.random() * 10000)}`;
  const { data, error } = await supabase
    .from("players")
    .insert({ display_name: guestName })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not create player: ${error?.message ?? "unknown error"}`);
  }

  localStorage.setItem(STORAGE_KEY, data.id);
  return data.id;
}
