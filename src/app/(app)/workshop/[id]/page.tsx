import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkshopSessionUI from "./ui";

export default async function WorkshopSessionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('workshop_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (sessionError || !session) {
    redirect('/workshop');
  }

  // Fetch channels for context selector
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name')
    .order('name');

  // Fetch all user's sessions for sidebar
  const { data: allSessions } = await supabase
    .from('workshop_sessions')
    .select('id, title, channel_id, status, created_at, updated_at')
    .order('updated_at', { ascending: false });

  // Fetch messages for this session
  const { data: messages } = await supabase
    .from('workshop_messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkshopSessionUI 
        session={session}
        initialMessages={messages || []}
        allSessions={allSessions || []}
        channels={channels || []}
      />
    </div>
  );
}
