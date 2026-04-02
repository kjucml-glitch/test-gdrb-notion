import { getSupabaseClient } from "./client";
import type { User } from "@/types";

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

function mapAuthUserToUser(authUser: SupabaseAuthUser): User {
  const metadata = authUser.user_metadata ?? {};
  const now = new Date();

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    displayName:
      (metadata.display_name as string | undefined) ??
      (metadata.full_name as string | undefined) ??
      (authUser.email?.split("@")[0] ?? ""),
    avatar:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      "",
    bio: (metadata.bio as string | undefined) ?? "",
    createdAt: authUser.created_at ? new Date(authUser.created_at) : now,
    updatedAt: now,
  };
}

async function ensureProfile(
  authUser: SupabaseAuthUser,
  displayName?: string
): Promise<void> {
  const metadata = authUser.user_metadata ?? {};

  const profile = {
    id: authUser.id,
    email: authUser.email ?? "",
    display_name:
      displayName ??
      (metadata.display_name as string | undefined) ??
      (metadata.full_name as string | undefined) ??
      "",
    avatar:
      (metadata.avatar_url as string | undefined) ??
      (metadata.picture as string | undefined) ??
      "",
    bio: "",
    updated_at: new Date().toISOString(),
  };

  const { error } = await getSupabaseClient().from("profiles").upsert(profile, { onConflict: "id" });
  if (error) {
    // auth.users trigger가 profile을 자동 생성하므로 RLS 오류는 무시
    console.warn("Profile upsert skipped (trigger will handle):", error.message);
  }
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<SupabaseAuthUser> {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("회원가입 처리에 실패했습니다.");
  }

  await ensureProfile(data.user, displayName);
  return data.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<SupabaseAuthUser> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("로그인 처리에 실패했습니다.");
  }

  await ensureProfile(data.user);
  return data.user;
}

export async function loginWithGoogle(): Promise<void> {
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;
  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function logoutUser(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export function onAuthChange(callback: (user: SupabaseAuthUser | null) => void) {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_: unknown, session: { user: SupabaseAuthUser | null } | null) => {
      callback(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data }: { data: { user: SupabaseAuthUser | null } }) => {
      callback(data.user ?? null);
    });

    return () => subscription.unsubscribe();
  } catch {
    callback(null);
    return () => {};
  }
}

export function supabaseUserToUser(authUser: SupabaseAuthUser): User {
  return mapAuthUserToUser(authUser);
}
