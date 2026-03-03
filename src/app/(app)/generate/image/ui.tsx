'use client';

import { useState } from 'react';

interface Channel {
  id: string;
  name: string;
  visual_scenes: any[];
}

interface Product {
  id: string;
  product_model: string;
  brand: string;
  category: string;
}

interface GeneratedImage {
  id: string;
  image: string;
  mimeType: string;
  prompt: string;
  timestamp: number;
}

interface ImageGeneratorUIProps {
  channels: Channel[];
  products: Product[];
}

const STYLE_PRESETS = [
  { value: 'photo-realistic', label: 'Photo-Realistic' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'product-hero', label: 'Product Hero' },
  { value: 'abstract-mood', label: 'Abstract/Mood' },
];

export default function ImageGeneratorUI({
  channels,
  products,
}: ImageGeneratorUIProps) {
  // Configuration state
  const [channelId, setChannelId] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [productId, setProductId] = useState('');
  const [stylePreset, setStylePreset] = useState('photo-realistic');
  const [prompt, setPrompt] = useState('');
  const [quality, setQuality] = useState<'draft' | 'hero'>('draft');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Refinement state
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refining, setRefining] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveAssetName, setSaveAssetName] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [saveTagInput, setSaveTagInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState('');

  const selectedChannel = channels.find((c) => c.id === channelId);
  const availableScenes = selectedChannel?.visual_scenes || [];

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.product_model.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const generateImage = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId || undefined,
          scene_name: sceneName || undefined,
          product_id: productId || undefined,
          style_preset: stylePreset,
          prompt,
          quality,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await res.json();

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        image: data.image,
        mimeType: data.mimeType,
        prompt: data.prompt_used,
        timestamp: Date.now(),
      };

      setCurrentImage(newImage);
      setHistory([newImage, ...history]);
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const refineImage = async () => {
    if (!currentImage || !refinePrompt.trim()) {
      alert('Please enter refinement instructions');
      return;
    }

    setRefining(true);

    try {
      const res = await fetch('/api/generate/image/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: `data:${currentImage.mimeType};base64,${currentImage.image}`,
          prompt: refinePrompt,
          channel_id: channelId || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Refinement failed');
      }

      const data = await res.json();

      const refinedImage: GeneratedImage = {
        id: Date.now().toString(),
        image: data.image,
        mimeType: data.mimeType,
        prompt: `${currentImage.prompt}\n\nRefinement: ${refinePrompt}`,
        timestamp: Date.now(),
      };

      setCurrentImage(refinedImage);
      setHistory([refinedImage, ...history]);
      setRefinePrompt('');
    } catch (error: any) {
      console.error('Refinement error:', error);
      alert(`Failed to refine image: ${error.message}`);
    } finally {
      setRefining(false);
    }
  };

  const openSaveModal = () => {
    if (!currentImage) return;
    setSaveAssetName(`generated-${Date.now()}.jpg`);
    setSaveTags([]);
    setShowSaveModal(true);
  };

  const saveToLibrary = async () => {
    if (!currentImage || !saveAssetName.trim()) {
      alert('Please enter an asset name');
      return;
    }

    setSaving(true);

    try {
      // Convert base64 to blob
      const byteCharacters = atob(currentImage.image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: currentImage.mimeType });

      // Create file from blob
      const file = new File([blob], saveAssetName, { type: currentImage.mimeType });

      // Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', saveAssetName);
      formData.append('tags', JSON.stringify(['generated', ...saveTags]));

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Save failed');
      }

      alert('Saved to Asset Library!');
      setShowSaveModal(false);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addSaveTag = () => {
    if (saveTagInput.trim() && !saveTags.includes(saveTagInput.trim())) {
      setSaveTags([...saveTags, saveTagInput.trim()]);
      setSaveTagInput('');
    }
  };

  const removeSaveTag = (index: number) => {
    setSaveTags(saveTags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Image Generator</h1>
        <p className="text-sm text-white/60 mt-1">
          Generate brand-aligned imagery using Gemini
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Configuration */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold border-b border-white/10 pb-2">
            Configuration
          </h2>

          {/* Channel */}
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Channel (optional)
            </label>
            <select
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
              value={channelId}
              onChange={(e) => {
                setChannelId(e.target.value);
                setSceneName('');
              }}
            >
              <option value="">— No channel —</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scene */}
          {channelId && availableScenes.length > 0 && (
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Visual Scene (optional)
              </label>
              <select
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
              >
                <option value="">— No scene —</option>
                {availableScenes.map((scene: any, idx: number) => (
                  <option key={idx} value={scene.name}>
                    {scene.name}
                  </option>
                ))}
              </select>
              {sceneName && (
                <div className="mt-2 text-xs text-white/60 bg-black/30 p-2 rounded">
                  {
                    availableScenes.find((s: any) => s.name === sceneName)
                      ?.looks_like
                  }
                </div>
              )}
            </div>
          )}

          {/* Product */}
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Product (optional)
            </label>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm mb-2 focus:outline-none"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <select
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none max-h-32"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              size={4}
            >
              <option value="">— No product —</option>
              {filteredProducts.slice(0, 20).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.product_model}
                </option>
              ))}
            </select>
          </div>

          {/* Style Preset */}
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Style Preset
            </label>
            <select
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
            >
              {STYLE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Prompt
            </label>
            <textarea
              className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/30 min-h-[120px]"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm text-white/60 mb-1">Quality</label>
            <div className="flex gap-2">
              <button
                onClick={() => setQuality('draft')}
                className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                  quality === 'draft'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Draft (Fast)
              </button>
              <button
                onClick={() => setQuality('hero')}
                className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                  quality === 'hero'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                Hero (Slow)
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={generating || !prompt.trim()}
            className="w-full bg-cyan-400 text-black px-6 py-3 rounded font-bold hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {/* Right Panel: Results */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-bold border-b border-white/10 pb-2">
            Results
          </h2>

          {!currentImage ? (
            <div className="flex items-center justify-center h-96 text-white/40 text-sm">
              <div className="text-center">
                <div className="text-4xl mb-3">◩</div>
                <p>Generated images will appear here</p>
              </div>
            </div>
          ) : (
            <>
              {/* Current Image */}
              <div className="bg-black rounded-lg overflow-hidden border border-white/10">
                <img
                  src={`data:${currentImage.mimeType};base64,${currentImage.image}`}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>

              {/* Refine */}
              <div className="space-y-2">
                <label className="block text-sm text-white/60">
                  Refine Image
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Describe changes..."
                    className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && refinePrompt.trim()) {
                        refineImage();
                      }
                    }}
                  />
                  <button
                    onClick={refineImage}
                    disabled={refining || !refinePrompt.trim()}
                    className="px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20 disabled:opacity-50"
                  >
                    {refining ? '...' : 'Refine'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={openSaveModal}
                  disabled={saving}
                  className="flex-1 bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 disabled:opacity-50"
                >
                  Save to Library
                </button>
              </div>
            </>
          )}

          {/* History */}
          {history.length > 1 && (
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-white/60 mb-2">History</div>
              <div className="grid grid-cols-4 gap-2">
                {history.slice(1, 9).map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(img)}
                    className="aspect-square bg-black rounded overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
                  >
                    <img
                      src={`data:${img.mimeType};base64,${img.image}`}
                      alt="History"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="relative w-full max-w-lg bg-black border border-white/10 rounded-lg shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold">Save to Asset Library</h3>

            <div>
              <label className="block text-sm text-white/60 mb-1">
                Asset Name
              </label>
              <input
                type="text"
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
                value={saveAssetName}
                onChange={(e) => setSaveAssetName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1">Tags</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-black border border-white/10 rounded px-3 py-2 text-sm focus:outline-none"
                    placeholder="Add tag..."
                    value={saveTagInput}
                    onChange={(e) => setSaveTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSaveTag();
                      }
                    }}
                  />
                  <button
                    onClick={addSaveTag}
                    className="px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                    generated
                  </span>
                  {saveTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => removeSaveTag(idx)}
                        className="text-white/60 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveToLibrary}
                disabled={saving || !saveAssetName.trim()}
                className="flex-1 bg-white text-black px-4 py-2 rounded font-medium hover:bg-white/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-white/10 rounded hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
