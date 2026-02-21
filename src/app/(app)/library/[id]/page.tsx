import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostDetailUI from "./ui";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      channels(id, name),
      platforms(id, name),
      content_types(id, name),
      profiles!posts_author_id_fkey(full_name, email)
    `)
    .eq('id', id)
    .single();

  if (!post) notFound();

  const { data: logs } = await supabase
    .from('post_status_log')
    .select('*, profiles(full_name)')
    .eq('post_id', id)
    .order('created_at', { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', post.channel_id)
    .eq('profile_id', user?.id)
    .single();

  const { data: channels } = await supabase.from('channels').select('id, name').order('name');
  const { data: platforms } = await supabase.from('platforms').select('id, name').order('name');
  const { data: contentTypes } = await supabase.from('content_types').select('id, name').order('name');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <PostDetailUI 
        initialPost={post} 
        logs={logs || []} 
        userRole={membership?.role}
        options={{
          channels: channels || [],
          platforms: platforms || [],
          contentTypes: contentTypes || []
        }}
      />
    </div>
  );
}
