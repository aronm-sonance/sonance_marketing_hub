import { createSupabaseServerClient } from "@/lib/supabase/server";
import PostsUI from "./ui";

export default async function LibraryPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch initial data
  const { data: channels } = await supabase.from('channels').select('id, name').order('name');
  const { data: platforms } = await supabase.from('platforms').select('id, name').order('name');

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Content Library</h1>
          <p className="text-white/60 text-sm">Manage and track your social media content workflow.</p>
        </div>
      </div>
      
      <PostsUI initialChannels={channels || []} initialPlatforms={platforms || []} />
    </div>
  );
}
