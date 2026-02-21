'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PostDetailUI({ initialPost, logs, userRole, options }: any) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    if (res.ok) {
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  };

  const transition = async (to_status: string) => {
    if (to_status === 'changes_requested' && !comment) {
      alert('Please provide a comment when requesting changes.');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/posts/${post.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to_status, comment })
    });
    if (res.ok) {
      setComment('');
      router.refresh();
      // Simple reload to show new status/logs
      window.location.reload();
    }
    setLoading(false);
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Content & Edit */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/library" className="text-white/40 hover:text-white text-sm">← Back</Link>
          {getStatusBadge(post.status)}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-md">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Title</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none"
                value={post.title}
                onChange={e => setPost({...post, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Content</label>
              <textarea 
                rows={10}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none"
                value={post.content}
                onChange={e => setPost({...post, content: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Channel</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" value={post.channel_id} onChange={e => setPost({...post, channel_id: e.target.value})}>
                  {options.channels.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Platform</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" value={post.platform_id} onChange={e => setPost({...post, platform_id: e.target.value})}>
                  {options.platforms.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Image URL</label>
              <input 
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none"
                value={post.image_url || ''}
                onChange={e => setPost({...post, image_url: e.target.value})}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-white/60">Cancel</button>
              <button type="submit" disabled={loading} className="bg-white text-black px-6 py-2 rounded-md text-sm font-bold">Save Changes</button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{post.title}</h1>
              <button onClick={() => setIsEditing(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium">Edit Post</button>
            </div>
            
            {post.image_url && (
              <div className="aspect-video w-full rounded-md overflow-hidden bg-white/5 border border-white/10">
                <img src={post.image_url} alt={post.title} className="w-full h-full object-contain" />
              </div>
            )}

            <div className="bg-white/5 border border-white/10 p-6 rounded-md">
              <p className="whitespace-pre-wrap text-white/80 leading-relaxed">{post.content}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-3 rounded-md border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Channel</div>
                <div className="text-sm font-medium">{post.channels?.name}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-md border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Platform</div>
                <div className="text-sm font-medium">{post.platforms?.name}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-md border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Type</div>
                <div className="text-sm font-medium">{post.content_types?.name}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-md border border-white/5">
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Author</div>
                <div className="text-sm font-medium">{post.profiles?.full_name || 'System'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions & History */}
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Workflow Actions</h2>
          
          <div className="space-y-3">
            {post.status === 'draft' && (
              <button onClick={() => transition('pending')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md text-sm font-bold transition-colors">Submit for Review</button>
            )}
            
            {(userRole === 'approver' || userRole === 'creator') && post.status === 'pending' && (
              <>
                <button onClick={() => transition('approved')} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-md text-sm font-bold transition-colors">Approve</button>
                <div className="pt-2">
                  <textarea 
                    placeholder="Comments for changes..."
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs mb-2 focus:outline-none"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button onClick={() => transition('changes_requested')} disabled={loading} className="w-full border border-orange-500/50 text-orange-500 hover:bg-orange-500/10 py-2 rounded-md text-sm font-bold transition-colors">Request Changes</button>
                </div>
              </>
            )}

            {(userRole === 'approver' || userRole === 'creator') && post.status === 'approved' && (
              <button onClick={() => transition('published')} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-md text-sm font-bold transition-colors">Publish Now</button>
            )}

            {post.status === 'changes_requested' && (
              <button onClick={() => transition('pending')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md text-sm font-bold transition-colors">Resubmit for Review</button>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-md">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4">History</h2>
          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {logs.length === 0 ? (
              <div className="text-xs text-white/30 italic ml-6">No history yet</div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="relative ml-6">
                  <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-white/20 border border-black shadow-[0_0_0_2px_rgba(255,255,255,0.05)]"></div>
                  <div className="text-[10px] text-white/40 mb-1 flex justify-between">
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white/80">{log.profiles?.full_name || 'User'}</span>
                    <span className="text-white/40 mx-1">moved to</span>
                    <span className="text-blue-400 font-medium">{log.to_status.replace('_', ' ')}</span>
                  </div>
                  {log.comment && (
                    <div className="mt-2 p-2 bg-black/40 rounded border border-white/5 text-[11px] text-white/60 italic">
                      "{log.comment}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
