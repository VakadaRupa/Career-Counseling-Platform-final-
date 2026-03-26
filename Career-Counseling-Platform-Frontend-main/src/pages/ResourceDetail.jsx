import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui/BaseComponents';
import { ArrowLeft, ExternalLink, PlayCircle, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [resource, setResource] = useState(location.state?.resource || null);
  const [loading, setLoading] = useState(!location.state?.resource);

  useEffect(() => {
    // If we already got the resource from the AI search state, don't fetch!
    if (location.state?.resource) return;

    const fetchResource = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setResource(data);
      } catch (err) {
        console.error("Error fetching resource:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResource();
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[var(--bg-primary)] transition-colors duration-300">
        <Loader2 size={40} className="animate-spin text-[var(--brand-solid)] mb-4" />
        <p className="text-[var(--text-secondary)] font-medium transition-colors">Loading resource details...</p>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[var(--bg-primary)] transition-colors duration-300">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4 transition-colors">Resource Not Found</h2>
        <p className="text-[var(--text-secondary)] mb-8 transition-colors">This resource may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate('/resources')} className="rounded-xl px-8 py-3 bg-[var(--brand-solid)] text-white border-none">
          Back to Vault
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-[var(--bg-primary)] transition-colors">
      <button 
        onClick={() => navigate('/resources')} 
        className="mb-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-2 transition-all"
      >
        <ArrowLeft size={20} /> Back to Vault
      </button>

      <Card className="overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] transition-all">
        <div className="h-64 sm:h-96 w-full overflow-hidden bg-[var(--bg-secondary)] transition-colors">
          <img 
            src={resource.image || `https://picsum.photos/seed/${resource.title}/1200/600`} 
            alt={resource.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200'; }}
          />
        </div>
        
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-6">
            <Badge className="bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] rounded-full px-4 py-2 border-none font-bold uppercase tracking-wider transition-colors">
              {resource.type}
            </Badge>
            <span className="text-sm font-bold text-[var(--text-secondary)]/60 uppercase tracking-widest transition-colors font-sans">{resource.category}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] mb-8 leading-tight transition-colors">
            {resource.title}
          </h1>

          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 sm:p-10 mb-10 border border-[var(--border-subtle)] transition-colors">
            <p className="text-lg text-[var(--text-secondary)] whitespace-pre-line leading-loose transition-colors">
              {resource.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button 
              onClick={() => window.open(resource.link, '_blank')}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--brand-solid)] hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-[var(--brand-solid)]/20 flex items-center justify-center gap-3 text-lg border-none"
            >
              {resource.type === 'Course' ? <PlayCircle size={24} /> : <ExternalLink size={24} />}
              {resource.type === 'Course' ? 'Start Learning' : 'Open Full Resource'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
