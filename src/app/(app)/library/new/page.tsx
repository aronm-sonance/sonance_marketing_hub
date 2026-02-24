import { createSupabaseServerClient } from "@/lib/supabase/server";
import PostForm from "./form";

export default async function NewPostPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: channels } = await supabase.from('channels').select('id, name').order('name');
  const { data: platforms } = await supabase.from('platforms').select('id, name').order('name');
  const { data: contentTypes } = await supabase.from('content_types').select('id, name').order('name');

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Create New Post</h1>
      <PostForm 
        channels={channels || []} 
        platforms={platforms || []} 
        contentTypes={contentTypes || []} 
      />
    </div>
  );
}
