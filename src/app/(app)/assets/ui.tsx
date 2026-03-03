'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getSignedUrl } from '@/lib/supabase/storage';

interface Asset {
  id: string;
  name: string;
  storage_path: string;
  source: 'upload' | 'salsify' | 'generated';
  tags: string[];
  created_at: string;
  salsify_id?: string;
  salsify_field?: string;
}

interface AssetsUIProps {
  initialAssets: Asset[];
  allTags: string[];
}

export default function AssetsUI({ initialAssets, allTags }: AssetsUIProps) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [detailUrl, setDetailUrl] = useState('');

  // Load signed URLs for assets
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const asset of assets) {
        try {
          const url = await getSignedUrl(supabase, asset.storage_path, 3600);
          urls[asset.id] = url;
        } catch (error) {
          console.error(`Failed to load URL for ${asset.id}:`, error);
        }
      }
      setAssetUrls(urls);
    };
    loadUrls();
  }, [assets]);

  const fetchAssets = async () => {
    setLoading(true);
    let url = `/api/assets?page=${page}&limit=50&sort=${sortBy}`;
    if (search) url += `&q=${encodeURIComponent(search)}`;
    if (sourceFilter) url += `&source=${encodeURIComponent(sourceFilter)}`;
    if (tagFilter) url += `&tag=${encodeURIComponent(tagFilter)}`;

    const res = await fetch(url);
    const data = await res.json();
    
    setAssets(data.assets || []);
    setTotalPages(data.pages || 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
  }, [page, sourceFilter, tagFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('tags', JSON.stringify([]));

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setUploadProgress(100);
      
      // Refresh assets list
      await fetchAssets();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const openDetail = async (asset: Asset) => {
    setSelectedAsset(asset);
    setEditName(asset.name);
    setEditTags(asset.tags);
    
    // Load full-size URL
    try {
      const url = await getSignedUrl(supabase, asset.storage_path, 3600);
      setDetailUrl(url);
    } catch (error) {
      console.error('Failed to load detail URL:', error);
    }
  };

  const closeDetail = () => {
    setSelectedAsset(null);
    setEditName('');
    setEditTags([]);
    setTagInput('');
    setDetailUrl('');
  };

  const saveAssetDetails = async () => {
    if (!selectedAsset) return;

    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          tags: editTags,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update asset');
      }

      // Refresh and close
      await fetchAssets();
      closeDetail();
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    }
  };

  const deleteAsset = async () => {
    if (!selectedAsset) return;
    if (!confirm(`Delete "${selectedAsset.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete asset');
      }

      closeDetail();
      await fetchAssets();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const copyUrl = () => {
    if (detailUrl) {
      navigator.clipboard.writeText(detailUrl);
      alert('URL copied to clipboard!');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setEditTags(editTags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-sm text-white/60 mt-1">
            Manage images, documents, and generated assets
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-cyan-400 bg-cyan-400/10'
            : 'border-white/20 bg-white/5 hover:border-white/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-3">
            <div className="text-sm text-white/80">Uploading...</div>
            <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl text-white/40">⬆</div>
            <div className="text-sm text-white/80">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-cyan-400 hover:underline"
              >
                browse
              </button>
            </div>
            <div className="text-xs text-white/40">
              Supports: JPG, PNG, GIF, WebP, SVG, PDF
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white/5 border border-white/10 rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <form onSubmit={handleSearch} className="md:col-span-2 flex gap-2">
            <input
              type="text"
              placeholder="Search assets..."
              className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-white/90"
            >
              Search
            </button>
          </form>

          <select
            className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Sources</option>
            <option value="upload">Uploads</option>
            <option value="salsify">Salsify</option>
            <option value="generated">Generated</option>
          </select>

          <select
            className="bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-white/60 mb-2">Filter by tag:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setTagFilter('');
                  setPage(1);
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  !tagFilter
                    ? 'bg-cyan-400 text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setTagFilter(tag);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    tagFilter === tag
                      ? 'bg-cyan-400 text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="py-20 text-center text-white/40">Loading assets...</div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center text-white/40">
          No assets found. Upload some to get started!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white/5 border border-white/10 rounded-md p-3 cursor-pointer hover:border-white/30 transition-colors"
              onClick={() => openDetail(asset)}
            >
              <div className="aspect-square bg-black rounded mb-2 flex items-center justify-center overflow-hidden border border-white/5">
                {assetUrls[asset.id] ? (
                  <img
                    src={assetUrls[asset.id]}
                    alt={asset.name}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <div className="text-white/20 text-xs">Loading...</div>
                )}
              </div>
              
              <div className="text-xs font-medium truncate mb-1">{asset.name}</div>
              
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    asset.source === 'upload'
                      ? 'bg-blue-500/20 text-blue-400'
                      : asset.source === 'salsify'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {asset.source}
                </span>
              </div>

              {asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                  {asset.tags.length > 2 && (
                    <span className="text-[10px] text-white/40">
                      +{asset.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border border-white/10 rounded disabled:opacity-30 hover:bg-white/5"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white/60">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-white/10 rounded disabled:opacity-30 hover:bg-white/5"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={closeDetail}
          />
          <div className="relative w-full max-w-4xl bg-black border border-white/10 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold">Asset Details</h2>
                <button
                  onClick={closeDetail}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Image Preview */}
              <div className="bg-white/5 rounded-lg p-4 flex justify-center">
                {detailUrl ? (
                  <img
                    src={detailUrl}
                    alt={selectedAsset.name}
                    className="max-h-96 object-contain"
                  />
                ) : (
                  <div className="text-white/40">Loading preview...</div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-1">Tags</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <button
                        onClick={addTag}
                        className="px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(idx)}
                            className="text-white/60 hover:text-white ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Source:</span>{' '}
                    <span className="capitalize">{selectedAsset.source}</span>
                  </div>
                  <div>
                    <span className="text-white/60">Created:</span>{' '}
                    {new Date(selectedAsset.created_at).toLocaleDateString()}
                  </div>
                  {selectedAsset.salsify_id && (
                    <div className="col-span-2">
                      <span className="text-white/60">Salsify ID:</span>{' '}
                      {selectedAsset.salsify_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={saveAssetDetails}
                  className="flex-1 bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90"
                >
                  Save Changes
                </button>
                <button
                  onClick={copyUrl}
                  className="px-4 py-2 border border-white/10 rounded hover:bg-white/5"
                >
                  Copy URL
                </button>
                <button
                  disabled
                  className="px-4 py-2 border border-white/10 rounded opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  Use in Post
                </button>
                <button
                  onClick={deleteAsset}
                  className="px-4 py-2 border border-red-500/50 text-red-400 rounded hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
