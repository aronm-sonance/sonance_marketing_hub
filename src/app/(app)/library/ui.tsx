'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostsUIProps {
  initialChannels: any[];
  initialPlatforms: any[];
  userId?: string;
  userRole?: string;
}

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

export default function PostsUI({ initialChannels, initialPlatforms, userId, userRole }: PostsUIProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filters, setFilters] = useState({
    status: '',
    channel_id: '',
    platform_id: '',
    search: '',
    author_id: ''
  });

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.channel_id) params.append('channel_id', filters.channel_id);
    if (filters.platform_id) params.append('platform_id', filters.platform_id);
    if (filters.search) params.append('search', filters.search);
    if (filters.author_id) params.append('author_id', filters.author_id);

    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filters.status, filters.channel_id, filters.platform_id, filters.author_id]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'all':
        setFilters({ status: '', channel_id: '', platform_id: '', search: '', author_id: '' });
        break;
      case 'my-drafts':
        setFilters({ status: 'draft', channel_id: '', platform_id: '', search: '', author_id: userId || '' });
        break;
      case 'pending':
        setFilters({ status: 'pending', channel_id: '', platform_id: '', search: '', author_id: '' });
        break;
      case 'changes':
        setFilters({ status: 'changes_requested', channel_id: '', platform_id: '', search: '', author_id: '' });
        break;
      case 'approved':
        setFilters({ status: 'approved', channel_id: '', platform_id: '', search: '', author_id: '' });
        break;
      case 'published':
        setFilters({ status: 'published', channel_id: '', platform_id: '', search: '', author_id: '' });
        break;
    }
  };

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
      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-4">
        <button
          onClick={() => handleTabClick('all')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'all' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          All
        </button>
        <button
          onClick={() => handleTabClick('my-drafts')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'my-drafts' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          My Drafts
        </button>
        <button
          onClick={() => handleTabClick('pending')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'pending' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => handleTabClick('changes')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'changes' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Needs Changes
        </button>
        <button
          onClick={() => handleTabClick('approved')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'approved' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => handleTabClick('published')}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'published' 
              ? 'text-white border-b-2 border-white' 
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Published
        </button>
      </div>

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
            <div 
              key={post.id} 
              className="group relative bg-white/5 border border-white/10 rounded-md overflow-hidden hover:border-white/20 transition-all"
            >
              <Link href={`/library/${post.id}`}>
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
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: post.channels?.color || '#888' }}
                      />
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">{post.channels?.name}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{timeAgo(post.updated_at || post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                      {(post.profiles?.full_name || 'U')[0]}
                    </div>
                    <span className="text-[10px] text-white/40">{post.profiles?.full_name || 'Unknown'}</span>
                  </div>
                </div>
              </Link>

              {/* Quick Actions - Show on hover */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Link 
                  href={`/library/${post.id}`}
                  className="bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-sm"
                >
                  View
                </Link>
                {post.author_id === userId && (
                  <Link 
                    href={`/library/${post.id}?edit=true`}
                    className="bg-blue-500/80 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-sm"
                  >
                    Edit
                  </Link>
                )}
                {userRole === 'approver' && post.status === 'pending' && post.author_id !== userId && (
                  <Link 
                    href={`/library/${post.id}?action=approve`}
                    className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-sm"
                  >
                    Approve
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
