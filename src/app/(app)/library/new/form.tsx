'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Violation {
  rule_id: string;
  matched_text: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

export default function PostForm({ channels, platforms, contentTypes }: any) {
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

  // AI Generation state
  const [aiState, setAiState] = useState({
    brief: '',
    product_id: '',
    generating: false,
    error: ''
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showAiSection, setShowAiSection] = useState(true);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/salsify/products?page_size=50');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.channel_id || !formData.platform_id || !formData.content_type_id) {
      setAiState({ ...aiState, error: 'Please select Channel, Platform, and Content Type first' });
      return;
    }
    if (!aiState.brief.trim()) {
      setAiState({ ...aiState, error: 'Please enter a brief description' });
      return;
    }

    setAiState({ ...aiState, generating: true, error: '' });
    setViolations([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: formData.channel_id,
          platform_id: formData.platform_id,
          content_type_id: formData.content_type_id,
          product_id: aiState.product_id || undefined,
          brief: aiState.brief
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          generatedContent += chunk;
          
          // Update content in real-time
          setFormData({ ...formData, content: generatedContent });
        }
      }

      // Validate generated content
      await validateGeneratedContent(generatedContent);

    } catch (err: any) {
      console.error('Generation error:', err);
      setAiState({ ...aiState, error: err.message || 'Failed to generate content', generating: false });
    } finally {
      setAiState({ ...aiState, generating: false });
    }
  };

  const validateGeneratedContent = async (content: string) => {
    try {
      const res = await fetch('/api/generate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const result = await res.json();
        setViolations(result.violations || []);
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Generation Section */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">
            ✨ Generate with AI
          </h3>
          <button
            type="button"
            onClick={() => setShowAiSection(!showAiSection)}
            className="text-xs text-white/40 hover:text-white/60"
          >
            {showAiSection ? 'Hide' : 'Show'}
          </button>
        </div>

        {showAiSection && (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">
                What do you want to write about?
              </label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20"
                placeholder="Describe the content you want to generate..."
                value={aiState.brief}
                onChange={(e) => setAiState({ ...aiState, brief: e.target.value, error: '' })}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 ml-1">
                Product (Optional)
              </label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none"
                value={aiState.product_id}
                onChange={(e) => setAiState({ ...aiState, product_id: e.target.value })}
                disabled={loadingProducts}
              >
                <option value="">No product</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p['salsify:name'] || p.name || p.id}
                  </option>
                ))}
              </select>
            </div>

            {aiState.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
                {aiState.error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiState.generating}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-md text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiState.generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">Generating</span>
                  <span className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </span>
              ) : (
                '✨ Generate Content'
              )}
            </button>

            {violations.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                  ⚠️ Guardrail Violations
                </div>
                <div className="space-y-2">
                  {violations.map((v, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="text-yellow-300">
                        {v.severity === 'error' ? '🚫' : '⚠️'} Found: "{v.matched_text}"
                      </div>
                      {v.suggestion && (
                        <div className="text-white/60 text-xs ml-5">
                          💡 Suggestion: {v.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Form */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-md space-y-6">
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
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-white/20 font-mono"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Write your content here, or generate it with AI above..."
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
