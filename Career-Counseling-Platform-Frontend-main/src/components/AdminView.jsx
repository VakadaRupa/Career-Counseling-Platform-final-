import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, ListTodo, Users, ArrowLeft, 
  BarChart3, Edit2, Check, X, Type, Mic, Video, Search, 
  Download, Filter, Eye, Settings as SettingsIcon, Activity,
  TrendingUp, AlertCircle, Info, Shield
} from 'lucide-react';
import { 
  getQuestions, addQuestion, deleteQuestion, 
  getAllSubmissions, updateQuestion, deleteSubmission,
  clearAllSubmissions, updateSubmission,
  getSystemLogs, getUserList, updateUserRole, addUser, deleteUser
} from '../lib/supabase';
import { EvaluationResultDisplay } from './EvaluationResultDisplay';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

export const AdminView = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('stats');

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: BarChart3 },
    { id: 'assignments', label: 'Assignments', icon: ListTodo },
    { id: 'submissions', label: 'Submissions', icon: Eye },
    { id: 'logs', label: 'System Logs', icon: Activity },
  ];
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFeedback, setSearchFeedback] = useState(false);
  const [filterMode, setFilterMode] = useState('all');
  const [scoreFilter, setScoreFilter] = useState(null);

  // 2. Detailed View State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [overrideScore, setOverrideScore] = useState(null);

  // 5. Bulk Selection State
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);

  // 10. Activity Log State
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const addLog = (action) => {
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), action, time: new Date() }, ...prev].slice(0, 50));
  };

  const [newQuestion, setNewQuestion] = useState({ 
    text: '', 
    category: 'General',
    allowedModes: ['text', 'audio', 'video']
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [userList, setUserList] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [qData, sData, users, logs] = await Promise.all([
      getQuestions(), 
      getAllSubmissions(),
      getUserList(),
      getSystemLogs()
    ]);
    setQuestions(qData);
    setSubmissions(sData);
    setUserList(users);
    setSystemLogs(logs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadData();
    };
    init();
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.text) return;
    const added = await addQuestion(newQuestion.text, newQuestion.category, newQuestion.allowedModes);
    if (added) {
      setQuestions([...questions, added]);
      setNewQuestion({ text: '', category: 'General', allowedModes: ['text', 'audio', 'video'] });
      addLog(`Added new assignment: "${newQuestion.text.substring(0, 30)}..."`);
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!editForm) return;
    const updated = await updateQuestion(editForm.id, editForm.text, editForm.category, editForm.allowedModes || []);
    if (updated) {
      setQuestions(questions.map(q => q.id === updated.id ? updated : q));
      setEditingId(null);
      setEditForm(null);
      addLog(`Updated assignment: "${editForm.text.substring(0, 30)}..."`);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    const success = await deleteQuestion(id);
    if (success) {
      setQuestions(questions.filter(q => q.id !== id));
      addLog(`Deleted assignment ID: ${id}`);
    }
  };

  // 5. Bulk Delete Logic
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedQuestions.length} assignments?`)) return;
    setIsLoading(true);
    for (const id of selectedQuestions) {
      await deleteQuestion(id);
    }
    setQuestions(questions.filter(q => !selectedQuestions.includes(q.id)));
    setSelectedQuestions([]);
    setIsLoading(false);
    addLog(`Bulk deleted ${selectedQuestions.length} assignments`);
  };

  const handleUpdateSubmission = async () => {
    if (!selectedSubmission) return;
    const updates = {};
    if (overrideScore !== null) updates.score = overrideScore;
    if (adminNote !== undefined) {
      updates.result = {
        ...selectedSubmission.result,
        admin_note: adminNote
      };
    }
    
    const updated = await updateSubmission(selectedSubmission.id, updates);
    if (updated) {
      setSubmissions(submissions.map(s => s.id === updated.id ? updated : s));
      setSelectedSubmission(updated);
      addLog(`Updated submission ID: ${selectedSubmission.id} (Score: ${overrideScore}, Note: ${adminNote.substring(0, 20)}...)`);
      alert('Submission updated successfully!');
    }
  };

  const handleImportQuestions = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result);
        if (Array.isArray(data)) {
          setIsLoading(true);
          for (const q of data) {
            if (q.text) await addQuestion(q.text, q.category || 'General', q.allowedModes || ['text', 'audio', 'video']);
          }
          await loadData();
          addLog(`Imported ${data.length} questions from JSON`);
          alert(`Successfully imported ${data.length} questions!`);
        }
      } catch {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  // 3. Export Data Logic
  const exportToCSV = (items) => {
    const dataToExport = items || filteredSubmissions;
    const headers = ['Date', 'Question', 'Mode', 'Score', 'Feedback', 'Admin Note'];
    const rows = dataToExport.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      `"${s.question.replace(/"/g, '""')}"`,
      s.input_mode,
      s.score,
      `"${s.result?.feedback?.replace(/"/g, '""') || ''}"`,
      `"${s.result?.admin_note?.replace(/"/g, '""') || ''}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `evaluations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`Exported ${dataToExport.length} submissions to CSV`);
  };

  // 1. Filtered Submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (searchFeedback && s.result?.feedback?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMode = filterMode === 'all' || s.input_mode === filterMode;
    const matchesScore = scoreFilter === null || Math.floor(Number(s.score)) === scoreFilter;
    return matchesSearch && matchesMode && matchesScore;
  });

  // 4. Advanced Analytics
  const categoryStats = useMemo(() => {
    const counts = {};
    submissions.forEach(s => {
      const cat = questions.find(q => q.text === s.question)?.category || 'Uncategorized';
      if (!counts[cat]) counts[cat] = { name: cat, count: 0, totalScore: 0 };
      counts[cat].count++;
      counts[cat].totalScore += Number(s.score);
    });
    return Object.values(counts).map((c) => ({
      ...c,
      avg: (c.totalScore / c.count).toFixed(1)
    }));
  }, [submissions, questions]);

  const heatmapData = useMemo(() => {
    const hours = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, count: 0 }));
    submissions.forEach(s => {
      const hour = new Date(s.created_at).getHours();
      hours[hour].count++;
    });
    return hours;
  }, [submissions]);

  const questionUsage = useMemo(() => {
    const usage = {};
    submissions.forEach(s => {
      usage[s.question] = (usage[s.question] || 0) + 1;
    });
    return questions.map(q => ({
      ...q,
      count: usage[q.text] || 0
    })).sort((a, b) => b.count - a.count);
  }, [submissions, questions]);

  const feedbackKeywords = useMemo(() => {
    const text = submissions.map(s => s.result?.feedback || '').join(' ');
    const words = text.toLowerCase().match(/\b\w{5,}\b/g) || [];
    const counts = {};
    const stopWords = ['should', 'could', 'would', 'their', 'there', 'about', 'which', 'these', 'those'];
    words.forEach(w => {
      if (!stopWords.includes(w)) counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }, [submissions]);

  const scoreDistribution = useMemo(() => {
    const scores = Array(11).fill(0).map((_, i) => ({ score: i.toString(), count: 0 }));
    submissions.forEach(s => {
      const score = Math.floor(Number(s.score));
      if (score >= 0 && score <= 10) scores[score].count++;
    });
    return scores;
  }, [submissions]);

  const trendData = useMemo(() => {
    const days = {};
    submissions.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString();
      days[date] = (days[date] || 0) + 1;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count })).slice(-7);
  }, [submissions]);

  const commonTips = useMemo(() => {
    const tips = {};
    submissions.forEach(s => {
      if (s.result?.improvement_tips) {
        const tip = s.result.improvement_tips.split('.')[0];
        tips[tip] = (tips[tip] || 0) + 1;
      }
    });
    return Object.entries(tips).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [submissions]);

  const handleDeleteSubmission = async (id) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    const success = await deleteSubmission(id);
    if (success) {
      setSubmissions(submissions.filter(s => s.id !== id));
      addLog(`Deleted submission ID: ${id}`);
    }
  };

  const COLORS = ['#000000', '#444444', '#888888', '#CCCCCC', '#EEEEEE'];

  const toggleMode = (mode, isEdit) => {
    const target = isEdit ? editForm : newQuestion;
    if (!target) return;
    const currentModes = target.allowedModes || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    if (isEdit) setEditForm({ ...editForm, allowedModes: newModes });
    else setNewQuestion({ ...newQuestion, allowedModes: newModes });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col font-sans transition-colors duration-300">
      <header className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] px-6 py-4 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-[var(--text-primary)]">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Admin Control</h1>
            <button onClick={loadData} className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors text-[var(--text-secondary)]" title="Refresh Data">
              <Activity size={20} />
            </button>
          </div>
          <nav className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-[var(--brand-solid)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-solid)]" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* 4. Advanced Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 lg:col-span-2 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                       <TrendingUp size={16} /> Score Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                          <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }}
                          />
                          <Bar dataKey="count" fill="var(--brand-solid)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                      <Filter size={16} /> Category Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            stroke="var(--bg-elevated)"
                          >
                            {categoryStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categoryStats.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          {c.name} ({c.count})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                      <Activity size={16} /> Submission Trends
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-secondary)'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Line type="monotone" dataKey="count" stroke="var(--brand-solid)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-solid)' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                      <Activity size={16} /> Hourly Activity Heatmap
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={heatmapData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
                          <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: 'var(--text-secondary)'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Bar dataKey="count" fill="var(--brand-solid)" radius={[2, 2, 0, 0]} opacity={0.8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Performance */}
                  <div className="bg-[var(--bg-elevated)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-4 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Category Performance</h3>
                    <div className="space-y-3">
                      {categoryStats.map((c, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                            <span className="text-[var(--text-primary)]">{c.name}</span>
                            <span>Avg: {c.avg}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--brand-solid)]" style={{ width: `${Number(c.avg) * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Keywords */}
                  <div className="bg-[var(--bg-elevated)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-4 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                      <Search size={14} /> Feedback Themes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {feedbackKeywords.map((k, i) => (
                        <span key={i} className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full text-[10px] font-bold uppercase text-[var(--text-secondary)]">
                          {k.word} ({k.count})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 8. AI Feedback Summary */}
                  <div className="bg-[var(--bg-elevated)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-4 transition-colors">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                      <AlertCircle size={14} /> Common AI Tips
                    </h3>
                    <div className="space-y-3">
                      {commonTips.map(([tip], i) => (
                        <div key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed p-3 border-l-2 border-[var(--brand-solid)] bg-[var(--bg-secondary)] rounded-r-lg">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}


           {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                  <form onSubmit={handleAddQuestion} className="flex-1 bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 transition-colors">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 ml-1">Question Text</label>
                        <input
                          type="text"
                          placeholder="What would you like to ask?"
                          value={newQuestion.text}
                          onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                          className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:ring-2 focus:ring-[var(--brand-solid)] outline-none text-lg transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 ml-1">Category</label>
                        <select
                          value={newQuestion.category}
                          onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
                          className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-solid)] outline-none font-bold transition-all"
                        >
                          <option>General</option>
                          <option>Business</option>
                          <option>Academic</option>
                          <option>Creative</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 ml-1">Allowed Modes</label>
                        <div className="flex gap-3">
                          {[
                            { id: 'text', icon: Type, label: 'Text' },
                            { id: 'audio', icon: Mic, label: 'Audio' },
                            { id: 'video', icon: Video, label: 'Video' },
                          ].map(mode => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => toggleMode(mode.id, false)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${
                                newQuestion.allowedModes.includes(mode.id)
                                  ? 'bg-[var(--brand-solid)] text-white border-transparent shadow-md'
                                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]/40'
                              }`}
                            >
                              <mode.icon size={14} />
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button type="submit" className="bg-[var(--brand-solid)] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                        <Plus size={20} /> Create Task
                      </button>
                    </div>
                  </form>

                  <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col items-center justify-center gap-4 min-w-[200px] transition-colors">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Bulk Import</label>
                    <label className="cursor-pointer bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 p-6 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] flex flex-col items-center gap-2 transition-colors">
                      <Download size={24} className="text-[var(--text-secondary)]" />
                      <span className="text-xs font-bold text-[var(--text-secondary)]">Upload JSON</span>
                      <input type="file" accept=".json" onChange={handleImportQuestions} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* 5. Bulk Actions Bar */}
                {selectedQuestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--brand-solid)] text-white p-4 rounded-2xl flex items-center justify-between shadow-xl"
                  >
                    <span className="font-bold text-sm">{selectedQuestions.length} tasks selected</span>
                    <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Trash2 size={14} /> Delete Selected
                    </button>
                  </motion.div>
                )}

                <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                        <tr>
                          <th className="px-6 py-5 w-10">
                            <input 
                              type="checkbox" 
                              onChange={(e) => {
                                if (e.target.checked) setSelectedQuestions(questions.map(q => q.id));
                                else setSelectedQuestions([]);
                              }}
                              className="w-5 h-5 rounded-lg border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--brand-solid)] focus:ring-[var(--brand-solid)]/20"
                            />
                          </th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Category</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Question</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Usage</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {questionUsage.map(q => (
                          <tr key={q.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedQuestions.includes(q.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedQuestions([...selectedQuestions, q.id]);
                                  else setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                                }}
                                className="w-5 h-5 rounded-lg border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--brand-solid)] focus:ring-[var(--brand-solid)]/20"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md">{q.category}</span>
                            </td>
                            <td className="px-6 py-4">
                              {editingId === q.id ? (
                                <form onSubmit={handleUpdateQuestion} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editForm?.text}
                                    onChange={e => setEditForm({ ...editForm, text: e.target.value })}
                                    className="flex-1 px-3 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand-solid)]/20"
                                  />
                                  <button type="submit" className="p-1 bg-[var(--brand-solid)] text-white rounded-lg"><Check size={14} /></button>
                                  <button type="button" onClick={() => setEditingId(null)} className="p-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg border border-[var(--border-subtle)]"><X size={14} /></button>
                                </form>
                              ) : (
                                <p className="text-sm font-medium text-[var(--text-primary)]">{q.text}</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-[var(--text-secondary)]">{q.count} submissions</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(q.id); setEditForm(q); }} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-transparent hover:border-[var(--border-subtle)] transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-6">
                {/* 1. Search & Filter Bar */}
                <div className="bg-[var(--bg-elevated)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col md:flex-row gap-4 items-center transition-colors">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/60" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search questions or feedback..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:ring-2 focus:ring-[var(--brand-solid)] outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="searchFeedback"
                      checked={searchFeedback}
                      onChange={e => setSearchFeedback(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--brand-solid)] focus:ring-[var(--brand-solid)]/20"
                    />
                    <label htmlFor="searchFeedback" className="text-xs font-bold text-[var(--text-secondary)] uppercase cursor-pointer">Search in Feedback</label>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select 
                      value={filterMode}
                      onChange={e => setFilterMode(e.target.value)}
                      className="px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-solid)] outline-none text-sm font-bold transition-all"
                    >
                      <option value="all">All Modes</option>
                      <option value="text">Text Only</option>
                      <option value="audio">Audio Only</option>
                      <option value="video">Video Only</option>
                    </select>
                    <select 
                      value={scoreFilter || ''}
                      onChange={e => setScoreFilter(e.target.value ? Number(e.target.value) : null)}
                      className="px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-solid)] outline-none text-sm font-bold transition-all"
                    >
                      <option value="">All Scores</option>
                      {[10,9,8,7,6,5,4,3,2,1,0].map(s => <option key={s} value={s}>Score: {s}</option>)}
                    </select>
                    <button 
                      onClick={() => exportToCSV(selectedSubmissions.length > 0 ? submissions.filter(s => selectedSubmissions.includes(s.id)) : undefined)}
                      className="flex items-center gap-2 px-6 py-3 bg-[var(--brand-solid)] text-white rounded-2xl text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10"
                    >
                      <Download size={16} /> {selectedSubmissions.length > 0 ? `Export (${selectedSubmissions.length})` : 'Export All'}
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                        <tr>
                          <th className="px-6 py-5 w-10">
                            <input 
                              type="checkbox" 
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSubmissions(filteredSubmissions.map(s => s.id));
                                else setSelectedSubmissions([]);
                              }}
                              className="w-5 h-5 rounded-lg border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--brand-solid)] focus:ring-[var(--brand-solid)]/20"
                            />
                          </th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Date</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">User</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Question</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Mode</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Score</th>
                          <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredSubmissions.map(s => (
                          <tr key={s.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                checked={selectedSubmissions.includes(s.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedSubmissions([...selectedSubmissions, s.id]);
                                  else setSelectedSubmissions(selectedSubmissions.filter(id => id !== s.id));
                                }}
                                className="w-5 h-5 rounded-lg border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--brand-solid)] focus:ring-[var(--brand-solid)]/20"
                              />
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]/60">
                              {new Date(s.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[120px]">{s.user_email || 'Anonymous'}</span>
                                <span className="text-[9px] text-[var(--text-secondary)]/60 truncate max-w-[120px]">{s.user_id || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)] max-w-xs truncate">{s.question}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-[var(--bg-secondary)] rounded-full text-[10px] font-bold uppercase text-[var(--text-secondary)]">{s.input_mode}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                  <div 
                                    className={
                                      Number(s.score) >= 8 ? "bg-green-500 h-full rounded-full" : Number(s.score) >= 5 ? "bg-orange-500 h-full rounded-full" : "bg-red-500 h-full rounded-full"
                                    }
                                    style={{ width: `${Number(s.score) * 10}%` }}
                                  />
                                </div>
                                <span className="text-sm font-black text-[var(--text-primary)]">{s.score}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedSubmission(s);
                                    setAdminNote(s.result?.admin_note || '');
                                    setOverrideScore(Number(s.score));
                                  }}
                                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all shadow-sm border border-transparent hover:border-[var(--border-subtle)]"
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSubmission(s.id)}
                                  className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredSubmissions.length === 0 && (
                    <div className="p-12 text-center text-[var(--text-secondary)]/60 space-y-2">
                      <Search size={48} className="mx-auto opacity-10" />
                      <p className="font-bold">No results found matching your filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-6 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                    <Activity size={16} /> Admin Activity Log
                  </h3>
                  <button onClick={() => setLogs([])} className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] transition-colors">Clear Logs</button>
                </div>
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="py-12 text-center text-[var(--text-secondary)]/40 italic text-sm">No recent activity logged.</div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-subtle)]">
                        <div className="p-2 bg-[var(--bg-elevated)] rounded-lg shadow-sm border border-[var(--border-subtle)]">
                          <Info size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{log.action}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]/60 font-bold uppercase mt-1">{log.time.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-8 transition-colors">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                    <SettingsIcon size={16} /> System Configuration
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">Auto-Refresh Dashboard</p>
                        <p className="text-xs text-[var(--text-secondary)]">Update stats every 10 seconds</p>
                      </div>
                      <button 
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${autoRefresh ? 'bg-[var(--brand-solid)]' : 'bg-[var(--bg-secondary)]'}`}
                      >
                        <motion.div 
                          animate={{ x: autoRefresh ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">Maintenance Mode</p>
                        <p className="text-xs text-[var(--text-secondary)]">Disable all user submissions</p>
                      </div>
                      <div className="w-12 h-6 bg-[var(--bg-secondary)] rounded-full relative cursor-not-allowed opacity-50">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">Public History</p>
                        <p className="text-xs text-[var(--text-secondary)]">Allow users to see global trends</p>
                      </div>
                      <div className="w-12 h-6 bg-[var(--brand-solid)] rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-8 transition-colors">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 flex items-center gap-2">
                    <Trash2 size={16} /> Danger Zone
                  </h3>
                  <div className="space-y-4">
                    <button 
                      onClick={async () => {
                        if (confirm('DANGER: This will delete ALL user submissions. Proceed?')) {
                          await clearAllSubmissions();
                          setSubmissions([]);
                          addLog('CLEARED ALL SUBMISSIONS');
                        }
                      }}
                      className="w-full p-4 border-2 border-red-500/20 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      Clear All Submission Data
                    </button>
                    <p className="text-[10px] text-[var(--text-secondary)]/60 text-center uppercase font-bold tracking-widest">Action cannot be undone</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* 2. Detailed Submission Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--bg-elevated)] rounded-[40px] shadow-2xl p-8 border border-[var(--border-subtle)] transition-colors"
            >
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="absolute right-8 top-8 p-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] rounded-full transition-all border border-[var(--border-subtle)]"
              >
                <X size={24} />
              </button>
              <div className="mb-8 flex justify-between items-start gap-8">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Submission Details</span>
                  <h2 className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{selectedSubmission.question}</h2>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <span className="text-xs font-bold text-[var(--text-secondary)]/60 uppercase bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">User: {selectedSubmission.user_email || 'Anonymous'}</span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]/60 uppercase bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">Mode: {selectedSubmission.input_mode}</span>
                    <span className="text-xs font-bold text-[var(--text-secondary)]/60 uppercase bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">Date: {new Date(selectedSubmission.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-subtle)] space-y-4 min-w-[300px]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]/60">Admin Controls</h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]/60">Override Score (0-10)</label>
                    <input 
                      type="number" 
                      min="0" max="10" 
                      value={overrideScore || ''} 
                      onChange={e => setOverrideScore(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand-solid)] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)]/60">Admin Note</label>
                    <textarea 
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Add a private note..."
                      className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand-solid)] h-24 text-sm resize-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleUpdateSubmission}
                    className="w-full py-3 bg-[var(--brand-solid)] text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
              <div className="border-t border-[var(--border-subtle)] pt-8">
                <EvaluationResultDisplay result={selectedSubmission.result} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
