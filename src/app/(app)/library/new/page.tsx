import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: channels } = await supabase.from('channels').select('id, name').order('name');
  const { data: platforms } = await supabase.from('platforms').select('id, name').order('name');
  const { data: contentTypes } = await supabase.from('content_types').select('id, name').order('name');

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Create New Post</h1>
      <PostForm 
        channels={channels || []} 
        platforms={platforms || []} 
        contentTypes={contentTypes || []} 
      />
    </div>
  );
}

// Inline Form Component (usually separate but keeping it simple for subagent flow)
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function PostForm({ channels, platforms, contentTypes }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    channel_id: '',
    platform_id: '',
    content_type_id: '',
    publish_date: ''
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (data.id) router.push(`/library/${data.id}`);
    else setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 border border-white/10 p-6 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Title</label>
          <input 
            required
            className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Content</label>
          <textarea 
            required
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20"
            value={formData.content}
            onChange={e => setFormData({...formData, content: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Channel</label>
          <select 
            required
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
            value={formData.channel_id}
            onChange={e => setFormData({...formData, channel_id: e.target.value})}
          >
            <option value="">Select Channel</option>
            {channels.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Platform</label>
          <select 
            required
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
            value={formData.platform_id}
            onChange={e => setFormData({...formData, platform_id: e.target.value})}
          >
            <option value="">Select Platform</option>
            {platforms.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Content Type</label>
          <select 
            required
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
            value={formData.content_type_id}
            onChange={e => setFormData({...formData, content_type_id: e.target.value})}
          >
            <option value="">Select Type</option>
            {contentTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Publish Date (Optional)</label>
          <input 
            type="datetime-local"
            className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none"
            value={formData.publish_date}
            onChange={e => setFormData({...formData, publish_date: e.target.value})}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">Image URL (Optional)</label>
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20"
            placeholder="https://..."
            value={formData.image_url}
            onChange={e => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-4">
        <button 
          type="button" 
          onClick={() => router.back()}
          className="px-6 py-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-white text-black px-8 py-2 rounded-md text-sm font-bold hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}
