"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(72),
});
const registerSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2).max(120),
});
const tenantSchema = z.object({
  legalName: z.string().trim().min(2).max(180),
  displayName: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]([a-z0-9-]{1,46}[a-z0-9])?$/),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/registro?error=datos");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) redirect("/registro?error=registro");
  redirect("/login?registered=1");
}

export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/login?error=datos");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect("/login?error=credenciales");
  redirect("/dashboard");
}

export async function createTenantAction(formData: FormData) {
  const parsed = tenantSchema.safeParse({
    legalName: formData.get("legalName"),
    displayName: formData.get("displayName"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) redirect("/dashboard?error=empresa");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("create_tenant_for_current_user", {
    p_legal_name: parsed.data.legalName,
    p_display_name: parsed.data.displayName,
    p_slug: parsed.data.slug,
  });
  if (error) redirect("/dashboard?error=aprovisionamiento");
  redirect("/dashboard?created=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
