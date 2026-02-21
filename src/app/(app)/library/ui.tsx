"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  channel: { name: string };
  platform: { name: string };
  author: { full_name: string };
}

export default function LibraryUI({ 
  initialChannels, 
  initialPlatforms,
  initialContentTypes 
}: { 
  initialChannels: any[];
  initialPlatforms: any[];
  initialContentTypes: any[];
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    channel_id: "",
    platform_id: "",
    q: "",
    page: 1
  });
  const [total, setTotal] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: filters.status,
      channel_id: filters.channel_id,
      platform_id: filters.platform_id,
      q: filters.q,
      page: filters.page.toString(),
      limit: "12"
    });

    try {
      const res = await fetch(`/api/posts?${params.toString()}`);
      const result = await res.json();
      if (result.data) {
        setPosts(result.data);
        setTotal(result.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters.status, filters.channel_id, filters.platform_id, filters.page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchPosts();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-white/20 text-white";
      case "pending": return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
      case "changes_requested": return "bg-orange-500/20 text-orange-500 border border-orange-500/30";
      case "approved": return "bg-green-500/20 text-green-500 border border-green-500/30";
      case "scheduled": return "bg-blue-500/20 text-blue-500 border border-blue-500/30";
      case "published": return "bg-cyan-500/20 text-cyan-500 border border-cyan-500/30";
      default: return "bg-white/10 text-white/60";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white/5 p-4 rounded-md border border-white/10">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-white/40 uppercase mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full bg-black border border-white/10 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:border-white/20 transition-colors"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </form>

        <div className="w-40">
          <label className="block text-xs font-medium text-white/40 uppercase mb-1">Status</label>
          <select
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="w-48">
          <label className="block text-xs font-medium text-white/40 uppercase mb-1">Channel</label>
          <select
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={filters.channel_id}
            onChange={(e) => setFilters({ ...filters, channel_id: e.target.value, page: 1 })}
          >
            <option value="">All Channels</option>
            {initialChannels.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="block text-xs font-medium text-white/40 uppercase mb-1">Platform</label>
          <select
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={filters.platform_id}
            onChange={(e) => setFilters({ ...filters, platform_id: e.target.value, page: 1 })}
          >
            <option value="">All Platforms</option>
            {initialPlatforms.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-md h-48 animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/library/${post.id}`}
                className="bg-white/5 border border-white/10 rounded-md p-5 hover:bg-white/10 hover:border-white/20 transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${getStatusColor(post.status)}`}>
                    {post.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">
                    {post.platform.name}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-white transition-colors">
                  {post.title || "Untitled Post"}
                </h3>
                
                <p className="text-white/60 text-sm line-clamp-3 mb-6 flex-grow">
                  {post.content}
                </p>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
                  <div className="flex items-center text-xs text-white/40">
                    <Filter className="w-3 h-3 mr-2" />
                    {post.channel.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-white/40">
                      <User className="w-3 h-3 mr-2" />
                      {post.author.full_name}
                    </div>
                    <div className="flex items-center text-[10px] text-white/20">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 pt-8">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="p-2 rounded-md border border-white/10 disabled:opacity-20 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-white/60">
              Page {filters.page} of {Math.ceil(total / 12) || 1}
            </span>
            <button
              disabled={filters.page >= Math.ceil(total / 12)}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="p-2 rounded-md border border-white/10 disabled:opacity-20 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-md p-12 text-center">
          <p className="text-white/40 italic">No posts found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
