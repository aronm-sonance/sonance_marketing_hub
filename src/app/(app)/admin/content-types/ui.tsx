"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type ContentType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template_prompt: string | null;
  enabled: boolean;
  created_at: string;
};

export default function ContentTypesAdmin() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [types, setTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [templatePrompt, setTemplatePrompt] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("content_types").select("*").order("name");
    if (error) setError(error.message);
    else setTypes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-slug generation
  useEffect(() => {
    if (!editingId && name) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [name, editingId]);

  async function saveType(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = { 
      name, 
      slug, 
      description, 
      template_prompt: templatePrompt, 
      enabled 
    };

    let res;
    if (editingId) {
      res = await supabase.from("content_types").update(payload).eq("id", editingId);
    } else {
      res = await supabase.from("content_types").insert([payload]);
    }

    if (res.error) {
      setError(res.error.message);
    } else {
      resetForm();
      await load();
    }
    setBusy(false);
  }

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setTemplatePrompt("");
    setEnabled(true);
    setEditingId(null);
  }

  async function toggleEnabled(id: string, current: boolean) {
    const { error } = await supabase.from("content_types").update({ enabled: !current }).eq("id", id);
    if (error) setError(error.message);
    else await load();
  }

  async function deleteType(id: string) {
    if (!confirm("Delete this content type?")) return;
    const { error } = await supabase.from("content_types").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Content Types</h1>
      <p className="mt-2 text-sm text-white/60">Define AI prompt templates for different types of content.</p>

      {error && <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">{editingId ? "Edit Content Type" : "Create Content Type"}</div>
          <form onSubmit={saveType} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <div className="text-xs text-white/60">Slug (auto-generated)</div>
                <input
                  className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 font-mono"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="block">
              <div className="text-xs text-white/60">Description</div>
              <input
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">AI Template Prompt</div>
              <textarea
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[300px]"
                value={templatePrompt}
                onChange={(e) => setTemplatePrompt(e.target.value)}
                placeholder="Instructions for the AI..."
              />
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-white/15 bg-black"
              />
              <span className="text-sm text-white/80">Enabled</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                disabled={busy}
                className="flex-1 rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
                type="submit"
              >
                {busy ? "Saving…" : editingId ? "Update Content Type" : "Create Content Type"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 rounded-md border border-white/15 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">Existing Types</div>
          <div className="mt-4 space-y-2 max-h-[700px] overflow-auto pr-1">
            {loading ? (
              <p className="text-sm text-white/40">Loading types...</p>
            ) : types.map((t) => (
              <div key={t.id} className="group rounded border border-white/10 bg-black/30 px-3 py-3">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/90 font-medium">{t.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${t.enabled ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-white/10 text-white/40 bg-white/5'}`}>
                        {t.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    {t.description && <div className="text-[11px] text-white/50 truncate mt-0.5">{t.description}</div>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => toggleEnabled(t.id, t.enabled)}
                      className="p-1.5 text-[11px] rounded border border-white/10 hover:bg-white/5"
                    >
                      {t.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(t.id);
                        setName(t.name);
                        setSlug(t.slug);
                        setDescription(t.description || "");
                        setTemplatePrompt(t.template_prompt || "");
                        setEnabled(t.enabled);
                      }}
                      className="p-1.5 text-[11px] rounded border border-white/10 hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteType(t.id)}
                      className="p-1.5 text-[11px] rounded border border-red-900/50 text-red-400 hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {types.length === 0 && !loading && <p className="text-sm text-white/40 text-center py-4">No content types yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
