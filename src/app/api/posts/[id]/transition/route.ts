import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getResend, getFromAddress } from '@/lib/email/resend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { to_status, comment } = await request.json();

  // 1. Get current post and user role in the channel
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*, channels(id)')
    .eq('id', id)
    .single();

  if (postError || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const { data: membership } = await supabase
    .from('channel_members')
    .select('role')
    .eq('channel_id', post.channel_id)
    .eq('profile_id', user.id)
    .single();

  // Simple validation logic (can be expanded)
  const isApprover = membership?.role === 'approver' || membership?.role === 'creator'; 
  // Normally creator can submit, approver can approve/request changes

  // 2. Update post status
  const from_status = post.status;
  const { error: updateError } = await supabase
    .from('posts')
    .update({ status: to_status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // 3. Log transition
  await adminClient.from('post_status_log').insert([{
    post_id: id,
    from_status,
    to_status,
    changed_by: user.id,
    comment
  }]);

  // 4. Notifications & Email
  // Find who to notify. Usually:
  // - If pending: notify approvers
  // - If changes_requested/approved/published: notify author
  
  const recipients: string[] = [];
  if (to_status === 'pending') {
    const { data: approvers } = await adminClient
      .from('channel_members')
      .select('profile_id, profiles(email)')
      .eq('channel_id', post.channel_id)
      .eq('role', 'approver');
    approvers?.forEach(a => { if (a.profiles?.email) recipients.push(a.profile_id); });
  } else {
    recipients.push(post.author_id);
  }

  const resend = getResend();
  for (const recipientId of recipients) {
    const { data: profile } = await adminClient.from('profiles').select('email, full_name').eq('id', recipientId).single();
    
    // In-app notification
    await adminClient.from('notifications').insert([{
      recipient_id: recipientId,
      type: 'post_status_change',
      title: `Post Status: ${to_status}`,
      body: `Post "${post.title}" changed from ${from_status} to ${to_status}.${comment ? ` Comment: ${comment}` : ''}`,
      post_id: id
    }]);

    // Email
    if (profile?.email) {
      try {
        await resend.emails.send({
          from: getFromAddress(),
          to: profile.email,
          subject: `Post Update: ${post.title}`,
          html: `<p>Hello ${profile.full_name || 'there'},</p><p>The post <strong>${post.title}</strong> has been moved to <strong>${to_status}</strong>.</p>${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ''}<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/library/${id}">View Post</a></p>`
        });
      } catch (e) {
        console.error('Failed to send email', e);
      }
    }
  }

  return NextResponse.json({ success: true });
}
