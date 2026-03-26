import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Card, Button, Input, Badge } from '../components/ui/BaseComponents';
import { BookOpen, Search, Plus, Edit2, Trash2, ExternalLink, PlayCircle, Sparkles, Loader2, GraduationCap, FileText, Filter, LayoutGrid, List, ArrowRight, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchWebResources, searchScholarlyResources } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { logActivity } from '../utils/activityLogger';

export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [searchType, setSearchType] = useState('general'); // 'general' or 'scholarly'
  const [viewMode, setViewMode] = useState('grid');

  const { data: resources, addItem, updateItem, deleteItem, loading: dataLoading } = useSupabaseData('resources', {
    orderBy: { column: 'created_at', ascending: false }
  });

  const [isEditing, setIsEditing] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', type: 'Course', category: 'General', description: '', image: '', link: '#' });

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAiSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const results = searchType === 'scholarly'
        ? await searchScholarlyResources(search)
        : await searchWebResources(search);
      setAiResults(results.map((r, i) => ({ ...r, id: `ai-${i}` })));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch real-time resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert('Error deleting resource: ' + err.message);
      }
    }
  };

  const handleEdit = (resource) => {
    setIsEditing(resource.id);
    setEditForm(resource);
  };

  const handleSave = async () => {
    try {
      if (isEditing) {
        await updateItem(isEditing, editForm);
      } else {
        await addItem({ ...editForm, user_id: user.id });
        await logActivity(user.id, 'course', `Added resource: ${editForm.title}`);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({ title: '', type: 'Course', category: 'General', description: '', image: '', link: '#' });
    } catch (err) {
      alert('Error saving resource: ' + err.message);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditForm({
      title: '',
      type: 'Course',
      category: 'General',
      description: '',
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=600',
      link: '#'
    });
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-80 shrink-0 space-y-6">
            <div className="glass-card p-6 rounded-3xl perfect-shadow sticky top-28 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all duration-300">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 transition-colors">Search Engine</h2>
                <p className="text-xs text-[var(--text-secondary)] transition-colors">Find the best career assets.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <Input
                    className="pl-10 rounded-2xl border-[var(--border-subtle)] focus:ring-brand-500/20 bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all"
                    placeholder="Keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSearchType('general')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${searchType === 'general' ? 'bg-[var(--brand-solid)] text-white shadow-lg shadow-[var(--brand-solid)]/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'}`}
                  >
                    <Sparkles size={18} />
                    General Discovery
                  </button>
                  <button
                    onClick={() => setSearchType('scholarly')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${searchType === 'scholarly' ? 'bg-[var(--brand-solid)] text-white shadow-lg shadow-[var(--brand-solid)]/20' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'}`}
                  >
                    <GraduationCap size={18} />
                    Scholarly Search
                  </button>
                </div>

                <Button
                  onClick={handleAiSearch}
                  disabled={loading || !search.trim()}
                  className="w-full py-6 rounded-2xl bg-[var(--text-primary)] hover:bg-[var(--brand-solid)] text-[var(--bg-primary)] hover:text-white transition-all shadow-lg border-none"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} className="mr-2" />}
                  {searchType === 'scholarly' ? 'Find Documents' : 'AI Discover'}
                </Button>
              </div>


            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand-solid)] animate-pulse" />
                  <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Knowledge Base</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight transition-colors">
                  Resource <span className="text-gradient italic font-serif font-normal">Vault</span>.
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl transition-colors border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--brand-solid)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[var(--bg-elevated)] shadow-sm text-[var(--brand-solid)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <List size={20} />
                  </button>
                </div>
                {isAdmin && (
                  <Button onClick={handleAdd} className="rounded-2xl bg-[var(--brand-solid)] hover:opacity-90 text-white font-bold px-8 py-6 border-none uppercase tracking-widest text-[10px]">
                    <Plus size={18} className="mr-2" />
                    Add Resource
                  </Button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {aiResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-16"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[var(--brand-solid)] text-white flex items-center justify-center shadow-lg shadow-[var(--brand-solid)]/20">
                        {searchType === 'scholarly' ? <GraduationCap size={24} /> : <Sparkles size={24} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">AI Analysis Complete</p>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] transition-colors">
                          {searchType === 'scholarly' ? 'Scholarly Insights' : 'AI Discoveries'}
                        </h2>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setAiResults([])} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest">
                      Clear results
                    </Button>
                  </div>

                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {aiResults.map((resource) => (
                      <Card key={resource.id} className={`group overflow-hidden rounded-3xl border-[var(--border-subtle)] perfect-shadow transition-all hover:border-[var(--brand-solid)]/50 ${searchType === 'scholarly' ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-elevated)]'}`}>
                        {searchType === 'scholarly' ? (
                          <div className="p-8 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                              <Badge className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full px-4 py-1 border border-[var(--border-subtle)] font-medium transition-colors">
                                {resource.type}
                              </Badge>
                              <span className="text-xs font-bold text-[var(--text-secondary)]/60 font-mono transition-colors">{resource.year || '2024'}</span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 line-clamp-2 leading-tight group-hover:text-[var(--brand-solid)] transition-colors">{resource.title}</h3>
                            <p className="text-sm font-semibold text-[var(--brand-solid)] mb-4 flex items-center gap-2">
                              <User size={14} /> {resource.authors}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] mb-8 line-clamp-4 leading-relaxed italic transition-colors">"{resource.description}"</p>
                            <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] transition-colors">
                              <Button
                                onClick={() => navigate(`/resources/${resource.id}`, { state: { resource } })}
                                className="flex items-center justify-center w-full gap-2 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-sm font-bold hover:bg-[var(--brand-solid)] hover:text-white transition-all shadow-md mt-2"
                              >
                                <FileText size={18} /> View Document Details
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className={viewMode === 'list' ? 'flex flex-row h-48' : 'flex flex-col'}>
                            <div className={`${viewMode === 'list' ? 'w-64' : 'h-48'} overflow-hidden shrink-0`}>
                              <img
                                src={resource.image?.startsWith('http') ? resource.image : `https://picsum.photos/seed/${resource.title}/800/600`}
                                alt={resource.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                              <div className="flex items-center justify-between mb-4">
                                <Badge className="bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] rounded-full px-3 py-1 border-none font-medium text-[10px] uppercase tracking-wider transition-colors">
                                  {resource.type}
                                </Badge>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">{resource.category}</span>
                              </div>
                              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--brand-solid)] transition-colors">{resource.title}</h3>
                              <p className="text-sm text-[var(--text-secondary)] mb-6 line-clamp-2 leading-relaxed transition-colors">{resource.description}</p>
                              <div className="mt-auto">
                                <button
                                  onClick={() => navigate(`/resources/${resource.id}`, { state: { resource } })}
                                  className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-solid)] hover:gap-3 transition-all cursor-pointer"
                                >
                                  View Full Details <ArrowRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Assessment Banner */}




            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] transition-colors">Curated Library</h2>
              <div className="h-px flex-1 mx-8 bg-[var(--border-subtle)] transition-colors" />
            </div>

            <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {isAdding && (
                <Card className="p-8 border-2 border-dashed border-[var(--brand-solid)]/30 bg-[var(--brand-solid)]/5 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[var(--text-primary)] transition-colors">New Resource</h3>
                    <button onClick={() => setIsAdding(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                    <Input
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="rounded-xl"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="flex-1 rounded-xl bg-[var(--brand-solid)] border-none">Create</Button>
                      <Button variant="ghost" onClick={() => setIsAdding(false)} className="flex-1 rounded-xl">Cancel</Button>
                    </div>
                  </div>
                </Card>
              )}

              {dataLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                  <Loader2 size={40} className="animate-spin text-[var(--brand-solid)] mb-4" />
                  <p className="text-[var(--text-secondary)] font-medium transition-colors">Loading vault...</p>
                </div>
              ) : filteredResources.map((resource) => (
                <Card key={resource.id} className={`group overflow-hidden rounded-3xl border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm transition-all hover:border-[var(--brand-solid)]/50 ${viewMode === 'list' ? 'flex flex-row min-h-[12rem]' : 'flex flex-col'}`}>
                  <div className={`${viewMode === 'list' ? 'w-64' : 'h-56'} overflow-hidden shrink-0`}>
                    <img
                      src={resource.image}
                      alt={resource.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    {isEditing === resource.id ? (
                      <div className="space-y-4">
                        <h3 className="font-bold text-[var(--text-primary)] mb-2 transition-colors">Edit Resource</h3>
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Title"
                          className="rounded-xl"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} className="rounded-xl bg-[var(--brand-solid)] border-none">Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(null)} className="rounded-xl">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full px-3 py-1 border border-[var(--border-subtle)] font-medium text-[10px] uppercase tracking-wider transition-colors">
                            {resource.type}
                          </Badge>
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">{resource.category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--brand-solid)] transition-colors">{resource.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-8 line-clamp-3 leading-relaxed transition-colors">{resource.description}</p>

                        <div className="mt-auto flex items-center justify-between">
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/resources/${resource.id}`)}
                            className="p-0 text-[var(--brand-solid)] hover:bg-transparent hover:opacity-80 font-bold flex items-center gap-2"
                          >
                            <ExternalLink size={20} />
                            View Details
                          </Button>

                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(resource); }} className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-solid)] transition-colors">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(resource.id); }} className="p-2 text-[var(--text-secondary)] hover:text-[var(--error-text)] transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div >
    </div >
  );
}
