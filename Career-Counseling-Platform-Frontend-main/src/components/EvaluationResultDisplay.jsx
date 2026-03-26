import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { CheckCircle2, AlertCircle, TrendingUp, Award, MessageSquare } from 'lucide-react';
import { cn } from '../utils/utils';

const StatCard = ({ label, value, icon: Icon, style }) => (
  <div 
    className="p-4 rounded-xl border flex flex-col gap-1 transition-colors"
    style={{
      backgroundColor: `var(--${style}-bg)`,
      color: `var(--${style}-text)`,
      borderColor: `var(--${style}-border)`
    }}
  >
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-70">
      <Icon size={14} />
      {label}
    </div>
    <div className="text-2xl font-bold">{value}/10</div>
  </div>
);

export const EvaluationResultDisplay = ({ result }) => {
  if (!result) return null;

  const getScoreStyle = (score) => {
    if (score >= 8) return 'success';
    if (score >= 5) return 'warning';
    return 'error';
  };

  if (result.isInvalid) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto p-6 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] text-center text-[var(--text-secondary)] font-medium transition-colors"
      >
        {result.feedback}
      </motion.div>
    );
  }

  const scoreStyle = getScoreStyle(result.score);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto flex flex-col gap-8 p-8 bg-[var(--bg-elevated)] rounded-3xl shadow-sm border border-[var(--border-subtle)] transition-colors"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] transition-colors">Evaluation Report</h2>
          <p className="text-[var(--text-secondary)] mt-1 transition-colors">Detailed analysis of your {result.type} response.</p>
        </div>
        <div 
          className="px-6 py-3 rounded-2xl border text-center transition-colors min-w-[120px]"
          style={{
            backgroundColor: `var(--${scoreStyle}-bg)`,
            color: `var(--${scoreStyle}-text)`,
            borderColor: `var(--${scoreStyle}-border)`
          }}
        >
          <div className="text-xs font-bold uppercase tracking-widest opacity-70">Overall Score</div>
          <div className="text-4xl font-black">{result.score}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {result.fluency_score !== null && (
          <StatCard label="Fluency" value={result.fluency_score} icon={TrendingUp} style="info" />
        )}
        {result.confidence_score !== null && (
          <StatCard label="Confidence" value={result.confidence_score} icon={Award} style="info" />
        )}
        {result.clarity_score !== null && (
          <StatCard label="Clarity" value={result.clarity_score} icon={MessageSquare} style="info" />
        )}
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-3 uppercase tracking-wider transition-colors">
            <CheckCircle2 size={18} className="text-[var(--success-text)]" />
            Improved Version
          </div>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] italic leading-relaxed transition-colors">
            &quot;{result.correct_answer_or_sentence}&quot;
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-3 uppercase tracking-wider transition-colors">
            <AlertCircle size={18} className="text-[var(--warning-text)]" />
            Grammar & Mistakes
          </div>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none transition-colors">
            <Markdown>{result.grammar_mistakes}</Markdown>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-subtle)] transition-colors">
          <section>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wider transition-colors">Feedback</h4>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed transition-colors">{result.feedback}</p>
          </section>
          <section>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wider transition-colors">Improvement Tips</h4>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed transition-colors">{result.improvement_tips}</p>
          </section>
        </div>

        {result.admin_note && (
          <section className="mt-4 p-4 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-xl transition-colors">
            <h4 className="text-xs font-bold text-[var(--warning-text)] mb-2 uppercase tracking-wider flex items-center gap-2 transition-colors">
              <Award size={14} /> Admin Note
            </h4>
            <p className="text-[var(--warning-text)] text-sm italic transition-colors">&quot;{result.admin_note}&quot;</p>
          </section>
        )}
      </div>
    </motion.div>
  );
};
