import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResend, getFromAddress } from "@/lib/email/resend";

const BodySchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
  role: z.enum(["admin", "brand-marketer", "channel-lead", "creator", "viewer"]).default("viewer"),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.reason }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, fullName, role } = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  // Create user (or fetch existing)
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (createErr && !createErr.message.toLowerCase().includes("already")) {
    return NextResponse.json({ error: "create_user_failed", message: createErr.message }, { status: 500 });
  }

  let userId = created?.user?.id;
  if (!userId) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    userId = found?.id;
  }

  if (!userId) return NextResponse.json({ error: "user_not_found_after_create" }, { status: 500 });

  // Upsert profile
  const { error: upsertErr } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, email, full_name: fullName ?? null, role, status: "active" }, { onConflict: "id" });
  if (upsertErr) {
    return NextResponse.json({ error: "profile_upsert_failed", message: upsertErr.message }, { status: 500 });
  }

  // Invite email: generate password reset link (acts as set-password flow)
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: "invite_link_failed", message: linkErr?.message }, { status: 500 });
  }

  const actionLink = linkData.properties.action_link;

  const resend = getResend();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: "You’ve been invited to Sonance Marketing Hub",
    html: `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
        <h2>Sonance Marketing Hub</h2>
        <p>You’ve been invited. Set your password using the link below:</p>
        <p><a href="${actionLink}">Set password</a></p>
        <p style="color:#666;font-size:12px">If you weren’t expecting this, you can ignore this email.</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, userId });
}
