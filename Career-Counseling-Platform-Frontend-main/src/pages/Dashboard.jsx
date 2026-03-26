import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Input } from '../components/ui/BaseComponents';
import { 
  BookOpen, 
  Briefcase, 
  MessageCircle, 
  TrendingUp, 
  ArrowRight, 
  Edit2, 
  Trash2,
  Plus,
  X, 
  Video, 
  Loader2,
  Users,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { supabase } from '../utils/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // ── Platform Updates (existing) ─────────────────────────────────────────
  const { 
    data: updates, 
    addItem: addUpdate, 
    updateItem: updateUpdate, 
    deleteItem: deleteUpdate, 
    loading: updatesLoading 
  } = useSupabaseData('platform_updates', {
    orderBy: { column: 'created_at', ascending: false }
  });

  // ── Recent Activities (existing) ────────────────────────────────────────
  const { 
    data: recentActivities, 
    addItem: addActivity,
    deleteItem: deleteActivity,
    loading: activitiesLoading 
  } = useSupabaseData('activities', {
    orderBy: { column: 'created_at', ascending: false },
    filter: isAdmin ? {} : { user_id: user?.id }
  });

  // ── Dynamic stat counts ─────────────────────────────────────────────────
  const [statCounts, setStatCounts] = useState({
    applications: 0,
    courses: 0,
    counseling: 0,
    posts: 0,
    loading: true
  });

  // ── Upcoming session ────────────────────────────────────────────────────
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ── Profile strength ────────────────────────────────────────────────────
  const [profileStrength, setProfileStrength] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDynamicData = async () => {
      try {
        // Activities: count by type for this user
        const { data: acts } = await supabase
          .from('activities')
          .select('type')
          .eq('user_id', user.id);

        const jobCount    = acts?.filter(a => a.type === 'job').length    ?? 0;
        const courseCount = acts?.filter(a => a.type === 'course').length  ?? 0;
        const chatCount   = acts?.filter(a => a.type === 'chat').length    ?? 0;

        // Community posts by this user
        const { count: postsCount } = await supabase
          .from('forum_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStatCounts({
          applications: jobCount,
          courses: courseCount,
          counseling: chatCount,
          posts: postsCount ?? 0,
          loading: false
        });

        // Profile strength: +20 for each: name, email, role, has activity, has post
        let strength = 0;
        if (user.name)  strength += 20;
        if (user.email) strength += 20;
        if (user.role)  strength += 20;
        if ((acts?.length ?? 0) > 0) strength += 20;
        if ((postsCount ?? 0) > 0)   strength += 20;
        setProfileStrength(strength);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setStatCounts(s => ({ ...s, loading: false }));
      }
    };

    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const { data: sessions, error } = await supabase
          .from('counseling_sessions')
          .select('*')
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1);

        if (error) {
          // Silent failure if table doesn't exist
          return;
        }

        if (sessions && sessions.length > 0) {
          setUpcomingSession(sessions[0]);
        }
      } catch (err) {
        // Fail silently
      } finally {
        setSessionLoading(false);
      }
    };

    fetchDynamicData();
    fetchSession();
  }, [user?.id]);

  // ── Edit state for platform updates ────────────────────────────────────
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  // ── Feedback form ──────────────────────────────────────────────────────
  const [feedbackText, setFeedbackText]       = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone]       = useState(false);

  const handleFeedback = async () => {
    if (!feedbackText.trim() || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await supabase.from('feedback').insert([{
        user_id: user?.id,
        user_name: user?.name || 'Anonymous',
        message: feedbackText.trim(),
        created_at: new Date().toISOString()
      }]);
      setFeedbackText('');
      setFeedbackDone(true);
      setTimeout(() => setFeedbackDone(false), 4000);
    } catch (err) {
      console.error('Feedback error:', err);
      alert('Could not submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // ── Manual Activity form ──────────────────────────────────────────────
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ title: '', type: 'job' });

  const handleSaveActivity = async () => {
    if (!activityForm.title.trim()) return;
    try {
      await addActivity({
        user_id: user.id,
        title: activityForm.title.trim(),
        type: activityForm.type,
        created_at: new Date().toISOString()
      });
      setIsAddingActivity(false);
      setActivityForm({ title: '', type: 'job' });
    } catch (err) {
      alert('Error adding activity: ' + err.message);
    }
  };


  const handleEditUpdate = (update) => {
    setEditingUpdate(update.id);
    setEditForm({ title: update.title, description: update.description });
  };

  const handleSaveUpdate = async () => {
    try {
      if (editingUpdate && typeof editingUpdate === 'number') {
        await updateUpdate(editingUpdate, editForm);
      } else {
        await addUpdate({ ...editForm, user_id: user.id });
      }
      setEditingUpdate(null);
    } catch (err) {
      alert('Error saving update: ' + err.message);
    }
  };

  // ── Dynamic stats config ────────────────────────────────────────────────
  const stats = [
    { 
      label: 'Applications', 
      value: statCounts.loading ? '—' : String(statCounts.applications), 
      icon: <Briefcase size={20} className="text-blue-600" />, 
      change: statCounts.applications > 0 ? `${statCounts.applications} logged` : 'None yet'
    },
    { 
      label: 'Courses', 
      value: statCounts.loading ? '—' : String(statCounts.courses), 
      icon: <BookOpen size={20} className="text-emerald-600" />, 
      change: statCounts.courses > 0 ? `${statCounts.courses} activities` : 'None yet'
    },
  ];

  // ── Upcoming session display helpers ───────────────────────────────────
  const formatSession = (session) => {
    if (!session) return null;
    const d = new Date(session.scheduled_at);
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      day: d.getDate(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: session.title || 'Counseling Session',
      counselor: session.counselor_name || 'Your Counselor'
    };
  };

  const defaultSession = {
    id: 1,
    title: 'Career Consultation',
    counselor_name: 'Sarah Miller',
    scheduled_at: new Date().toISOString() 
  };

  const safeSession = upcomingSession || defaultSession;
  const sessionDisplay = formatSession(safeSession);

  // If we have a local override for the link, use it for the "Join" button
  const localLink = localStorage.getItem(`cp_meeting_link_${safeSession.id}`);
  const finalMeetingLink = localLink || safeSession.link || 'https://meet.google.com/mff-sixv-xwe';

  return (
    <div className="p-8 lg:p-12">
      <div className="mx-auto max-w-[1600px]">
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">System Online</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight transition-colors">
              Welcome back, <span className="text-gradient italic font-serif font-normal">{user?.name?.split(' ')[0]}</span>.
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">Profile Strength</p>
              <p className="text-lg font-bold text-[var(--text-primary)] transition-colors">{profileStrength}% Complete</p>
            </div>
            <div className="h-12 w-32 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden p-1 border border-[var(--border-subtle)] transition-colors">
              <div className="h-full bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-700" style={{ width: `${profileStrength}%` }} />
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Main Hero Bento */}
          <div className="md:col-span-8 bento-item bg-[var(--brand-solid)] text-white relative overflow-hidden group border border-[var(--brand-solid)] shadow-lg shadow-[var(--brand-solid)]/10">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <Badge className="bg-white/20 text-white border-none rounded-full px-4 mb-8 backdrop-blur-md">Active Journey</Badge>
                <h2 className="text-4xl font-bold mb-4 leading-tight">Your career is on <br /> an upward trajectory.</h2>
                <p className="text-white/70 max-w-md leading-relaxed">
                  {statCounts.applications > 0
                    ? `You've logged ${statCounts.applications} job application${statCounts.applications > 1 ? 's' : ''} and ${statCounts.courses} course${statCounts.courses !== 1 ? 's' : ''}. Keep it up!`
                    : "Start logging your applications and courses to track your career progress here."}
                </p>
              </div>
              <div className="mt-12">
                {/* Stats removed per user request */}
              </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
                alt="Data" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 blur-[100px] rounded-full" />
          </div>

          {/* Counseling Quick Action */}
          <div className="md:col-span-4 bento-item bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] super-shadow flex flex-col justify-between group transition-all duration-300">
            <div className="h-14 w-14 rounded-2xl bg-[var(--brand-solid)]/10 flex items-center justify-center text-[var(--brand-solid)] mb-8 transition-colors">
              <MessageCircle size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 transition-colors text-[var(--text-primary)]">AI Counseling</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 transition-colors">
                {statCounts.counseling > 0
                  ? `You've had ${statCounts.counseling} counseling session${statCounts.counseling > 1 ? 's' : ''}. Ready for the next one?`
                  : "Ready for your first session? Our AI is prepared with career insights for you."}
              </p>
              <Link to="/counseling">
                <Button className="w-full bg-[var(--brand-solid)] text-white hover:opacity-90 border-none rounded-2xl py-6 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[var(--brand-solid)]/10">
                  Resume Session
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Activity Bento */}
          <div className="md:col-span-12 lg:col-span-5 bento-item bg-[var(--bg-elevated)] super-shadow border border-[var(--border-subtle)] p-0 overflow-hidden transition-all duration-300">
            <div className="p-8 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-display transition-colors">Recent Activity</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="text-[var(--brand-solid)] font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsAddingActivity(!isAddingActivity)}>
                    {isAddingActivity ? 'Cancel' : 'Add'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-[var(--brand-solid)] font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all">View All</Button>
              </div>
            </div>
            <div className="divide-y divide-[var(--border-subtle)] transition-colors">
              {isAddingActivity && (
                <div className="p-6 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] space-y-4">
                  <Input 
                    placeholder="Activity title (e.g. Posted a new job)" 
                    value={activityForm.title}
                    onChange={(e) => setActivityForm({...activityForm, title: e.target.value})}
                    className="text-sm rounded-xl"
                  />
                  <div className="flex items-center gap-4">
                    <select 
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--brand-solid)]/20"
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                    >
                      <option value="job">Job</option>
                      <option value="course">Course</option>
                      <option value="chat">Chat</option>
                      <option value="forum">Forum</option>
                      <option value="general">General</option>
                    </select>
                    <Button size="sm" onClick={handleSaveActivity} disabled={!activityForm.title.trim()}>Save Activity</Button>
                  </div>
                </div>
              )}
              {activitiesLoading ? (
                <div className="p-8 flex justify-center"><Loader2 size={24} className="animate-spin text-[var(--brand-solid)]" /></div>
              ) : recentActivities.length > 0 ? recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 px-8 py-5 hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-elevated)] transition-colors border border-[var(--border-subtle)]">
                    {activity.type === 'course'  && <BookOpen size={20} className="text-[var(--success-text)]" />}
                    {activity.type === 'job'   && <Briefcase size={20} className="text-[var(--info-text)]" />}
                    {activity.type === 'chat'  && <MessageCircle size={20} className="text-[var(--brand-solid)]" />}
                    {activity.type === 'forum' && <Users size={20} className="text-amber-500" />}
                    {!['course','job','chat','forum'].includes(activity.type) && <TrendingUp size={20} className="text-[var(--text-secondary)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate transition-colors">{activity.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] font-bold text-[var(--brand-solid)] uppercase tracking-widest">
                          • {activity.user_id === user.id ? 'You' : 'User'}
                        </span>
                      )}
                      <Badge className="text-[10px] px-2 py-0 capitalize border-none bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin ? (
                    <button 
                      onClick={() => deleteActivity(activity.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-secondary)] hover:text-[var(--error-text)] transition-all"
                      title="Delete activity"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <ArrowRight size={16} className="text-[var(--text-secondary)]/40 group-hover:text-[var(--brand-solid)] transition-colors" />
                  )}
                </div>
              )) : (
                <div className="p-8 text-center space-y-2">
                  <TrendingUp size={32} className="mx-auto text-[var(--text-secondary)]/30" />
                  <p className="text-sm text-[var(--text-secondary)]">No activity yet — start applying to jobs or taking courses!</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Session Bento */}
          <div className="md:col-span-12 lg:col-span-7 bento-item bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-between gap-8 group transition-all duration-300">
            {sessionLoading ? (
              <div className="flex items-center gap-4">
                <Loader2 size={24} className="animate-spin text-[var(--brand-solid)]" />
                <span className="text-sm text-[var(--text-secondary)]">Loading session...</span>
              </div>
            ) : sessionDisplay ? (
              <>
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-[var(--bg-elevated)] super-shadow border border-[var(--border-subtle)] text-[var(--brand-solid)] shrink-0 transition-all group-hover:scale-105">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">{sessionDisplay.month}</span>
                    <span className="text-2xl font-extrabold text-[var(--text-primary)]">{sessionDisplay.day}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-extrabold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Starting one</span>
                    </div>
                    <p className="text-lg font-bold text-[var(--text-primary)] transition-colors">{sessionDisplay.title}</p>
                    <p className="text-sm text-[var(--text-secondary)] transition-colors">{sessionDisplay.counselor} • {sessionDisplay.time}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open(finalMeetingLink, '_blank')}
                  className="rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--brand-solid)] hover:text-white px-8 py-6 font-bold uppercase tracking-widest text-[10px] border-none shadow-lg transition-all duration-300"
                >
                  Join Google Meeting
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-[var(--bg-elevated)] super-shadow border border-[var(--border-subtle)] shrink-0 transition-all">
                    <Video size={24} className="text-[var(--text-secondary)]/50" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)] transition-colors">No Upcoming Session</p>
                    <p className="text-sm text-[var(--text-secondary)] transition-colors">Book a counseling session to see it here</p>
                  </div>
                </div>
                <Link to="/counseling">
                  <Button className="rounded-2xl bg-[var(--brand-solid)] text-white hover:opacity-90 px-8 py-6 font-bold uppercase tracking-widest text-[10px] border-none shadow-lg transition-all duration-300">
                    Book Session
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Platform Updates Bento */}
          <div className="md:col-span-12 lg:col-span-4 bento-item bg-[var(--bg-elevated)] super-shadow border border-[var(--border-subtle)] group transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-display transition-colors">Platform Updates</h3>
              {isAdmin && (
                <Button variant="ghost" size="sm" className="text-[var(--brand-solid)] font-bold text-[10px] uppercase tracking-widest" onClick={() => {
                  setEditingUpdate('new');
                  setEditForm({ title: 'New Update', description: 'Description here' });
                }}>
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-8">
              {updatesLoading ? (
                <div className="flex justify-center"><Loader2 size={24} className="animate-spin text-[var(--brand-solid)]" /></div>
              ) : updates.map((update) => (
                <div key={update.id} className="relative group pl-5 border-l-4 border-[var(--brand-solid)]">
                  {editingUpdate === update.id ? (
                    <div className="space-y-3">
                      <Input 
                        value={editForm.title} 
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                        className="rounded-xl text-xs"
                      />
                      <textarea 
                        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-xs focus:ring-2 focus:ring-[var(--brand-solid)] transition-all text-[var(--text-primary)]"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveUpdate} className="rounded-lg">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingUpdate(null)} className="rounded-lg">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-[var(--text-primary)] transition-colors">{update.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed transition-colors">{update.description}</p>
                      {isAdmin && (
                        <div className="absolute right-0 top-0 hidden group-hover:flex gap-2">
                          <button onClick={() => handleEditUpdate(update)} className="text-[var(--text-secondary)] hover:text-[var(--brand-solid)] transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteUpdate(update.id)} className="text-[var(--text-secondary)] hover:text-[var(--error-text)] transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editingUpdate === 'new' && (
                <div className="relative group pl-5 border-l-4 border-[var(--brand-solid)]">
                  <div className="space-y-3">
                    <Input 
                      value={editForm.title} 
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                      className="rounded-xl text-xs"
                    />
                    <textarea 
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-xs focus:ring-2 focus:ring-[var(--brand-solid)] transition-all text-[var(--text-primary)]"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveUpdate} className="rounded-lg">Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingUpdate(null)} className="rounded-lg">Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback & Community Bento */}
          <div className="md:col-span-12 lg:col-span-8 bento-item bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col md:flex-row gap-12 items-center group transition-all duration-300">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-display transition-colors">Help us shape the future.</h3>
              <p className="text-[var(--text-secondary)] mb-8 leading-relaxed transition-colors">
                Your feedback directly influences our AI training models. Tell us what you need to succeed.
              </p>
              <textarea 
                className="w-full rounded-[2.5rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-solid)]/20 mb-6 transition-all super-shadow focus:outline-none placeholder-[var(--text-secondary)]/50"
                rows={3}
                placeholder="What feature should we build next?"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              {feedbackDone ? (
                <div className="flex items-center gap-3 text-[var(--success-text)] font-bold text-sm">
                  <Check size={20} /> Thank you! Your feedback was submitted.
                </div>
              ) : (
                <Button
                  onClick={handleFeedback}
                  disabled={!feedbackText.trim() || feedbackSubmitting}
                  className="rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--brand-solid)] hover:text-white font-bold py-6 px-12 border-none uppercase tracking-widest text-[10px] shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {feedbackSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Feedback'}
                </Button>
              )}
            </div>
            <div className="flex-1 relative hidden md:block">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square rounded-[2rem] bg-[var(--bg-elevated)] super-shadow p-6 flex items-center justify-center transition-all hover:scale-105 border border-[var(--border-subtle)]">
                    <div className="h-full w-full rounded-2xl bg-[var(--bg-secondary)] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon, loading }) {
  return (
    <div className="bento-item bg-[var(--bg-elevated)] super-shadow border border-[var(--border-subtle)] flex flex-col justify-between p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-subtle)] transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[var(--success-text)] transition-colors">{change}</span>
      </div>
      <div>
        <p className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-widest mb-1 transition-colors">{label}</p>
        {loading ? (
          <Loader2 size={24} className="animate-spin text-[var(--brand-solid)] mt-1" />
        ) : (
          <p className="text-3xl font-bold text-[var(--text-primary)] transition-colors">{value}</p>
        )}
      </div>
    </div>
  );
}