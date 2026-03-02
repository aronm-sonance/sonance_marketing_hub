"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  voice_foundation: string | null;
  voice_attributes: VoiceAttribute[];
  we_say: string[] | null;
  we_dont_say: string[] | null;
  visual_scenes: VisualScene[];
  created_at: string;
  updated_at: string;
};

type VoiceAttribute = {
  name: string;
  description: string;
};

type VisualScene = {
  name: string;
  looks_like: string;
  excludes: string;
};

type Platform = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
};

type PlatformGuideline = {
  id?: string;
  channel_id: string;
  platform_id: string;
  tone_adjustment: string;
  content_approach: string;
  optimal_content_mix: ContentMix[];
  best_practices: string[];
  avoid: string[];
};

type ContentMix = {
  type: string;
  percentage: number;
};

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
};

type Member = {
  id: string;
  channel_id: string;
  profile_id: string;
  role: string;
  profiles: Profile;
};

export default function ChannelsAdmin() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [channels, setChannels] = useState<Channel[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Selected channel for editing
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Tab 1: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [voiceFoundation, setVoiceFoundation] = useState("");

  // Tab 2: Voice Attributes
  const [voiceAttributes, setVoiceAttributes] = useState<VoiceAttribute[]>([]);

  // Tab 3: Platform Guidelines
  const [platformGuidelines, setPlatformGuidelines] = useState<Map<string, PlatformGuideline>>(new Map());

  // Tab 4: Language
  const [weSay, setWeSay] = useState<string[]>([]);
  const [weDontSay, setWeDontSay] = useState<string[]>([]);
  const [weSayInput, setWeSayInput] = useState("");
  const [weDontSayInput, setWeDontSayInput] = useState("");

  // Tab 5: Visual Scenes
  const [visualScenes, setVisualScenes] = useState<VisualScene[]>([]);

  // Member management
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [newMemberProfileId, setNewMemberProfileId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("viewer");

  async function load() {
    setLoading(true);
    setError(null);

    const [cRes, pRes, profRes, mRes] = await Promise.all([
      supabase.from("channels").select("*").order("name"),
      supabase.from("platforms").select("*").order("name"),
      supabase.from("profiles").select("id, email, full_name").order("email"),
      supabase.from("channel_members").select("*, profiles(id, email, full_name)")
    ]);

    if (cRes.error) setError(cRes.error.message);
    else setChannels(cRes.data || []);

    if (pRes.error) setError(pRes.error.message);
    else setPlatforms(pRes.data || []);

    if (profRes.error) setError(profRes.error.message);
    else setProfiles(profRes.data || []);

    if (mRes.error) setError(mRes.error.message);
    else setMembers((mRes.data as any) || []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadPlatformGuidelines(channelId: string) {
    const { data, error } = await supabase
      .from("channel_platform_guidelines")
      .select("*")
      .eq("channel_id", channelId);

    if (error) {
      setError(error.message);
      return;
    }

    const guidelinesMap = new Map<string, PlatformGuideline>();
    (data || []).forEach((g: any) => {
      guidelinesMap.set(g.platform_id, {
        id: g.id,
        channel_id: g.channel_id,
        platform_id: g.platform_id,
        tone_adjustment: g.tone_adjustment || "",
        content_approach: g.content_approach || "",
        optimal_content_mix: g.optimal_content_mix || [],
        best_practices: g.best_practices || [],
        avoid: g.avoid || []
      });
    });

    // Initialize empty guidelines for platforms that don't have entries
    platforms.forEach(platform => {
      if (!guidelinesMap.has(platform.id)) {
        guidelinesMap.set(platform.id, {
          channel_id: channelId,
          platform_id: platform.id,
          tone_adjustment: "",
          content_approach: "",
          optimal_content_mix: [],
          best_practices: [],
          avoid: []
        });
      }
    });

    setPlatformGuidelines(guidelinesMap);
  }

  function startEdit(channel: Channel) {
    setEditingChannel(channel);
    setActiveTab("basic");
    setName(channel.name);
    setDescription(channel.description || "");
    setColorHex(channel.color_hex || "#000000");
    setVoiceFoundation(channel.voice_foundation || "");
    setVoiceAttributes(channel.voice_attributes || []);
    setWeSay(channel.we_say || []);
    setWeDontSay(channel.we_dont_say || []);
    setVisualScenes(channel.visual_scenes || []);
    loadPlatformGuidelines(channel.id);
  }

  function cancelEdit() {
    setEditingChannel(null);
    setActiveTab("basic");
    resetForm();
  }

  function resetForm() {
    setName("");
    setDescription("");
    setColorHex("#000000");
    setVoiceFoundation("");
    setVoiceAttributes([]);
    setWeSay([]);
    setWeDontSay([]);
    setWeSayInput("");
    setWeDontSayInput("");
    setVisualScenes([]);
    setPlatformGuidelines(new Map());
  }

  async function saveBasicInfo() {
    if (!editingChannel) return;
    setBusy(true);
    setError(null);

    const payload = {
      name,
      description,
      color_hex: colorHex,
      voice_foundation: voiceFoundation
    };

    const { error } = await supabase
      .from("channels")
      .update(payload)
      .eq("id", editingChannel.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
      // Update editing channel
      const updated = channels.find(c => c.id === editingChannel.id);
      if (updated) setEditingChannel(updated);
    }
    setBusy(false);
  }

  async function saveVoiceAttributes() {
    if (!editingChannel) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("channels")
      .update({ voice_attributes: voiceAttributes })
      .eq("id", editingChannel.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function savePlatformGuidelines() {
    if (!editingChannel) return;
    setBusy(true);
    setError(null);

    // Upsert all guidelines
    for (const [platformId, guideline] of platformGuidelines.entries()) {
      const payload = {
        channel_id: editingChannel.id,
        platform_id: platformId,
        tone_adjustment: guideline.tone_adjustment || null,
        content_approach: guideline.content_approach || null,
        optimal_content_mix: guideline.optimal_content_mix,
        best_practices: guideline.best_practices,
        avoid: guideline.avoid
      };

      const { error } = await supabase
        .from("channel_platform_guidelines")
        .upsert(payload, { onConflict: "channel_id,platform_id" });

      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
  }

  async function saveLanguage() {
    if (!editingChannel) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("channels")
      .update({ we_say: weSay, we_dont_say: weDontSay })
      .eq("id", editingChannel.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function saveVisualScenes() {
    if (!editingChannel) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase
      .from("channels")
      .update({ visual_scenes: visualScenes })
      .eq("id", editingChannel.id);

    if (error) {
      setError(error.message);
    } else {
      await load();
    }
    setBusy(false);
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = { name, description, color_hex: colorHex };

    const { error } = await supabase.from("channels").insert([payload]);

    if (error) {
      setError(error.message);
    } else {
      resetForm();
      await load();
    }
    setBusy(false);
  }

  async function deleteChannel(id: string) {
    if (!confirm("Are you sure you want to delete this channel?")) return;
    setBusy(true);
    const { error } = await supabase.from("channels").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
    setBusy(false);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChannelId || !newMemberProfileId) return;
    setBusy(true);
    const { error } = await supabase.from("channel_members").insert([{
      channel_id: selectedChannelId,
      profile_id: newMemberProfileId,
      role: newMemberRole
    }]);
    if (error) setError(error.message);
    else {
      setNewMemberProfileId("");
      await load();
    }
    setBusy(false);
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this member?")) return;
    setBusy(true);
    const { error } = await supabase.from("channel_members").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
    setBusy(false);
  }

  const selectedChannelMembers = members.filter(m => m.channel_id === selectedChannelId);

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "voice", label: "Voice Attributes" },
    { id: "platforms", label: "Platform Guidelines" },
    { id: "language", label: "Language" },
    { id: "visual", label: "Visual Scenes" },
    { id: "members", label: "Members" }
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Channels</h1>
      <p className="mt-2 text-sm text-white/60">Manage marketing channels, brand voice, and team membership.</p>

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">
          {error}
        </p>
      )}

      {!editingChannel ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Create Channel */}
          <section className="rounded-lg border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-medium">Create Channel</div>
            <form onSubmit={createChannel} className="mt-4 space-y-4">
              <label className="block">
                <div className="text-xs text-white/60">Name</div>
                <input
                  className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <div className="text-xs text-white/60">Description</div>
                <textarea
                  className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <label className="block">
                <div className="text-xs text-white/60">Color</div>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    className="h-9 w-12 rounded border border-white/15 bg-black p-1"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                  />
                  <input
                    className="flex-1 rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 font-mono"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </label>

              <button
                disabled={busy}
                className="w-full rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
                type="submit"
              >
                {busy ? "Creating…" : "Create Channel"}
              </button>
            </form>
          </section>

          {/* Channels List */}
          <section className="rounded-lg border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-medium">Existing Channels</div>
            <div className="mt-4 space-y-2 max-h-[500px] overflow-auto pr-1">
              {loading ? (
                <p className="text-sm text-white/40">Loading channels...</p>
              ) : channels.map((c) => (
                <div key={c.id} className="group rounded border border-white/10 bg-black/30 px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color_hex || '#333' }} />
                    <div className="overflow-hidden">
                      <div className="text-sm text-white/90 truncate font-medium">{c.name}</div>
                      {c.description && <div className="text-[11px] text-white/50 truncate">{c.description}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-1.5 text-[11px] rounded border border-white/10 hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteChannel(c.id)}
                      className="p-1.5 text-[11px] rounded border border-red-900/50 text-red-400 hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {channels.length === 0 && !loading && <p className="text-sm text-white/40 text-center py-4">No channels yet.</p>}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6">
          {/* Edit Modal */}
          <div className="rounded-lg border border-white/10 bg-white/5">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: editingChannel.color_hex || '#333' }} />
                <h2 className="text-lg font-medium">Edit: {editingChannel.name}</h2>
              </div>
              <button
                onClick={cancelEdit}
                className="text-sm text-white/60 hover:text-white px-3 py-1 rounded border border-white/10 hover:bg-white/5"
              >
                Close
              </button>
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
              {activeTab === "basic" && (
                <div className="space-y-4 max-w-2xl">
                  <label className="block">
                    <div className="text-xs text-white/60 mb-1">Channel Name</div>
                    <input
                      className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <div className="text-xs text-white/60 mb-1">Description</div>
                    <textarea
                      className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[80px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <div className="text-xs text-white/60 mb-1">Color</div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 rounded border border-white/15 bg-black p-1"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                      />
                      <input
                        className="flex-1 rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 font-mono"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs text-white/60 mb-1">Voice Foundation</div>
                    <textarea
                      className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[120px]"
                      value={voiceFoundation}
                      onChange={(e) => setVoiceFoundation(e.target.value)}
                      placeholder="Describe the channel's voice and personality..."
                    />
                  </label>

                  <button
                    onClick={saveBasicInfo}
                    disabled={busy}
                    className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save Basic Info"}
                  </button>
                </div>
              )}

              {activeTab === "voice" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-white/80">Define the voice attributes for this channel</div>
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
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
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
                      <p className="text-sm text-white/40 text-center py-8">No voice attributes yet. Add one to get started.</p>
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

              {activeTab === "platforms" && (
                <div className="space-y-6">
                  <div className="text-sm text-white/80 mb-4">
                    Configure how this channel adapts to each platform
                  </div>

                  {platforms.map(platform => {
                    const guideline = platformGuidelines.get(platform.id) || {
                      channel_id: editingChannel.id,
                      platform_id: platform.id,
                      tone_adjustment: "",
                      content_approach: "",
                      optimal_content_mix: [],
                      best_practices: [],
                      avoid: []
                    };

                    return (
                      <div key={platform.id} className="rounded border border-white/10 bg-black/20 p-5">
                        <h3 className="text-sm font-medium text-cyan-400 mb-4">{platform.name}</h3>
                        
                        <div className="space-y-4">
                          <label className="block">
                            <div className="text-xs text-white/60 mb-1">Tone Adjustment</div>
                            <textarea
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
                              placeholder="How does the voice shift for this platform?"
                              value={guideline.tone_adjustment}
                              onChange={(e) => {
                                const updated = new Map(platformGuidelines);
                                updated.set(platform.id, { ...guideline, tone_adjustment: e.target.value });
                                setPlatformGuidelines(updated);
                              }}
                            />
                          </label>

                          <label className="block">
                            <div className="text-xs text-white/60 mb-1">Content Approach</div>
                            <textarea
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
                              placeholder="Content strategy notes for this platform"
                              value={guideline.content_approach}
                              onChange={(e) => {
                                const updated = new Map(platformGuidelines);
                                updated.set(platform.id, { ...guideline, content_approach: e.target.value });
                                setPlatformGuidelines(updated);
                              }}
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-white/60 mb-2">Best Practices</div>
                              <TagInput
                                tags={guideline.best_practices}
                                onAdd={(tag) => {
                                  const updated = new Map(platformGuidelines);
                                  updated.set(platform.id, { 
                                    ...guideline, 
                                    best_practices: [...guideline.best_practices, tag] 
                                  });
                                  setPlatformGuidelines(updated);
                                }}
                                onRemove={(idx) => {
                                  const updated = new Map(platformGuidelines);
                                  updated.set(platform.id, { 
                                    ...guideline, 
                                    best_practices: guideline.best_practices.filter((_, i) => i !== idx) 
                                  });
                                  setPlatformGuidelines(updated);
                                }}
                              />
                            </div>

                            <div>
                              <div className="text-xs text-white/60 mb-2">Avoid</div>
                              <TagInput
                                tags={guideline.avoid}
                                onAdd={(tag) => {
                                  const updated = new Map(platformGuidelines);
                                  updated.set(platform.id, { 
                                    ...guideline, 
                                    avoid: [...guideline.avoid, tag] 
                                  });
                                  setPlatformGuidelines(updated);
                                }}
                                onRemove={(idx) => {
                                  const updated = new Map(platformGuidelines);
                                  updated.set(platform.id, { 
                                    ...guideline, 
                                    avoid: guideline.avoid.filter((_, i) => i !== idx) 
                                  });
                                  setPlatformGuidelines(updated);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={savePlatformGuidelines}
                    disabled={busy}
                    className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save Platform Guidelines"}
                  </button>
                </div>
              )}

              {activeTab === "language" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="text-sm text-white/80 mb-4">
                    Define language patterns for this channel
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

              {activeTab === "visual" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-white/80">Define visual scenes for this channel</div>
                    <button
                      onClick={() => setVisualScenes([...visualScenes, { name: "", looks_like: "", excludes: "" }])}
                      className="text-sm px-3 py-1 rounded border border-white/15 hover:bg-white/5"
                    >
                      + Add Scene
                    </button>
                  </div>

                  <div className="space-y-3 max-w-3xl">
                    {visualScenes.map((scene, idx) => (
                      <div key={idx} className="rounded border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                              placeholder="Scene name"
                              value={scene.name}
                              onChange={(e) => {
                                const updated = [...visualScenes];
                                updated[idx].name = e.target.value;
                                setVisualScenes(updated);
                              }}
                            />
                            <textarea
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
                              placeholder="Looks like (visual description)"
                              value={scene.looks_like}
                              onChange={(e) => {
                                const updated = [...visualScenes];
                                updated[idx].looks_like = e.target.value;
                                setVisualScenes(updated);
                              }}
                            />
                            <textarea
                              className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[60px]"
                              placeholder="Excludes (what to avoid)"
                              value={scene.excludes}
                              onChange={(e) => {
                                const updated = [...visualScenes];
                                updated[idx].excludes = e.target.value;
                                setVisualScenes(updated);
                              }}
                            />
                          </div>
                          <button
                            onClick={() => setVisualScenes(visualScenes.filter((_, i) => i !== idx))}
                            className="text-xs text-red-400/60 hover:text-red-400 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {visualScenes.length === 0 && (
                      <p className="text-sm text-white/40 text-center py-8">No visual scenes yet. Add one to get started.</p>
                    )}
                  </div>

                  <button
                    onClick={saveVisualScenes}
                    disabled={busy}
                    className="rounded-md bg-white text-black text-sm py-2 px-6 font-medium disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save Visual Scenes"}
                  </button>
                </div>
              )}

              {activeTab === "members" && (
                <div className="space-y-6 max-w-4xl">
                  <div className="text-sm text-white/80 mb-4">
                    Manage team members for this channel
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <div className="text-sm font-medium mb-3">Add Member</div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newMemberProfileId) return;
                        setBusy(true);
                        const { error } = await supabase.from("channel_members").insert([{
                          channel_id: editingChannel.id,
                          profile_id: newMemberProfileId,
                          role: newMemberRole
                        }]);
                        if (error) setError(error.message);
                        else {
                          setNewMemberProfileId("");
                          await load();
                        }
                        setBusy(false);
                      }} className="space-y-3">
                        <select
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                          value={newMemberProfileId}
                          onChange={(e) => setNewMemberProfileId(e.target.value)}
                          required
                        >
                          <option value="">Select profile...</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.email}</option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                        >
                          <option value="viewer">viewer</option>
                          <option value="approver">approver</option>
                          <option value="creator">creator</option>
                        </select>
                        <button
                          disabled={busy}
                          className="w-full rounded-md border border-white/15 text-sm py-2 hover:bg-white/5 disabled:opacity-60"
                          type="submit"
                        >
                          Add Member
                        </button>
                      </form>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-3">Current Members</div>
                      <div className="space-y-2">
                        {members.filter(m => m.channel_id === editingChannel.id).map(m => (
                          <div key={m.id} className="rounded border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between text-sm">
                            <div>
                              <div className="text-white/90">{m.profiles?.email}</div>
                              <div className="text-[11px] text-white/50 capitalize">{m.role}</div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm("Remove this member?")) return;
                                setBusy(true);
                                const { error } = await supabase.from("channel_members").delete().eq("id", m.id);
                                if (error) setError(error.message);
                                else await load();
                                setBusy(false);
                              }}
                              className="text-xs text-red-400/60 hover:text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {members.filter(m => m.channel_id === editingChannel.id).length === 0 && (
                          <p className="text-sm text-white/40">No members assigned.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
