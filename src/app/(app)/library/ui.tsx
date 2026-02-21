'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostsUIProps {
  initialChannels: any[];
  initialPlatforms: any[];
}

export default function PostsUI({ initialChannels, initialPlatforms }: PostsUIProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    channel_id: '',
    platform_id: '',
    search: ''
  });

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.channel_id) params.append('channel_id', filters.channel_id);
    if (filters.platform_id) params.append('platform_id', filters.platform_id);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filters.status, filters.channel_id, filters.platform_id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-white/20 text-white';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50';
      case 'changes_requested': return 'bg-orange-500/20 text-orange-500 border border-orange-500/50';
      case 'approved': return 'bg-green-500/20 text-green-500 border border-green-500/50';
      case 'scheduled': return 'bg-blue-500/20 text-blue-500 border border-blue-500/50';
      case 'published': return 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50';
      default: return 'bg-white/10 text-white/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Search</label>
          <input 
            type="text" 
            placeholder="Search by title..."
            className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && fetchPosts()}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Status</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Channel</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
            value={filters.channel_id}
            onChange={(e) => setFilters(f => ({ ...f, channel_id: e.target.value }))}
          >
            <option value="">All Channels</option>
            {initialChannels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Link 
          href="/library/new"
          className="bg-white text-black px-6 py-2 rounded-md text-sm font-semibold hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          Create Post
        </Link>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="py-20 text-center text-white/40">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center bg-white/5 border border-white/10 rounded-md">
          <p className="text-white/40">No posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              href={`/library/${post.id}`}
              className="group bg-white/5 border border-white/10 rounded-md overflow-hidden hover:border-white/20 transition-all"
            >
              {post.image_url ? (
                <div className="aspect-video w-full bg-black relative">
                  <img src={post.image_url} alt={post.title} className="object-cover w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="aspect-video w-full bg-white/5 flex items-center justify-center text-white/10 font-bold text-2xl italic">
                  NO IMAGE
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getStatusColor(post.status)}`}>
                    {post.status.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">
                    {post.platforms?.name}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{post.title}</h3>
                <p className="text-white/60 text-xs line-clamp-2 mb-4 h-8">{post.content}</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
                  <span>{post.channels?.name}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
