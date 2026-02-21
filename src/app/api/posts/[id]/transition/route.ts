import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResend, getFromAddress } from "@/lib/email/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to_status, comment } = await req.json();

  // Get current post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*, channel:channels(name)")
    .eq("id", id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const from_status = post.status;

  // Check permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const { data: membership } = await supabase
    .from("channel_members")
    .select("role")
    .eq("channel_id", post.channel_id)
    .eq("profile_id", session.user.id)
    .maybeSingle();

  const isAuthor = post.author_id === session.user.id;
  const isApprover = membership?.role === "approver" || membership?.role === "creator"; // creators are often also approvers in small teams, but the requirement said creator can submit for review. Let's stick to explicit role.

  let allowed = isAdmin;

  if (!allowed) {
    if (from_status === "draft" && to_status === "pending") {
      allowed = isAuthor;
    } else if (from_status === "pending" && (to_status === "approved" || to_status === "changes_requested")) {
      allowed = membership?.role === "approver";
    } else if (from_status === "changes_requested" && to_status === "pending") {
      allowed = isAuthor;
    } else if (from_status === "approved" && to_status === "scheduled") {
      allowed = true; // Anyone in channel? Requirement said admin can do any. Usually author or approver.
    } else if (from_status === "scheduled" && to_status === "published") {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed to perform this transition" }, { status: 403 });
  }

  // Use admin client for system-level updates like logs and notifications
  const adminClient = createSupabaseAdminClient();

  // Update post status
  const { error: updateError } = await adminClient
    .from("posts")
    .update({ status: to_status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log status change
  await adminClient.from("post_status_log").insert({
    post_id: id,
    from_status,
    to_status,
    changed_by: session.user.id,
    comment,
  });

  // Notifications
  const notifications: any[] = [];
  const resend = getResend();
  const from = getFromAddress();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const postUrl = `${baseUrl}/library/${id}`;

  if (from_status === "draft" && to_status === "pending") {
    // Notify channel approvers
    const { data: approvers } = await adminClient
      .from("channel_members")
      .select("profile:profiles(id, email, full_name)")
      .eq("channel_id", post.channel_id)
      .eq("role", "approver");

    approvers?.forEach((a: any) => {
      notifications.push({
        recipient_id: a.profile.id,
        type: "post_submitted",
        title: "New post submitted for review",
        body: `Post "${post.title}" in channel ${post.channel.name} is pending review.`,
        post_id: id,
        email: a.profile.email,
      });
    });
  } else if (to_status === "approved" || to_status === "changes_requested") {
    // Notify author
    const { data: author } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("id", post.author_id)
      .single();

    if (author) {
      notifications.push({
        recipient_id: author.id,
        type: to_status === "approved" ? "post_approved" : "post_changes_requested",
        title: to_status === "approved" ? "Your post was approved" : "Changes requested on your post",
        body: to_status === "approved" 
          ? `Your post "${post.title}" has been approved.` 
          : `Changes were requested on "${post.title}". Comment: ${comment || "No comment provided."}`,
        post_id: id,
        email: author.email,
      });
    }
  } else if (to_status === "published") {
    // Notify all channel members
    const { data: members } = await adminClient
      .from("channel_members")
      .select("profile:profiles(id, email)")
      .eq("channel_id", post.channel_id);

    members?.forEach((m: any) => {
      notifications.push({
        recipient_id: m.profile.id,
        type: "post_published",
        title: "New content published",
        body: `New content "${post.title}" has been published in channel ${post.channel.name}.`,
        post_id: id,
        email: m.profile.email,
      });
    });
  }

  // Save notifications and send emails
  for (const n of notifications) {
    const { email, ...notifData } = n;
    
    const { data: savedNotif } = await adminClient
      .from("notifications")
      .insert(notifData)
      .select()
      .single();

    if (email && savedNotif) {
      try {
        await resend.emails.send({
          from,
          to: email,
          subject: n.title,
          html: `<p>${n.body}</p><p><a href="${postUrl}">View post</a></p>`,
        });
        
        await adminClient
          .from("notifications")
          .update({ emailed: true })
          .eq("id", savedNotif.id);
      } catch (err) {
        console.error("Failed to send email notification", err);
      }
    }
  }

  return NextResponse.json({ success: true });
}
