import { ArrowRight, CheckCircle, Clock } from 'lucide-react';
import type { Task } from '../data/mockTasks';

interface TaskCardProps {
  task: Task;
  onStart: (task: Task) => void;
}

export const TaskCard = ({ task, onStart }: TaskCardProps) => {
  const isCompleted = task.status === 'completed';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
          isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'
        }`}>
          {task.level}
        </span>
        {isCompleted ? (
          <CheckCircle size={18} className="text-green-500" />
        ) : (
          <Clock size={18} className="text-gray-400" />
        )}
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2">{task.topic}</h3>
      <p className="text-sm text-gray-500 mb-6 flex-1">{task.description}</p>
      
      {/* Action Button: Hidden if completed */}
      {!isCompleted && (
        <button
          onClick={() => onStart(task)}
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Start Task
          <ArrowRight size={16} />
        </button>
      )}
      
      {isCompleted && (
        <div className="w-full py-2.5 rounded-lg font-medium text-sm text-gray-400 bg-gray-50 flex items-center justify-center gap-2 cursor-default">
           Completed
           <CheckCircle size={16} />
        </div>
      )}
    </div>
  );
};
