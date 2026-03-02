"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type VoiceAttribute = {
  name: string;
  description: string;
};

type ToneModulation = {
  context: string;
  shift: string;
};

type BrandVoice = {
  id: string;
  key: string;
  name: string;
  voice_foundation: string | null;
  voice_attributes: VoiceAttribute[];
  we_say: string[];
  we_dont_say: string[];
  tone_modulations: ToneModulation[];
  created_at: string;
  updated_at: string;
};

export default function BrandVoiceAdmin() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("foundation");

  // Form states
  const [voiceFoundation, setVoiceFoundation] = useState("");
  const [voiceAttributes, setVoiceAttributes] = useState<VoiceAttribute[]>([]);
  const [weSay, setWeSay] = useState<string[]>([]);
  const [weDontSay, setWeDontSay] = useState<string[]>([]);
  const [toneModulations, setToneModulations] = useState<ToneModulation[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("brand_voice")
      .select("*")
      .eq("key", "sonance-master")
      .maybeSingle();

    if (error) {
      setError(error.message);
    } else if (data) {
      setBrandVoice(data);
      setVoiceFoundation(data.voice_foundation || "");
      setVoiceAttributes(data.voice_attributes || []);
      setWeSay(data.we_say || []);
      setWeDontSay(data.we_dont_say || []);
      setToneModulations(data.tone_modulations || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveFoundation() {
    if (!brandVoice) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("brand_voice")
      .update({ voice_foundation: voiceFoundation })
      .eq("id", brandVoice.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function saveVoiceAttributes() {
    if (!brandVoice) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("brand_voice")
      .update({ voice_attributes: voiceAttributes })
      .eq("id", brandVoice.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function saveLanguage() {
    if (!brandVoice) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("brand_voice")
      .update({ we_say: weSay, we_dont_say: weDontSay })
      .eq("id", brandVoice.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function saveToneModulations() {
    if (!brandVoice) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("brand_voice")
      .update({ tone_modulations: toneModulations })
      .eq("id", brandVoice.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  const tabs = [
    { id: "foundation", label: "Voice Foundation" },
    { id: "attributes", label: "Voice Attributes" },
    { id: "language", label: "Language" },
    { id: "modulations", label: "Tone Modulations" }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-medium tracking-tight">Admin · Brand Voice</h1>
        <p className="mt-8 text-sm text-white/40">Loading...</p>
      </div>
    );
  }

  if (!brandVoice) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-medium tracking-tight">Admin · Brand Voice</h1>
        <p className="mt-8 text-sm text-red-400">Brand voice not found. Run migrations to seed.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Brand Voice</h1>
      <p className="mt-2 text-sm text-white/60">Manage the global Sonance brand voice and tone guidelines.</p>

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">
          {error}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-white/10 bg-white/5">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-lg font-medium">{brandVoice.name}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-white/60 hover:text-white/80 border-b-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "foundation" && (
            <div className="space-y-4 max-w-3xl">
              <div className="text-sm text-white/80 mb-4">
                The foundational statement that defines how Sonance communicates
              </div>

              <label className="block">
                <div className="text-xs text-white/60 mb-1">Voice Foundation</div>
                <textarea
                  className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[200px]"
                  value={voiceFoundation}
                  onChange={(e) => setVoiceFoundation(e.target.value)}
                  placeholder="Describe the core brand voice..."
                />
              </label>

              <button
                onClick={saveFoundation}
                disabled={busy}
                className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Voice Foundation"}
              </button>
            </div>
          )}

          {activeTab === "attributes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-white/80">Core voice attributes that define the Sonance brand</div>
                <button
                  onClick={() => setVoiceAttributes([...voiceAttributes, { name: "", description: "" }])}
                  className="text-sm px-3 py-1 rounded border border-white/15 hover:bg-white/5"
                >
                  + Add Attribute
                </button>
              </div>

              <div className="space-y-3 max-w-3xl">
                {voiceAttributes.map((attr, idx) => (
                  <div key={idx} className="rounded border border-white/10 bg-black/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                          placeholder="Attribute name"
                          value={attr.name}
                          onChange={(e) => {
                            const updated = [...voiceAttributes];
                            updated[idx].name = e.target.value;
                            setVoiceAttributes(updated);
                          }}
                        />
                        <textarea
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[80px]"
                          placeholder="Description"
                          value={attr.description}
                          onChange={(e) => {
                            const updated = [...voiceAttributes];
                            updated[idx].description = e.target.value;
                            setVoiceAttributes(updated);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setVoiceAttributes(voiceAttributes.filter((_, i) => i !== idx))}
                        className="text-xs text-red-400/60 hover:text-red-400 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {voiceAttributes.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-8">No voice attributes defined.</p>
                )}
              </div>

              <button
                onClick={saveVoiceAttributes}
                disabled={busy}
                className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Voice Attributes"}
              </button>
            </div>
          )}

          {activeTab === "language" && (
            <div className="space-y-6 max-w-4xl">
              <div className="text-sm text-white/80 mb-4">
                Define global language patterns for the Sonance brand
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-emerald-400 mb-3">We Say</div>
                  <TagInput
                    tags={weSay}
                    onAdd={(tag) => setWeSay([...weSay, tag])}
                    onRemove={(idx) => setWeSay(weSay.filter((_, i) => i !== idx))}
                    placeholder="Type a phrase and press Enter..."
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-red-400 mb-3">We Don't Say</div>
                  <TagInput
                    tags={weDontSay}
                    onAdd={(tag) => setWeDontSay([...weDontSay, tag])}
                    onRemove={(idx) => setWeDontSay(weDontSay.filter((_, i) => i !== idx))}
                    placeholder="Type a phrase and press Enter..."
                  />
                </div>
              </div>

              <button
                onClick={saveLanguage}
                disabled={busy}
                className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Language"}
              </button>
            </div>
          )}

          {activeTab === "modulations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-white/80">Context-specific tone shifts for different scenarios</div>
                <button
                  onClick={() => setToneModulations([...toneModulations, { context: "", shift: "" }])}
                  className="text-sm px-3 py-1 rounded border border-white/15 hover:bg-white/5"
                >
                  + Add Modulation
                </button>
              </div>

              <div className="space-y-3 max-w-3xl">
                {toneModulations.map((mod, idx) => (
                  <div key={idx} className="rounded border border-white/10 bg-black/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                          placeholder="Context (e.g., Technical Documentation)"
                          value={mod.context}
                          onChange={(e) => {
                            const updated = [...toneModulations];
                            updated[idx].context = e.target.value;
                            setToneModulations(updated);
                          }}
                        />
                        <textarea
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
                          placeholder="Tone shift description"
                          value={mod.shift}
                          onChange={(e) => {
                            const updated = [...toneModulations];
                            updated[idx].shift = e.target.value;
                            setToneModulations(updated);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setToneModulations(toneModulations.filter((_, i) => i !== idx))}
                        className="text-xs text-red-400/60 hover:text-red-400 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {toneModulations.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-8">No tone modulations defined.</p>
                )}
              </div>

              <button
                onClick={saveToneModulations}
                disabled={busy}
                className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Tone Modulations"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tag Input Component
function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <input
        className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
        placeholder={placeholder || "Type and press Enter..."}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-xs"
          >
            <span>{tag}</span>
            <button
              onClick={() => onRemove(idx)}
              className="text-white/60 hover:text-white ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
