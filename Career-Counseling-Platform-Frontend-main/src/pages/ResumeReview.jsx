import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/ui/BaseComponents';
import { FileText, UploadCloud, Loader2, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { analyzeResume } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export default function ResumeReview() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Strip the data:application/pdf;base64, prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const analysis = await analyzeResume(base64, file.type);
      setResult(analysis);
    } catch (err) {
      alert("Error analyzing resume: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <Badge variant="info" className="mb-4">AI Recruiter</Badge>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] mb-4 transition-colors">
            Resume <span className="text-gradient italic font-serif font-normal">Screener</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] transition-colors">
            Upload your PDF resume. Our cutting-edge AI will evaluate it exactly like a human tech recruiter.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uploader Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8 bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-center shadow-lg transition-colors">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-[var(--brand-solid)]/10 text-[var(--brand-solid)] flex items-center justify-center transition-colors">
                  <FileText size={40} />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Upload Resume</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-8 transition-colors">Only PDF format is supported natively by the AI.</p>
              
              <input
                type="file"
                id="resume-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="resume-upload"
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl border-2 border-dashed border-[var(--brand-solid)] text-[var(--brand-solid)] font-bold cursor-pointer hover:bg-[var(--brand-solid)]/5 transition-all mb-4"
              >
                <UploadCloud size={20} />
                {file ? file.name : "Choose PDF File"}
              </label>

              <Button 
                onClick={handleAnalyze} 
                disabled={!file || loading}
                className="w-full py-6 rounded-xl bg-[var(--brand-solid)] hover:opacity-90 text-white font-black uppercase tracking-widest text-xs border-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Target size={18} className="mr-2" />}
                {loading ? 'Analyzing...' : 'Scan Resume'}
              </Button>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl"
                >
                  <Loader2 size={48} className="animate-spin text-[var(--brand-solid)] mb-4" />
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">AI is reading your document...</h3>
                  <p className="text-[var(--text-secondary)] mt-2">Checking formatting, keywords, and impact.</p>
                </motion.div>
              )}

              {!loading && result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="p-8 bg-[var(--bg-elevated)] border-[var(--border-subtle)] overflow-hidden relative shadow-2xl transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-solid)]/10 blur-[50px] rounded-full -mr-16 -mt-16" />
                    
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-[var(--border-subtle)] transition-colors relative z-10">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">ATS Match Score</p>
                        <h2 className="text-5xl font-black text-[var(--text-primary)] transition-colors">{result.score}<span className="text-2xl text-[var(--text-secondary)]">/100</span></h2>
                      </div>
                      <div className="h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl border-4 shadow-lg flex-shrink-0"
                           style={{ 
                             borderColor: result.score >= 80 ? 'var(--success-text)' : result.score >= 60 ? 'var(--warning-text)' : 'var(--error-text)',
                             color: result.score >= 80 ? 'var(--success-text)' : result.score >= 60 ? 'var(--warning-text)' : 'var(--error-text)'
                           }}>
                        {result.score >= 80 ? 'A' : result.score >= 60 ? 'B' : 'C'}
                      </div>
                    </div>

                    <p className="text-lg leading-relaxed text-[var(--text-secondary)] mb-8 italic relative z-10 transition-colors">"{result.summary}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                      <div className="p-6 rounded-2xl bg-[var(--success-bg)]/20 border border-[var(--success-bg)] transition-colors">
                        <h3 className="font-bold text-[var(--success-text)] mb-4 flex items-center gap-2">
                          <CheckCircle size={18} /> Major Strengths
                        </h3>
                        <ul className="space-y-3">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                              <span className="text-[var(--success-text)] mt-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="p-6 rounded-2xl bg-[var(--error-bg)]/20 border border-[var(--error-bg)] transition-colors">
                        <h3 className="font-bold text-[var(--error-text)] mb-4 flex items-center gap-2">
                          <AlertCircle size={18} /> Weaknesses
                        </h3>
                        <ul className="space-y-3">
                          {result.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                              <span className="text-[var(--error-text)] mt-1">•</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] relative z-10 transition-colors">
                      <h3 className="font-bold text-[var(--brand-solid)] mb-4 flex items-center gap-2 transition-colors">
                        <TrendingUp size={18} /> Actionable Next Steps
                      </h3>
                      <ul className="space-y-4">
                        {result.improvements.map((tip, i) => (
                          <li key={i} className="text-sm text-[var(--text-primary)] font-medium p-4 rounded-xl bg-[var(--bg-primary)] shadow-sm transition-colors border-l-4 border-[var(--brand-solid)]">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </motion.div>
              )}

              {!loading && !result && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl opacity-50 transition-colors">
                  <FileText size={48} className="text-[var(--text-secondary)] mb-4" />
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">No Resume Uploaded</h3>
                  <p className="text-[var(--text-secondary)] mt-2">Upload your PDF on the left to begin the scan.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
