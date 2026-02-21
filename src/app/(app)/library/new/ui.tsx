"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePostUI({ 
  channels, 
  platforms, 
  contentTypes 
}: { 
  channels: any[]; 
  platforms: any[]; 
  contentTypes: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    channel_id: channels[0]?.id || "",
    platform_id: platforms[0]?.id || "",
    content_type_id: contentTypes[0]?.id || "",
    image_url: "",
    publish_date: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");

      router.push(`/library/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-500 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Title</label>
        <input
          type="text"
          required
          className="w-full bg-black border border-white/10 rounded-md py-2 px-4 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="Enter post title..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Channel</label>
          <select
            required
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={formData.channel_id}
            onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
          >
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Platform</label>
          <select
            required
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={formData.platform_id}
            onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
          >
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Content Type</label>
          <select
            required
            className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
            value={formData.content_type_id}
            onChange={(e) => setFormData({ ...formData, content_type_id: e.target.value })}
          >
            {contentTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Content</label>
        <textarea
          required
          rows={10}
          className="w-full bg-black border border-white/10 rounded-md py-2 px-4 focus:outline-none focus:border-white/20 transition-colors resize-none"
          placeholder="Write your post content here..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/40 uppercase mb-1 tracking-wider">Image URL (Optional)</label>
        <input
          type="url"
          className="w-full bg-black border border-white/10 rounded-md py-2 px-4 focus:outline-none focus:border-white/20 transition-colors"
          placeholder="https://example.com/image.jpg"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
        />
      </div>

      <div className="pt-6 border-t border-white/10 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-8 py-2 rounded-md font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Post"}
        </button>
      </div>
    </form>
  );
}
