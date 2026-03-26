import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type as TypeIcon, 
  Mic, 
  Video, 
  Loader2, 
  ChevronRight, 
  RotateCcw,
  Sparkles,
  History,
  X,
  Settings,
  GraduationCap,
  ListTodo,
  LogIn, 
  LogOut
} from 'lucide-react';
import { evaluateAssignment } from '../services/geminiService';
import { Recorder } from '../components/Recorder';
import { EvaluationResultDisplay } from '../components/EvaluationResultDisplay';
import { cn } from '../utils/utils';
import { saveEvaluation, getEvaluationHistory, getQuestions, signInWithGoogle, signOut, onAuthStateChange } from '../lib/supabase';
import { AdminView } from '../components/AdminView';
import { AssignmentList } from '../components/AssignmentList';

const QUESTIONS = [
  { id: '1', category: 'General', text: "Tell me about your favorite hobby and why you enjoy it." },
  { id: '2', category: 'Professional', text: "How would you describe your strengths and weaknesses in a job interview?" },
  { id: '3', category: 'Creative', text: "If you could travel anywhere in the world, where would you go and what would you do there?" },
  { id: '4', category: 'Academic', text: "Explain the importance of environmental conservation in your own words." },
];

export default function Assignments() {
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);
  const [inputMode, setInputMode] = useState('text');
  const [textAnswer, setTextAnswer] = useState('');
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    const data = await getEvaluationHistory(user.id);
    setHistory(data);
  }, [user?.id]);

  const loadQuestions = useCallback(async () => {
    const data = await getQuestions();
    if (data.length > 0) {
      setQuestions(data);
    } else {
      setQuestions(QUESTIONS);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
    loadQuestions();
  }, [user, loadHistory, loadQuestions]);

  const reset = () => {
    setResult(null);
    setTextAnswer('');
    setRecordedBlob(null);
    setIsEvaluating(false);
  };

  const handleRecordingComplete = (blob) => {
    setRecordedBlob(blob);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      let audioBase64 = undefined;
      let videoBase64 = undefined;

      if (recordedBlob) {
        const base64 = await blobToBase64(recordedBlob);
        if (inputMode === 'audio') audioBase64 = base64;
        if (inputMode === 'video') videoBase64 = base64;
      }

      const evalResult = await evaluateAssignment(
        currentQuestion.text,
        textAnswer,
        '', 
        inputMode === 'video',
        audioBase64,
        videoBase64
      );
      
      setResult(evalResult);
      await saveEvaluation(
        currentQuestion.text, 
        evalResult, 
        inputMode, 
        user?.id, 
        user?.email
      );
      loadHistory();
    } catch (error) {
      console.error("Evaluation failed:", error);
      alert("Evaluation Error: " + (error.message || "An unknown error occurred"));
    } finally {
      setIsEvaluating(false);
    }
  };

  if (view === 'admin') {
    return <AdminView onBack={() => { setView('home'); loadQuestions(); }} />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-sans selection:bg-[var(--brand-solid)] selection:text-white rounded-3xl overflow-hidden shadow-xl mt-4 max-w-7xl mx-auto border border-[var(--border-subtle)] relative z-10 transition-colors duration-300">
      {/* Header inside Assignments to act as section header */}
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 backdrop-blur-md transition-colors">

        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <div className="w-8 h-8 bg-[var(--brand-solid)] rounded-lg flex items-center justify-center text-white shadow-md">
              <GraduationCap size={18} />
            </div>
            <span className="font-bold tracking-tight text-lg text-[var(--text-primary)] transition-colors">AI Teacher</span>
          </button>
          
          <div className="flex items-center gap-4 text-sm font-medium text-[var(--text-secondary)] transition-colors">
            <button 
              onClick={() => setView('assignments')}
              className={cn(
                "flex items-center gap-2 transition-colors",
                view === 'assignments' ? "text-[var(--brand-solid)]" : "text-[var(--text-secondary)] hover:text-[var(--brand-solid)]"
              )}
            >
              <ListTodo size={18} />
              <span className="hidden sm:inline">Assignments</span>
            </button>
            <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-solid)] transition-colors"
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setView('admin')}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-solid)] transition-colors"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}


            <div className="w-px h-4 bg-[var(--border-subtle)]" />
            

            
            <div className="hidden sm:block w-px h-4 bg-[var(--border-subtle)]" />
            <span className="hidden sm:block text-[var(--text-primary)] font-semibold transition-colors">Evaluator v1.2</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'assignments' ? (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2 text-[var(--text-primary)] transition-colors">My Assignments</h2>
                  <p className="text-[var(--text-secondary)] transition-colors">Select a task to practice your communication skills.</p>
                </div>
              </div>
              <AssignmentList 
                questions={questions} 
                history={history}
                onSelect={(q) => {
                  setCurrentQuestion(q);
                  setView('home');
                  setResult(null);
                }}
              />
            </motion.div>
          ) : !result ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Question Selection */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] transition-colors">
                  <Sparkles size={14} />
                  Select a Question
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUESTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestion(q);
                        reset();
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200 group",
                        currentQuestion.id === q.id 
                          ? "bg-[var(--bg-elevated)] border-[var(--brand-solid)] shadow-sm" 
                          : "bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--brand-solid)]/50"
                      )}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 group-hover:text-[var(--brand-solid)] transition-colors">
                        {q.category}
                      </div>
                      <div className={cn(
                        "text-sm font-medium leading-relaxed transition-colors",
                        currentQuestion.id === q.id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                      )}>
                        {q.text}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Active Question Display */}
              <section className="bg-[var(--bg-elevated)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-sm space-y-8 transition-colors">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] transition-colors">
                    {currentQuestion.text}
                  </h1>
                  <p className="text-[var(--text-secondary)] transition-colors">Choose your preferred way to answer this question.</p>
                </div>

                {/* Mode Selection */}
                <div className="flex flex-wrap gap-2 p-1 bg-[var(--bg-secondary)] rounded-2xl w-fit border border-[var(--border-subtle)]">
                  {[
                    { id: 'text', icon: TypeIcon, label: 'Text' },
                    { id: 'audio', icon: Mic, label: 'Voice' },
                    { id: 'video', icon: Video, label: 'Video' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setInputMode(mode.id);
                        setRecordedBlob(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        inputMode === mode.id 
                          ? "bg-[var(--bg-primary)] text-[var(--brand-solid)] shadow-sm" 
                          : "text-[var(--text-secondary)] hover:text-[var(--brand-solid)]"
                      )}
                    >
                      <mode.icon size={16} />
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="min-h-[200px] flex items-center justify-center">
                  {inputMode === 'text' ? (
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full h-48 p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] focus:border-[var(--brand-solid)] focus:ring-0 transition-all resize-none text-lg leading-relaxed shadow-inner text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
                    />
                  ) : (
                    <Recorder 
                      mode={inputMode} 
                      onRecordingComplete={handleRecordingComplete} 
                    />
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    disabled={isEvaluating || (inputMode === 'text' ? !textAnswer : !recordedBlob)}
                    onClick={handleSubmit}
                    className={cn(
                      "flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all",
                      isEvaluating || (inputMode === 'text' ? !textAnswer : !recordedBlob)
                        ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)]/40 cursor-not-allowed border border-[var(--border-subtle)]"
                        : "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--brand-solid)] hover:text-white shadow-lg active:scale-95"
                    )}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Submit for Evaluation
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </section>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <button
                onClick={reset}
                className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--brand-solid)] transition-colors bg-[var(--bg-elevated)] px-4 py-2 rounded-xl shadow-sm border border-[var(--border-subtle)] w-fit"
              >
                <RotateCcw size={16} />
                Try Another Answer
              </button>
              <EvaluationResultDisplay result={result} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-elevated)] shadow-2xl z-[70] flex flex-col border-l border-[var(--border-subtle)] transition-colors font-sans"
            >
              <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]">
                <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <History size={20} />
                  Evaluation History
                </h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-[var(--bg-secondary)] bg-[var(--bg-elevated)] rounded-full shadow-sm transition-colors border border-[var(--border-subtle)]"
                >
                  <X size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--bg-elevated)] custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-[var(--text-secondary)]">
                    <History size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No evaluations yet. Start practicing!</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setResult(item.result);
                        setShowHistory(false);
                      }}
                      className="w-full p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] hover:border-[var(--brand-solid)] hover:shadow-md transition-all text-left flex flex-col group"
                    >
                      <div className="flex justify-between items-start mb-2 w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--brand-solid)] transition-colors">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 bg-[var(--brand-solid)] text-white text-[10px] font-bold rounded-full transition-colors">
                          Score: {item.score}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2 w-full transition-colors">
                        {item.question}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase w-full transition-colors">
                        {item.input_mode === 'video' && <Video size={12} />}
                        {item.input_mode === 'audio' && <Mic size={12} />}
                        {item.input_mode === 'text' && <TypeIcon size={12} />}
                        {item.input_mode}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}