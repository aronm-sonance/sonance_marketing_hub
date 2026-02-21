"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, MessageSquare, AlertCircle, CheckCircle, Send, Globe, Calendar } from "lucide-react";

export default function PostDetailUI({
  post,
  history,
  channels,
  platforms,
  contentTypes,
  userRole,
  channelRole,
  currentUserId
}: {
  post: any;
  history: any[];
  channels: any[];
  platforms: any[];
  contentTypes: any[];
  userRole: string;
  channelRole: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  
  const [formData, setFormData] = useState({
    title: post.title || "",
    content: post.content || "",
    channel_id: post.channel_id,
    platform_id: post.platform_id,
    content_type_id: post.content_type_id,
    image_url: post.image_url || "",
    publish_date: post.publish_date ? new Date(post.publish_date).toISOString().slice(0, 16) : ""
  });

  const isAdmin = userRole === "admin";
  const isAuthor = post.author_id === currentUserId;
  const isApprover = channelRole === "approver";
  const canEdit = (isAuthor || isAdmin) && (post.status === "draft" || post.status === "changes_requested" || isAdmin);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Update failed");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async (status: string, commentOverride?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_status: status, comment: commentOverride || comment })
      });
      if (!res.ok) throw new Error("Transition failed");
      setShowCommentInput(false);
      setComment("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to change status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="bg-white/5 border border-white/10 rounded-md p-6 space-y-6">
            <h2 className="text-xl font-bold mb-4">Edit Post</h2>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Title</label>
              <input
                type="text"
                className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Channel</label>
                <select
                  className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
                  value={formData.channel_id}
                  onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                >
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Platform</label>
                <select
                  className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
                  value={formData.platform_id}
                  onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                >
                  {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Content</label>
              <textarea
                rows={12}
                className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors resize-none text-sm"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Image URL</label>
              <input
                type="url"
                className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Publish Date</label>
              <input
                type="datetime-local"
                className="w-full bg-black border border-white/10 rounded-md py-2 px-3 focus:outline-none focus:border-white/20 transition-colors text-sm [color-scheme:dark]"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-md overflow-hidden">
              {post.image_url && (
                <div className="aspect-video w-full bg-white/5 border-b border-white/10 overflow-hidden">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-8">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-white/80 leading-relaxed">
                  {post.content || <em className="text-white/20">No content provided.</em>}
                </div>
              </div>
            </div>

            {/* History */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center">
                <Clock className="w-5 h-5 mr-2" /> Status History
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-md divide-y divide-white/5">
                {history.length > 0 ? history.map((log) => (
                  <div key={log.id} className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white/80">{log.actor.full_name}</span>
                        <span className="text-xs text-white/20">changed status to</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60">
                          {log.to_status.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/20">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.comment && (
                      <div className="mt-2 text-sm text-white/40 pl-4 border-l border-white/10 italic">
                        "{log.comment}"
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="p-8 text-center text-white/20 text-sm">
                    No status changes logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-md p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Post Info</h2>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Platform</div>
              <div className="flex items-center text-sm font-medium">
                <Globe className="w-4 h-4 mr-2 text-white/40" />
                {post.platform.name}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Channel</div>
              <div className="flex items-center text-sm font-medium">
                <CheckCircle className="w-4 h-4 mr-2 text-white/40" />
                {post.channel.name}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Type</div>
              <div className="flex items-center text-sm font-medium">
                <MessageSquare className="w-4 h-4 mr-2 text-white/40" />
                {post.content_type.name}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-1">Publish Date</div>
              <div className="flex items-center text-sm font-medium">
                <Calendar className="w-4 h-4 mr-2 text-white/40" />
                {post.publish_date ? new Date(post.publish_date).toLocaleString() : "Not set"}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-white/10 border border-white/10 text-white py-2 rounded-md text-sm font-bold hover:bg-white/20 transition-all"
              >
                Edit Content
              </button>
            )}

            {/* Transition Actions */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-wider mt-4 mb-2">Actions</div>
              
              {showCommentInput ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full bg-black border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-white/20 transition-colors resize-none"
                    placeholder="Add a comment..."
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTransition(nextStatus)}
                      disabled={loading}
                      className="flex-1 bg-white text-black py-2 rounded-md text-xs font-bold hover:bg-white/90 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowCommentInput(false)}
                      className="px-3 py-2 bg-white/5 rounded-md text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Draft -> Pending (Author) */}
                  {(post.status === "draft" || post.status === "changes_requested") && (isAuthor || isAdmin) && (
                    <button
                      onClick={() => handleTransition("pending")}
                      disabled={loading}
                      className="w-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 py-2 rounded-md text-sm font-bold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Submit for Review
                    </button>
                  )}

                  {/* Pending -> Approved/Changes (Approver) */}
                  {post.status === "pending" && (isApprover || isAdmin) && (
                    <>
                      <button
                        onClick={() => handleTransition("approved")}
                        disabled={loading}
                        className="w-full bg-green-500/20 text-green-500 border border-green-500/30 py-2 rounded-md text-sm font-bold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setNextStatus("changes_requested");
                          setShowCommentInput(true);
                        }}
                        disabled={loading}
                        className="w-full bg-orange-500/20 text-orange-500 border border-orange-500/30 py-2 rounded-md text-sm font-bold hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" /> Request Changes
                      </button>
                    </>
                  )}

                  {/* Approved -> Scheduled */}
                  {post.status === "approved" && (isAdmin || isAuthor || isApprover) && (
                    <button
                      onClick={() => handleTransition("scheduled")}
                      disabled={loading}
                      className="w-full bg-blue-500/20 text-blue-500 border border-blue-500/30 py-2 rounded-md text-sm font-bold hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" /> Mark as Scheduled
                    </button>
                  )}

                  {/* Scheduled -> Published */}
                  {post.status === "scheduled" && (isAdmin || isAuthor || isApprover) && (
                    <button
                      onClick={() => handleTransition("published")}
                      disabled={loading}
                      className="w-full bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 py-2 rounded-md text-sm font-bold hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4" /> Publish Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
