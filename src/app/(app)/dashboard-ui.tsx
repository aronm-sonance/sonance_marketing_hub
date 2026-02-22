'use client';

import Link from 'next/link';

export default function DashboardUI({ recentPosts, pendingPosts, stats }: any) {
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Approved</div>
          <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Published</div>
          <div className="text-3xl font-bold text-cyan-500">{stats.published}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
                    {getStatusBadge(post.status)}
                  </div>
                  <div className="flex gap-4 text-[10px] text-white/40">
                    <span>{post.channels?.name}</span>
                    <span>•</span>
                    <span>{post.platforms?.name}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approval */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest">Pending Approval</h2>
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">{pendingPosts.length}</span>
          </div>
          
          {pendingPosts.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p className="text-sm">No posts pending approval</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPosts.map((post: any) => (
                <Link 
                  key={post.id} 
                  href={`/library/${post.id}`}
                  className="block p-4 bg-black/40 hover:bg-black/60 border border-yellow-500/20 hover:border-yellow-500/40 rounded-md transition-colors"
                >
                  <h3 className="font-medium text-sm line-clamp-1 mb-2">{post.title}</h3>
                  <div className="flex gap-4 text-[10px] text-white/40">
                    <span>{post.channels?.name}</span>
                    <span>•</span>
                    <span>{post.platforms?.name}</span>
                    <span>•</span>
                    <span>{post.profiles?.full_name}</span>
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
