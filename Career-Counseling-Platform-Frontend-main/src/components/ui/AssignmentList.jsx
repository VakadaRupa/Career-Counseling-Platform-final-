import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';


export const AssignmentList = ({ questions, history, onSelect }) => {
  const getStatus = (qText) => {
    const attempts = history.filter(h => h.question === qText);
    if (attempts.length === 0) return 'pending';
    const bestScore = Math.max(...attempts.map(h => Number(h.score)));
    return bestScore >= 7 ? 'completed' : 'retry';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {questions.map((q, idx) => {
        const status = getStatus(q.text);
        return (
          <motion.button
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelect(q)}
            className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-black transition-all text-left flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                  {q.category}
                </span>
                {status === 'completed' ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : status === 'retry' ? (
                  <Clock size={20} className="text-orange-500" />
                ) : (
                  <Circle size={20} className="text-gray-200" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-black leading-tight">
                {q.text}
              </h3>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {status === 'completed' ? 'Perfected' : status === 'retry' ? 'Improve Score' : 'Start Now'}
              </span>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
