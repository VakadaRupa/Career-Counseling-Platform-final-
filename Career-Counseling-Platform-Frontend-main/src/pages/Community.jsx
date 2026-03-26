import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Badge } from '../components/ui/BaseComponents';
import { useAuth } from '../context/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../utils/supabase';
import { Users, Send, Edit2, Trash2, Globe, Heart, MessageCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Community() {
  const { user } = useAuth();

  const currentUser = user ? { ...user, name: user.name || "Colleague" } : { id: 'guest', name: "Guest", role: "user" };

  const [activeMembers] = useState([
    { id: '1111', name: "Alice Jenkins", role: "Senior Engineer", status: "online" },
    { id: '2222', name: "John Smith", role: "Product Manager", status: "online" },
    { id: '00000000-0000-0000-0000-000000000001', name: "System Admin", role: "admin", status: "online" },
    { id: '4444', name: "Michael Ross", role: "user", status: "online" }
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [postText, setPostText] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set()); // kept for auto-expand after posting
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [allComments, setAllComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const { data: posts, addItem: addPost, updateItem: editPost, deleteItem: removePost, setData: setPostsData } = useSupabaseData('forum_posts', {
    orderBy: { column: 'created_at', ascending: false }
  });

  const { data: messages, addItem: addMessage, setData: setMessagesData } = useSupabaseData('messages', {
    orderBy: { column: 'created_at', ascending: true }
  });

  const messagesEndRef = useRef(null);

  // Fetch all comments once on mount + subscribe to realtime
  useEffect(() => {
    const fetchComments = async () => {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error) setAllComments(data || []);
      setCommentsLoading(false);
    };

    fetchComments();

    const subscription = supabase
      .channel('post_comments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAllComments(prev => {
            // If we already have this record (placed by the optimistic→real swap), don't add it again
            if (prev.some(c => c.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setAllComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now';
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPostComments = (postId) => allComments.filter(c => c.post_id === postId);

  // ---------------- CHAT ----------------
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      from_id: currentUser.id,
      to_id: selectedUser.id,
      from_name: currentUser.name,
      to_name: selectedUser.name,
      text: messageText,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessagesData(prev => [...prev, newMessage]);
    const textToClear = messageText;
    setMessageText("");

    try {
      const inserted = await addMessage({
        from_id: currentUser.id,
        to_id: selectedUser.id,
        from_name: currentUser.name,
        to_name: selectedUser.name,
        text: textToClear
      });
      // Replace the optimistic entry with the real DB record.
      // This prevents the realtime INSERT event from creating a duplicate.
      if (inserted) {
        setMessagesData(prev =>
          prev.map(m => m.id === tempId ? inserted : m)
        );
      }
    } catch (err) {
      console.error("Chat error", err);
      setMessagesData(prev => prev.filter(m => m.id !== tempId));
      setMessageText(textToClear);
    }
  };

  const chatMessages = messages
    .filter(
      (m) =>
        (m.from_id === currentUser.id && m.to_id === selectedUser?.id) ||
        (m.from_id === selectedUser?.id && m.to_id === currentUser.id)
    )
    // Remove any optimistic entries whose real DB version already exists
    .filter((msg, _i, self) => {
      if (msg.isOptimistic) {
        return !self.some(m => !m.isOptimistic && m.text === msg.text && m.from_id === msg.from_id);
      }
      // Remove real duplicates by id (keep first occurrence)
      return self.findIndex(m => m.id === msg.id) === self.indexOf(msg);
    });

  // ---------------- POSTS ----------------
  const createPost = async () => {
    if (!postText.trim()) return;

    const tempId = Date.now().toString();
    const newPostOptimistic = {
      id: tempId,
      author: currentUser.name,
      role: currentUser.role === "admin" ? "Administrator" : "Team Member",
      content: postText,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setPostsData(prev => [newPostOptimistic, ...prev]);
    const textToClear = postText;
    setPostText("");

    try {
      await addPost({
        author: currentUser.name,
        title: "Community Update",
        content: textToClear,
        category: "General",
        likes: 0,
        comments: 0,
        user_id: currentUser.id
      });
    } catch (err) {
      console.error("Post error", err);
      setPostsData(prev => prev.filter(p => p.id !== tempId));
      setPostText(textToClear);
    }
  };

  const updatePost = async (id) => {
    try {
      await editPost(id, { content: postText });
      setEditingPostId(null);
      setPostText("");
    } catch (err) { console.error("Edit error", err); }
  };

  const deletePost = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await removePost(id);
      } catch (err) { console.error("Delete error", err); }
    }
  };

  const canEditOrDelete = (post) => {
    return post.author === currentUser.name || currentUser.role === "admin";
  };

  const handleLike = async (post) => {
    if (likedPosts.has(post.id)) return;

    const newLikes = (post.likes || 0) + 1;
    setPostsData(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    setLikedPosts(prev => new Set(prev).add(post.id));

    try {
      await editPost(post.id, { likes: newLikes });
    } catch (err) {
      console.error("Like error", err);
      setPostsData(prev => prev.map(p => p.id === post.id ? { ...p, likes: post.likes } : p));
      setLikedPosts(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  // Submit a real comment saved to `post_comments` table
  const handleComment = async (postId) => {
    if (!commentText.trim()) return;

    const tempComment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      user_id: currentUser.id,
      author: currentUser.name,
      text: commentText,
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    // Optimistically show it
    setAllComments(prev => [...prev, tempComment]);
    const savedText = commentText;
    setCommentText("");
    setUploading(true);

    try {
      const { data: inserted, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: currentUser.id,
          author: currentUser.name,
          text: savedText
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic with real
      setAllComments(prev => prev.map(c => c.id === tempComment.id ? inserted : c));

      // Update comment count on the post
      const post = posts.find(p => p.id === postId);
      const newCount = (post?.comments || 0) + 1;
      await editPost(postId, { comments: newCount });

      // Auto-expand so user sees their comment right away
      setExpandedComments(prev => new Set(prev).add(postId));
    } catch (err) {
      console.error("Comment error", err);
      setAllComments(prev => prev.filter(c => c.id !== tempComment.id));
      setCommentText(savedText);
    } finally {
      setUploading(false);
    }
  };

  const deleteComment = async (comment, postId) => {
    setAllComments(prev => prev.filter(c => c.id !== comment.id));
    try {
      await supabase.from('post_comments').delete().eq('id', comment.id);
      const post = posts.find(p => p.id === postId);
      const newCount = Math.max((post?.comments || 1) - 1, 0);
      await editPost(postId, { comments: newCount });
    } catch (err) {
      console.error("Delete comment error", err);
      setAllComments(prev => [...prev, comment]);
    }
  };
  const toggleComments = (postId) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };


  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-[var(--brand-solid)] animate-pulse" />
              <span className="text-[10px] font-extrabold text-[var(--text-secondary)]/60 uppercase tracking-[0.2em]">Global Network</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight transition-colors">
              MNC <span className="text-gradient italic font-serif font-normal">Community</span>.
            </h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar: Network Directory */}
          <aside className="lg:w-80 shrink-0 space-y-6">
            <div className="glass-card p-6 rounded-3xl sticky top-28 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all duration-300">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 transition-colors">Company Directory</h2>
                  <p className="text-xs text-[var(--text-secondary)] transition-colors">Connect with colleagues globally.</p>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-[var(--brand-solid)]/10 text-[var(--brand-solid)]">
                  <Users size={20} />
                </div>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUser(member)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border ${selectedUser?.id === member.id ? 'bg-[var(--brand-solid)]/10 border-[var(--brand-solid)]/20 shadow-sm text-[var(--brand-solid)]' : 'hover:bg-[var(--bg-secondary)] border-transparent text-[var(--text-primary)]'}`}
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] flex items-center justify-center font-bold font-serif text-lg">
                        {member.name.charAt(0)}
                      </div>
                      <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--bg-elevated)] ${member.status === 'online' ? 'bg-[var(--success-text)]' : 'bg-[var(--text-secondary)]/30'}`} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate transition-colors`}>{member.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-medium truncate uppercase tracking-wider transition-colors">{member.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Middle: Global Feed */}
          <main className="flex-1 space-y-6">
            {/* Post Composer */}
            <Card className="p-6 rounded-3xl border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all duration-300">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-[var(--brand-solid)] text-white flex items-center justify-center font-bold text-lg font-serif shrink-0 shadow-sm transition-colors">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={editingPostId ? "Update your announcement..." : "Share an update with the global network..."}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-4 focus:ring-2 focus:ring-[var(--brand-solid)]/20 focus:border-[var(--brand-solid)] transition-all resize-none min-h-[120px] text-sm text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-secondary)]/50"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-2 transition-colors">
                      <Globe size={14} /> Visible to all employees
                    </div>
                    <div className="flex gap-2">
                      {editingPostId && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingPostId(null); setPostText(""); }} className="rounded-xl">
                          Cancel
                        </Button>
                      )}
                      <Button onClick={() => editingPostId ? updatePost(editingPostId) : createPost()} disabled={!postText.trim() || uploading} className="rounded-xl px-6 bg-[var(--brand-solid)] hover:opacity-90 disabled:opacity-50 disabled:bg-[var(--bg-secondary)] text-white shadow-lg shadow-[var(--brand-solid)]/10">
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : (editingPostId ? "Update" : "Publish Update")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Posts Stream */}
            <div className="space-y-6">
              <AnimatePresence>
                {posts.filter((post, index, self) => {
                  if (post.isOptimistic) {
                    return !self.some(p => !p.isOptimistic && p.content === post.content && p.user_id === post.user_id);
                  }
                  return true;
                }).map((post) => {
                  const postComments = getPostComments(post.id);
                  const commentsExpanded = expandedComments.has(post.id);
                  const commentInputOpen = activeCommentId === post.id;

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="overflow-hidden rounded-3xl border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="p-6 sm:p-8">
                          {/* Post Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4 items-center">
                              <div className="h-12 w-12 rounded-full bg-[var(--brand-solid)]/10 border border-[var(--brand-solid)]/20 text-[var(--brand-solid)] flex items-center justify-center font-bold text-lg font-serif transition-colors">
                                {post.author?.charAt(0).toUpperCase() || "C"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-[var(--text-primary)] transition-colors">{post.author || "Colleague"}</h3>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] font-medium transition-colors">{formatDate(post.created_at)}</p>
                              </div>
                            </div>

                            {canEditOrDelete(post) && (
                              <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl transition-colors">
                                <button onClick={() => { setEditingPostId(post.id); setPostText(post.content); }} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-solid)] hover:bg-[var(--bg-elevated)] rounded-xl transition-all">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => deletePost(post.id)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--error-text)] hover:bg-[var(--bg-elevated)] rounded-xl transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Post Content */}
                          <p className="text-[var(--text-primary)]/80 leading-relaxed whitespace-pre-line mb-6 ml-0 sm:ml-16 transition-colors">
                            {post.content}
                          </p>

                          {/* Instagram-style Like / Comment section */}
                          <div className="ml-0 sm:ml-16 pt-3 border-t border-[var(--border-subtle)] flex flex-col transition-colors">

                            {/* Action buttons row */}
                            <div className="flex items-center gap-5 py-1">
                              <button
                                onClick={() => handleLike(post)}
                                disabled={likedPosts.has(post.id)}
                                className={`flex items-center gap-1.5 text-sm transition-all active:scale-110 ${likedPosts.has(post.id) ? 'text-[var(--error-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--error-text)]'}`}
                              >
                                <Heart size={22} fill={likedPosts.has(post.id) ? "currentColor" : "none"} strokeWidth={1.8} />
                              </button>

                              <button
                                onClick={() => {
                                  setActiveCommentId(commentInputOpen ? null : post.id);
                                  if (!commentInputOpen) {
                                    setCommentText("");
                                    setExpandedComments(prev => new Set(prev).add(post.id));
                                    setTimeout(() => document.getElementById(`comment-input-${post.id}`)?.focus(), 100);
                                  }
                                }}
                                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${commentInputOpen ? 'text-[var(--brand-solid)]' : 'text-[var(--text-secondary)] hover:text-[var(--brand-solid)]'}`}
                              >
                                <MessageCircle size={22} strokeWidth={1.8} />
                                {postComments.length > 0 && (
                                  <span className="text-sm">{postComments.length}</span>
                                )}
                              </button>
                            </div>

                            {/* Likes count — Instagram style */}
                            {post.likes > 0 && (
                              <p className="text-sm font-bold text-[var(--text-primary)] mt-1 mb-1 transition-colors">
                                {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                              </p>
                            )}

                            {/* "View all X comments" link */}
                            {postComments.length > 0 && !commentsExpanded && (
                              <button
                                onClick={() => toggleComments(post.id)}
                                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-left mt-1 mb-1 transition-colors"
                              >
                                View all {postComments.length} {postComments.length === 1 ? 'comment' : 'comments'}
                              </button>
                            )}


                            {/* Instagram-style Comments Section */}
                            <AnimatePresence>
                              {commentInputOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 space-y-1"
                                >
                                  {/* Inline comment list */}
                                  {postComments.map((comment) => (
                                    <motion.div
                                      key={comment.id}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: comment.isOptimistic ? 0.55 : 1, y: 0 }}
                                      className="flex items-start gap-2.5 group py-0.5"
                                    >
                                      <div className="h-7 w-7 rounded-full bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        {comment.author?.charAt(0).toUpperCase() || "?"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[var(--text-primary)] leading-snug break-words">
                                          <span className="font-bold mr-1.5">{comment.author || "User"}</span>
                                          {comment.text}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{formatDate(comment.created_at)}</p>
                                      </div>
                                      {currentUser.role === 'admin' && !comment.isOptimistic && (
                                        <button
                                          onClick={() => deleteComment(comment, post.id)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--text-secondary)] hover:text-[var(--error-text)] rounded-md mt-0.5 shrink-0"
                                          title="Delete"
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </motion.div>
                                  ))}

                                  {/* Minimal Instagram-style input */}
                                  <div className="flex items-center gap-2.5 pt-2 mt-1 border-t border-[var(--border-subtle)]">
                                    <div className="h-7 w-7 rounded-full bg-[var(--brand-solid)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {currentUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <input
                                      id={`comment-input-${post.id}`}
                                      type="text"
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                      placeholder="Add a comment…"
                                      autoFocus
                                      className="flex-1 bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none placeholder-[var(--text-secondary)]/50"
                                    />
                                    <button
                                      onClick={() => handleComment(post.id)}
                                      disabled={!commentText.trim() || uploading}
                                      className="text-[var(--brand-solid)] text-sm font-bold hover:opacity-75 disabled:opacity-30 transition-opacity shrink-0"
                                    >
                                      {uploading ? <Loader2 size={14} className="animate-spin" /> : "Post"}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </main>

          {/* Right Area: Chat Panel */}
          {selectedUser && (
            <aside className="lg:w-96 w-full shrink-0 flex flex-col">
              <div className="glass-card rounded-3xl lg:sticky lg:top-28 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col h-[500px] lg:h-[700px] overflow-hidden transition-all duration-300">
                <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 flex items-center justify-between shrink-0 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] flex items-center justify-center font-bold text-lg font-serif transition-colors">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] leading-tight transition-colors">{selectedUser.name}</h3>
                      <p className="text-xs text-[var(--brand-solid)] font-medium flex items-center gap-1 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success-text)] animate-pulse inline-block" /> Active Session
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] p-2 rounded-xl border border-[var(--border-subtle)] transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-secondary)]/20 transition-colors duration-300 custom-scrollbar">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                      <div className="h-16 w-16 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]/30 rounded-full flex items-center justify-center shadow-sm mb-2 transition-colors">
                        <MessageCircle size={28} />
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)] transition-colors">Direct Message</p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] max-w-[200px] transition-colors">Start a private conversation securely with {selectedUser.name.split(' ')[0]}</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={`flex flex-col ${msg.from_id === currentUser.id ? "items-end" : "items-start"} ${msg.isOptimistic ? "opacity-70" : ""}`}>
                        <div className={`px-5 py-3 rounded-2xl max-w-[85%] ${msg.from_id === currentUser.id ? "bg-[var(--brand-solid)] text-white rounded-br-sm shadow-md" : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-sm shadow-sm transition-all"}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-2 transition-colors">{formatTime(msg.created_at)}</span>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-colors shrink-0">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a corporate message..."
                      className="w-full pl-5 pr-16 py-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl focus:ring-2 focus:ring-[var(--brand-solid)]/20 focus:border-[var(--brand-solid)] focus:outline-none text-sm text-[var(--text-primary)] transition-all placeholder-[var(--text-secondary)]/50"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!messageText.trim() || uploading}
                      className="absolute right-2 h-[42px] w-[42px] bg-[var(--text-primary)] hover:bg-[var(--brand-solid)] hover:scale-105 disabled:opacity-50 text-[var(--bg-primary)] rounded-xl flex items-center justify-center transition-all shadow-lg"
                    >
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>
    </div>
  );
}