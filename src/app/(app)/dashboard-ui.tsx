'use client';

import Link from 'next/link';

function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return Math.floor(seconds) + 's ago';
}

export default function DashboardUI({ recentPosts, pendingPosts, myTasks, recentActivity, userId, userRole, stats }: any) {
  const getStatusBadge = (status: string) => {
    const colors: any = {
      draft: 'bg-white/20 text-white',
      pending: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50',
      changes_requested: 'bg-orange-500/20 text-orange-500 border border-orange-500/50',
      approved: 'bg-green-500/20 text-green-500 border border-green-500/50',
      scheduled: 'bg-blue-500/20 text-blue-500 border border-blue-500/50',
      published: 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50',
    };
    return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${colors[status]}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/40 mt-1">Welcome to Sonance Marketing Hub</p>
        </div>
        <Link href="/library/new" className="bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-white/90 transition-colors">
          Create Post
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Total Posts</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Draft</div>
          <div className="text-3xl font-bold text-white/60">{stats.draft}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Pending</div>
          <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Changes</div>
          <div className="text-3xl font-bold text-orange-500">{stats.changes_requested || 0}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Approved</div>
          <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Published</div>
          <div className="text-3xl font-bold text-cyan-500">{stats.published}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Tasks */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest">My Tasks</h2>
            <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded">{myTasks?.length || 0}</span>
          </div>
          
          {!myTasks || myTasks.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((post: any) => (
                <Link 
                  key={post.id} 
                  href={`/library/${post.id}`}
                  className="block p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-medium text-sm line-clamp-1 flex-1">{post.title}</h3>
                    {getStatusBadge(post.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: post.channels?.color || '#888' }}
                    />
                    <span>{post.channels?.name}</span>
                    <span>•</span>
                    <span>{post.platforms?.name}</span>
                    <span>•</span>
                    <span>{timeAgo(post.updated_at || post.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest">Recent Activity</h2>
          </div>
          
          {!recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="relative pl-4 border-l-2 border-white/10">
                  <div 
                    className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-black"
                    style={{ 
                      backgroundColor: 
                        log.to_status === 'published' ? '#06b6d4' :
                        log.to_status === 'approved' ? '#22c55e' :
                        log.to_status === 'pending' ? '#eab308' :
                        log.to_status === 'changes_requested' ? '#f97316' :
                        '#888'
                    }}
                  />
                  <div className="pb-3">
                    <div className="text-xs text-white/80 mb-1">
                      <span className="font-medium">{log.profiles?.full_name || 'User'}</span>
                      <span className="text-white/40"> moved </span>
                      {log.posts?.title && (
                        <Link 
                          href={`/library/${log.post_id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {log.posts.title}
                        </Link>
                      )}
                      <span className="text-white/40"> to </span>
                      <span className="font-medium">{log.to_status.replace('_', ' ')}</span>
                    </div>
                    <div className="text-[10px] text-white/30">{timeAgo(log.created_at)}</div>
                    {log.comment && (
                      <div className="mt-2 text-[11px] text-white/60 italic">
                        "{log.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest">Recent Posts</h2>
            <Link href="/library" className="text-xs text-blue-400 hover:text-blue-300">View All →</Link>
          </div>
          
          {recentPosts.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p className="text-sm">No posts yet</p>
              <Link href="/library/new" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post: any) => (
                <Link 
                  key={post.id} 
                  href={`/library/${post.id}`}
                  className="block p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h3 className="font-medium text-sm line-clamp-1 flex-1">{post.title}</h3>
                    {getStatusBadge(post.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: post.channels?.color || '#888' }}
                    />
                    <span>{post.channels?.name}</span>
                    <span>•</span>
                    <span>{post.platforms?.name}</span>
                    <span>•</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-md">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/library/new" className="p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors text-center">
            <div className="text-2xl mb-2">✏️</div>
            <div className="text-sm font-medium">Create Post</div>
          </Link>
          <Link href="/library?status=draft" className="p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors text-center">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium">View Drafts</div>
          </Link>
          <Link href="/library?status=pending" className="p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors text-center">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm font-medium">Review Queue</div>
          </Link>
          <Link href="/admin/channels" className="p-4 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 rounded-md transition-colors text-center">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm font-medium">Settings</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
