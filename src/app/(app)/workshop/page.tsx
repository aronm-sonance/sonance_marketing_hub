import { createSupabaseServerClient } from "@/lib/supabase/server";
import WorkshopUI from "./ui";

export default async function WorkshopPage() {
  const supabase = await createSupabaseServerClient();
  
  // Fetch channels for context selector
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name')
    .order('name');

  // Fetch user's workshop sessions
  const { data: sessions } = await supabase
    .from('workshop_sessions')
    .select('id, title, channel_id, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkshopUI 
        initialSessions={sessions || []}
        channels={channels || []}
      />
    </div>
  );
}
