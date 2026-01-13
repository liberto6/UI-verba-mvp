import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Filter } from 'lucide-react';
import { MOCK_TASKS } from '../data/mockTasks';
import type { TaskStatus, Task } from '../data/mockTasks';
import { TaskCard } from '../components/TaskCard';

export default function TasksPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [logoError, setLogoError] = useState(false);

  // NOTE: In a real app, we would fetch tasks here:
  // useEffect(() => {
  //   api.get('/tasks').then(setTasks);
  // }, []);
  
  const filteredTasks = MOCK_TASKS.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

  const handleStartTask = (task: Task) => {
    navigate('/conversation', { state: { task } });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-3">
              {logoError ? (
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">EC</div>
              ) : (
                <img
                  src="/perfil.jpg"
                  alt="English Connection"
                  className="w-14 h-14 rounded-lg object-contain bg-white"
                  onError={() => setLogoError(true)}
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={24} />
                  My Tasks
                </h1>
                <p className="text-xs text-gray-500">Practice your assigned speaking activities</p>
              </div>
           </div>
           
           <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold border border-indigo-200">
             JD
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
           <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2">
             <Filter size={16} />
             Filter:
           </div>
           {(['all', 'pending', 'completed'] as const).map((status) => (
             <button
               key={status}
               onClick={() => setFilter(status)}
               className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                 filter === status 
                   ? 'bg-indigo-600 text-white shadow-sm' 
                   : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
               }`}
             >
               {status}
             </button>
           ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredTasks.map(task => (
             <TaskCard key={task.id} task={task} onStart={handleStartTask} />
           ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p>No tasks found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
