import { createSupabaseServerClient } from '@/lib/supabase/server';
import DashboardUI from './dashboard-ui';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();
  
  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select(`
      *,
      channels(name, color),
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
      channels(name, color),
      platforms(name),
      profiles!posts_author_id_fkey(full_name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Fetch MY TASKS: posts where user needs to act
  let myTasks: any[] = [];
  
  if (profile?.role === 'approver') {
    // Approvers: pending posts from others
    const { data: tasksToApprove } = await supabase
      .from('posts')
      .select(`
        *,
        channels(name, color),
        platforms(name),
        profiles!posts_author_id_fkey(full_name)
      `)
      .eq('status', 'pending')
      .neq('author_id', user?.id)
      .order('created_at', { ascending: false });
    myTasks = tasksToApprove || [];
  }
  
  // Add changes_requested posts authored by current user
  const { data: myChangesRequested } = await supabase
    .from('posts')
    .select(`
      *,
      channels(name, color),
      platforms(name),
      profiles!posts_author_id_fkey(full_name)
    `)
    .eq('status', 'changes_requested')
    .eq('author_id', user?.id)
    .order('created_at', { ascending: false });
  
  myTasks = [...myTasks, ...(myChangesRequested || [])];

  // Fetch RECENT ACTIVITY: post_status_log entries
  const { data: recentActivity } = await supabase
    .from('post_status_log')
    .select(`
      *,
      posts(id, title, channels(name, color)),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

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

  const { count: changesRequestedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'changes_requested');

  return (
    <DashboardUI
      recentPosts={recentPosts || []}
      pendingPosts={pendingPosts || []}
      myTasks={myTasks}
      recentActivity={recentActivity || []}
      userId={user?.id}
      userRole={profile?.role}
      stats={{
        total: totalPosts || 0,
        draft: draftCount || 0,
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        published: publishedCount || 0,
        changes_requested: changesRequestedCount || 0
      }}
    />
  );
}
