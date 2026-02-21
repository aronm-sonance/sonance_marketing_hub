import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreatePostUI from "./ui";

export default async function CreatePostPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Fetch initial data for form
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <a href="/library" className="text-white/40 hover:text-white text-sm flex items-center mb-4 transition-colors">
          &larr; Back to Library
        </a>
        <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
        <p className="text-white/60">Fill out the details below to create a new post.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-md p-8">
        <CreatePostUI 
          channels={channels || []} 
          platforms={platforms || []}
          contentTypes={contentTypes || []}
        />
      </div>
    </div>
  );
}
