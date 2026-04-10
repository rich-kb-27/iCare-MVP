import { supabase } from "./supabase";

export async function signupBase(
  email: string,
  password: string,
  role: "user" | "freelancer" | "facility",
  profileData: Record<string, any>
) {
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  // Use UPSERT instead of UPDATE to prevent race conditions with the trigger
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id, // Explicitly provide the ID
      email: email.toLowerCase(),
      role,
      ...profileData,
    }, { onConflict: 'id' });

  if (profileError) throw profileError;

  return data.user.id;
}
