"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type DontSayEntry = {
  id: string;
  phrase: string;
  rationale: string | null;
  category: string | null;
  created_by: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
};

export default function DontSayAdmin() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const [entries, setEntries] = useState<DontSayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Form states
  const [phrase, setPhrase] = useState("");
  const [rationale, setRationale] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("global_dont_say")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
      
    if (error) setError(error.message);
    else setEntries(data as any || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(entries.map(e => e.category).filter(Boolean));
    return ["All", ...Array.from(cats)].sort() as string[];
  }, [entries]);

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.phrase.toLowerCase().includes(search.toLowerCase()) || 
                          (e.rationale?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "All" || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setBusy(false);
      return;
    }

    const payload = { phrase, rationale, category, created_by: user.id };

    let res;
    if (editingId) {
      res = await supabase.from("global_dont_say").update(payload).eq("id", editingId);
    } else {
      res = await supabase.from("global_dont_say").insert([payload]);
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
    setPhrase("");
    setRationale("");
    setCategory("");
    setEditingId(null);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("global_dont_say").delete().eq("id", id);
    if (error) setError(error.message);
    else await load();
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-medium tracking-tight">Admin · Don't Say</h1>
      <p className="mt-2 text-sm text-white/60">Global phrases and terminology to avoid in marketing copy.</p>

      {error && <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-md">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-medium">{editingId ? "Edit Entry" : "Add Phrase"}</div>
          <form onSubmit={saveEntry} className="mt-4 space-y-4">
            <label className="block">
              <div className="text-xs text-white/60">Phrase to avoid</div>
              <input
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                required
                placeholder="e.g. 'Industry-leading'"
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Rationale / Alternative</div>
              <textarea
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40 min-h-[80px]"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why avoid this and what to say instead..."
              />
            </label>

            <label className="block">
              <div className="text-xs text-white/60">Category</div>
              <input
                className="mt-1 w-full rounded-md bg-black border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="existing-categories"
                placeholder="e.g. Buzzwords"
              />
              <datalist id="existing-categories">
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                disabled={busy}
                className="flex-1 rounded-md bg-white text-black text-sm py-2 font-medium disabled:opacity-60"
                type="submit"
              >
                {busy ? "Saving…" : editingId ? "Update Entry" : "Add to Global List"}
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

        <section className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="text-sm font-medium">Phrases List</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="bg-black border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:border-white/30 w-full sm:w-32"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                  className="bg-black border border-white/10 rounded-md px-2 py-1 text-xs outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-[600px] overflow-auto pr-1">
              {loading ? (
                <p className="text-sm text-white/40">Loading phrases...</p>
              ) : filteredEntries.map((e) => (
                <div key={e.id} className="group rounded border border-white/10 bg-black/30 px-3 py-3">
                  <div className="flex items-start justify-between">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/90 font-bold">"{e.phrase}"</span>
                        {e.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/50 bg-white/5">
                            {e.category}
                          </span>
                        )}
                      </div>
                      {e.rationale && <div className="text-[11px] text-white/60 mt-1">{e.rationale}</div>}
                      <div className="text-[9px] text-white/30 mt-2 flex items-center gap-1">
                        <span>Added by {e.profiles?.full_name || e.profiles?.email}</span>
                        <span>·</span>
                        <span>{new Date(e.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                      <button
                        onClick={() => {
                          setEditingId(e.id);
                          setPhrase(e.phrase);
                          setRationale(e.rationale || "");
                          setCategory(e.category || "");
                        }}
                        className="p-1 text-[10px] rounded border border-white/10 hover:bg-white/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="p-1 text-[10px] rounded border border-red-900/50 text-red-400 hover:bg-red-900/20"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredEntries.length === 0 && !loading && <p className="text-sm text-white/40 text-center py-4">No phrases found.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
