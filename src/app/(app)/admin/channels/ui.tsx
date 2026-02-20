"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  voice_foundation: string | null;
  voice_attributes: any;
  we_say: string[] | null;
  we_dont_say: string[] | null;
  visual_scenes: any;
  created_at: string;
  updated_at: string;
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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [newMemberProfileId, setNewMemberProfileId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("viewer");

  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    
    const [cRes, pRes, mRes] = await Promise.all([
      supabase.from("channels").select("*").order("name"),
      supabase.from("profiles").select("id, email, full_name").order("email"),
      supabase.from("channel_members").select("*, profiles(id, email, full_name)")
    ]);

    if (cRes.error) setError(cRes.error.message);
    else setChannels(cRes.data || []);

    if (pRes.error) setError(pRes.error.message);
    else setProfiles(pRes.data || []);

    if (mRes.error) setError(mRes.error.message);
    else setMembers((mRes.data as any) || []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveChannel(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = { name, description, color_hex: colorHex };

    let res;
    if (editingId) {
      res = await supabase.from("channels").update(payload).eq("id", editingId);
    } else {
      res = await supabase.from("channels").insert([payload]);
    }

    if (res.error) {
      setError(res.error.message);
    } else {
      setName("");
      setDescription("");
      setColorHex("#000000");
      setEditingId(null);
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

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Channels</h1>
      <p className="mt-2 text-sm text-white/60">Manage marketing channels and team membership.</p>

      {error && <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Channel Form */}
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">{editingId ? "Edit Channel" : "Create Channel"}</div>
          <form onSubmit={saveChannel} className="mt-4 space-y-4">
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
              <div className="text-xs text-white/60">Color Hex</div>
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

            <div className="flex gap-2 pt-2">
              <button
                disabled={busy}
                className="flex-1 rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
                type="submit"
              >
                {busy ? "Saving…" : editingId ? "Update Channel" : "Create Channel"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setDescription("");
                    setColorHex("#000000");
                  }}
                  className="px-4 rounded-md border border-white/15 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
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
                    onClick={() => {
                      setSelectedChannelId(c.id);
                    }}
                    className="p-1.5 text-[11px] rounded border border-white/10 hover:bg-white/5"
                  >
                    Members
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setName(c.name);
                      setDescription(c.description || "");
                      setColorHex(c.color_hex || "#000000");
                    }}
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

      {/* Member Management */}
      {selectedChannelId && (
        <section className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Members: <span className="text-cyan-400">{channels.find(c => c.id === selectedChannelId)?.name}</span>
            </h2>
            <button onClick={() => setSelectedChannelId(null)} className="text-xs text-white/40 hover:text-white">Close</button>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <form onSubmit={addMember} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-xs text-white/60">Profile</div>
                    <select
                      className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                      value={newMemberProfileId}
                      onChange={(e) => setNewMemberProfileId(e.target.value)}
                      required
                    >
                      <option value="">Select profile...</option>
                      {profiles.map(p => (
                        <option key={p.id} value={p.id}>{p.email}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <div className="text-xs text-white/60">Role</div>
                    <select
                      className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                    >
                      <option value="viewer">viewer</option>
                      <option value="approver">approver</option>
                      <option value="creator">creator</option>
                    </select>
                  </label>
                </div>
                <button
                  disabled={busy}
                  className="w-full rounded-md border border-white/15 text-sm py-2 hover:bg-white/5"
                  type="submit"
                >
                  Add Member
                </button>
              </form>
            </div>

            <div className="space-y-2">
              {selectedChannelMembers.map(m => (
                <div key={m.id} className="rounded border border-white/10 bg-black/30 px-3 py-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="text-white/90">{m.profiles?.email}</div>
                    <div className="text-[11px] text-white/50 capitalize">{m.role}</div>
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {selectedChannelMembers.length === 0 && <p className="text-sm text-white/40">No members assigned.</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
