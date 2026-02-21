import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const channel_id = searchParams.get("channel_id");
  const platform_id = searchParams.get("platform_id");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      channel:channels(name),
      platform:platforms(name),
      author:profiles(full_name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (channel_id) query = query.eq("channel_id", channel_id);
  if (platform_id) query = query.eq("platform_id", platform_id);
  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      total: count,
      page,
      limit,
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    content,
    channel_id,
    platform_id,
    content_type_id,
    image_url,
    publish_date,
  } = body;

  // Validate user is creator or approver of the channel
  const { data: membership, error: memberError } = await supabase
    .from("channel_members")
    .select("role")
    .eq("channel_id", channel_id)
    .eq("profile_id", session.user.id)
    .single();

  if (memberError || (membership.role !== "creator" && membership.role !== "approver")) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to post to this channel" },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      channel_id,
      platform_id,
      content_type_id,
      image_url,
      publish_date,
      author_id: session.user.id,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
