import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("author_id, status")
    .eq("id", id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isAuthor = post.author_id === session.user.id;

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (post.status !== "draft" && post.status !== "changes_requested" && !isAdmin) {
    return NextResponse.json(
      { error: "Post can only be edited in draft or changes_requested status" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { title, content, channel_id, platform_id, content_type_id, image_url, publish_date } = body;

  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      content,
      channel_id,
      platform_id,
      content_type_id,
      image_url,
      publish_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
