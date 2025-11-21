import React, { useState } from 'react';
import { CheckSquare, Square, ArrowRight, MapPin, AlignLeft, User, Loader2, Layout, CheckCircle2, CircleDashed } from 'lucide-react';

export interface TodoItem {
  id: string; // unique identifier (combination of nodeId + index)
  nodeId: string;
  nodeType: string;
  field: string; // 'audio' | 'visual' | 'description'
  text: string;
  status: 'todo' | 'in-progress' | 'done';
  context: string; // "Scene 1: INT. HOUSE" or "Character: Bob"
  originalIndex: number; // index of this todo within the specific rich text field
}

interface TaskBoardProps {
  todos: TodoItem[];
  onStatusChange: (todo: TodoItem, newStatus: 'todo' | 'in-progress' | 'done') => void;
  onNavigate: (nodeId: string) => void;
  onClose: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ todos, onStatusChange, onNavigate, onClose }) => {
  
  const [draggedItem, setDraggedItem] = useState<TodoItem | null>(null);

  const handleDragStart = (e: React.DragEvent, item: TodoItem) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
      // Slight transparency for dragged item visual
      e.currentTarget.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
      setDraggedItem(null);
      e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, status: 'todo' | 'in-progress' | 'done') => {
      e.preventDefault();
      if (draggedItem && draggedItem.status !== status) {
          onStatusChange(draggedItem, status);
      }
      setDraggedItem(null);
  };

  const renderColumn = (title: string, status: 'todo' | 'in-progress' | 'done', icon: React.ReactNode, colorClass: string, bgClass: string) => {
      const items = todos.filter(t => t.status === status);
      
      return (
        <div 
            className={`flex-1 flex flex-col min-w-[300px] h-full rounded-xl border overflow-hidden transition-colors ${
                draggedItem ? 'border-dashed border-stone-400' : 'border-stone-200 dark:border-stone-800'
            } ${bgClass}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
        >
            {/* Header */}
            <div className={`p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm`}>
                <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${colorClass}`}>
                    {icon}
                    {title}
                </h3>
                <span className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                    {items.length}
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {items.map(todo => (
                    <div 
                        key={todo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, todo)}
                        onDragEnd={handleDragEnd}
                        className={`
                            group bg-white dark:bg-stone-950 p-4 rounded-lg border shadow-sm transition-all cursor-grab active:cursor-grabbing relative hover:shadow-md hover:-translate-y-0.5
                            ${status === 'done' ? 'opacity-60 border-stone-200 dark:border-stone-800' : 'border-stone-300 dark:border-stone-700'}
                            ${status === 'in-progress' ? 'border-l-4 border-l-orange-500' : ''}
                        `}
                    >
                        {/* Card Content */}
                        <div className="flex items-start gap-3 mb-3">
                             {/* Custom Status Toggle for Quick Action */}
                             <div className="mt-0.5 shrink-0">
                                 {status === 'done' ? (
                                     <button onClick={() => onStatusChange(todo, 'todo')} className="text-cyan-600 hover:text-cyan-700"><CheckCircle2 size={18} /></button>
                                 ) : (
                                     <button onClick={() => onStatusChange(todo, 'done')} className="text-stone-300 hover:text-stone-400"><CircleDashed size={18} /></button>
                                 )}
                             </div>

                            <div className={`text-sm font-medium leading-relaxed ${status === 'done' ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                                 <div dangerouslySetInnerHTML={{ __html: todo.text }} className="pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/50">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-400">
                                 {todo.nodeType === 'beat' && <AlignLeft size={10} />}
                                 {todo.nodeType === 'scene' && <MapPin size={10} />}
                                 {todo.field === 'description' && <Layout size={10} />}
                                 {['character','location','object'].includes(todo.nodeType) && <User size={10} />}
                                 <span className="truncate max-w-[150px]">{todo.context}</span>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    onNavigate(todo.nodeId);
                                    onClose();
                                }}
                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-cyan-600 transition-all bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded"
                            >
                                Go to <ArrowRight size={10} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {items.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-50">Drag items here</span>
                    </div>
                )}
            </div>
        </div>
      );
  };

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-200/80 dark:bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8">
        <div className="w-full max-w-7xl h-[90vh] bg-white dark:bg-[#181716] rounded-2xl shadow-2xl border border-stone-300 dark:border-stone-800 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/50">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-3">
                        <Layout className="text-stone-400" /> Project Board
                    </h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Centralized task management for your script and wiki.</p>
                </div>
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg text-sm font-bold text-stone-600 dark:text-stone-300 transition-colors"
                >
                    Close Board
                </button>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto p-6 bg-stone-100/50 dark:bg-black/20">
                 <div className="flex gap-6 h-full min-w-[1000px]">
                      {renderColumn('To Do', 'todo', <Square size={14} />, 'text-stone-500', 'bg-stone-50/50 dark:bg-stone-900/30')}
                      {renderColumn('In Progress', 'in-progress', <Loader2 size={14} className="animate-spin-slow" />, 'text-orange-600 dark:text-orange-500', 'bg-orange-50/30 dark:bg-orange-900/10')}
                      {renderColumn('Completed', 'done', <CheckSquare size={14} />, 'text-cyan-600 dark:text-cyan-500', 'bg-cyan-50/30 dark:bg-cyan-900/10')}
                 </div>
            </div>
        </div>
      </div>
  );
};