import { createSupabaseServerClient } from "@/lib/supabase/server";
import LibraryUI from "./ui";

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch initial data for filters
  const [
    { data: channels },
    { data: platforms },
    { data: contentTypes }
  ] = await Promise.all([
    supabase.from("channels").select("id, name").order("name"),
    supabase.from("platforms").select("id, name").order("name"),
    supabase.from("content_types").select("id, name").order("name")
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Library</h1>
          <p className="text-white/60">Manage and browse all marketing content.</p>
        </div>
        <a 
          href="/library/new" 
          className="bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-white/90 transition-colors"
        >
          Create Post
        </a>
      </div>

      <LibraryUI 
        initialChannels={channels || []} 
        initialPlatforms={platforms || []}
        initialContentTypes={contentTypes || []}
      />
    </div>
  );
}
