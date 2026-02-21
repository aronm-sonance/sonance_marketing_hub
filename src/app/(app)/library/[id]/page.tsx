import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostDetailUI from "./ui";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // Fetch post with relations
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(`
      *,
      channel:channels(*),
      platform:platforms(*),
      content_type:content_types(*),
      author:profiles(id, full_name, email)
    `)
    .eq("id", id)
    .single();

  if (postError || !post) notFound();

  // Fetch status history
  const { data: history } = await supabase
    .from("post_status_log")
    .select(`
      *,
      actor:profiles(full_name)
    `)
    .eq("post_id", id)
    .order("created_at", { ascending: false });

  // Fetch meta-data for editing
  const [
    { data: channels },
    { data: platforms },
    { data: contentTypes },
    { data: currentUserProfile },
    { data: membership }
  ] = await Promise.all([
    supabase.from("channels").select("id, name").order("name"),
    supabase.from("platforms").select("id, name").order("name"),
    supabase.from("content_types").select("id, name").order("name"),
    supabase.from("profiles").select("role").eq("id", session.user.id).single(),
    supabase.from("channel_members").select("role").eq("channel_id", post.channel_id).eq("profile_id", session.user.id).maybeSingle()
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <a href="/library" className="text-white/40 hover:text-white text-sm flex items-center mb-4 transition-colors">
          &larr; Back to Library
        </a>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{post.title || "Untitled Post"}</h1>
            <p className="text-white/60">
              Created by {post.author.full_name} on {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-md font-bold uppercase tracking-wider text-xs border ${getStatusStyles(post.status)}`}>
            {post.status.replace("_", " ")}
          </div>
        </div>
      </div>

      <PostDetailUI 
        post={post}
        history={history || []}
        channels={channels || []}
        platforms={platforms || []}
        contentTypes={contentTypes || []}
        userRole={currentUserProfile?.role || "viewer"}
        channelRole={membership?.role || "viewer"}
        currentUserId={session.user.id}
      />
    </div>
  );
}

function getStatusStyles(status: string) {
  switch (status) {
    case "draft": return "bg-white/10 text-white/60 border-white/20";
    case "pending": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    case "changes_requested": return "bg-orange-500/20 text-orange-500 border-orange-500/30";
    case "approved": return "bg-green-500/20 text-green-500 border-green-500/30";
    case "scheduled": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    case "published": return "bg-cyan-500/20 text-cyan-500 border-cyan-500/30";
    default: return "bg-white/5 text-white/40 border-white/10";
  }
}
