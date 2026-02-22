import { createSupabaseServerClient } from '@/lib/supabase/server';
import DashboardUI from './dashboard-ui';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select(`
      *,
      channels(name),
      platforms(name),
      content_types(name),
      profiles!posts_author_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch pending posts
  const { data: pendingPosts } = await supabase
    .from('posts')
    .select(`
      *,
      channels(name),
      platforms(name),
      profiles!posts_author_id_fkey(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch stats
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const { count: draftCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  const { count: pendingCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: publishedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  return (
    <DashboardUI
      recentPosts={recentPosts || []}
      pendingPosts={pendingPosts || []}
      stats={{
        total: totalPosts || 0,
        draft: draftCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        published: publishedCount || 0
      }}
    />
  );
}
