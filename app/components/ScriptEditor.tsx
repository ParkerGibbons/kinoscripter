
import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Wand2, ChevronRight, ChevronDown, GripVertical, Film, Clapperboard, Loader2, X, Sparkles, MessageSquare } from 'lucide-react';
import { Script, ScriptNode, NodeType } from '../types';
import { generateBeatContent } from '../services/geminiService';
import { RichTextCell } from './RichTextCell';
import { StoryClock } from './StoryClock';

interface ScriptEditorProps {
  script: Script;
  setScript: React.Dispatch<React.SetStateAction<Script>>;
  highlightedSceneId?: string | null;
  onResourceClick?: (resourceId: string) => void;
  onClockClick?: () => void;
}

interface DragState {
    draggedId: string | null;
    draggedType: NodeType | null;
    overId: string | null;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, setScript, highlightedSceneId, onResourceClick, onClockClick }) => {
  
  const [dragState, setDragState] = useState<DragState>({
      draggedId: null,
      draggedType: null,
      overId: null
  });

  // AI Director State
  const [magicState, setMagicState] = useState<{ id: string; context: string } | null>(null);
  const [magicPrompt, setMagicPrompt] = useState('');
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  const updateNode = useCallback((nodeId: string, updates: Partial<ScriptNode>) => {
    setScript(currentScript => {
        const newScript = { ...currentScript };
        const findAndUpdate = (nodes: ScriptNode[]) => {
          for (const node of nodes) {
            if (node.id === nodeId) {
              Object.assign(node, updates);
              return true;
            }
            if (node.children && findAndUpdate(node.children)) return true;
          }
          return false;
        };
        findAndUpdate(newScript.content);
        return newScript;
    });
  }, [setScript]);

  const addNode = useCallback((parentId: string, type: NodeType) => {
    setScript(currentScript => {
        const newScript = { ...currentScript };
        const newNode: ScriptNode = {
          id: `${type}-${Date.now()}`,
          type,
          title: type !== 'beat' ? '' : undefined, 
          children: type !== 'beat' ? [] : undefined,
          content: type === 'beat' ? { audio: '', visual: '' } : undefined,
          isCollapsed: false
        };

        if (parentId === 'root') {
          newScript.content.push(newNode);
        } else {
          const findAndAdd = (nodes: ScriptNode[]) => {
            for (const node of nodes) {
              if (node.id === parentId && node.children) {
                node.children.push(newNode);
                node.isCollapsed = false; 
                return true;
              }
              if (node.children && findAndAdd(node.children)) return true;
            }
            return false;
          };
          findAndAdd(newScript.content);
        }
        return newScript;
    });
  }, [setScript]);

  const deleteNode = useCallback((nodeId: string) => {
     if (!window.confirm("Delete this section?")) return;
     setScript(currentScript => {
         const newScript = { ...currentScript };
         const rootIndex = newScript.content.findIndex(n => n.id === nodeId);
         if (rootIndex > -1) {
           newScript.content.splice(rootIndex, 1);
           return newScript;
         }
         const findAndDelete = (nodes: ScriptNode[]) => {
           for (const node of nodes) {
             if (node.children) {
               const idx = node.children.findIndex(c => c.id === nodeId);
               if (idx > -1) {
                 node.children.splice(idx, 1);
                 return true;
               }
               if (findAndDelete(node.children)) return true;
             }
           }
           return false;
         };
         findAndDelete(newScript.content);
         return newScript;
     });
  }, [setScript]);

  const toggleCollapse = useCallback((nodeId: string) => {
      setScript(currentScript => {
          const newScript = { ...currentScript };
          const findAndToggle = (nodes: ScriptNode[]) => {
              for (const node of nodes) {
                  if (node.id === nodeId) {
                      node.isCollapsed = !node.isCollapsed;
                      return true;
                  }
                  if (node.children && findAndToggle(node.children)) return true;
              }
              return false;
          };
          findAndToggle(newScript.content);
          return newScript;
      });
  }, [setScript]);

  const moveNode = useCallback((draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;

      setScript(currentScript => {
          const newScript = JSON.parse(JSON.stringify(currentScript));
          let draggedNode: ScriptNode | null = null;
          
          const findAndRemove = (list: ScriptNode[]): boolean => {
              const idx = list.findIndex(n => n.id === draggedId);
              if (idx !== -1) {
                  draggedNode = list[idx];
                  list.splice(idx, 1);
                  return true;
              }
              for (const item of list) {
                  if (item.children && findAndRemove(item.children)) return true;
              }
              return false;
          };
          
          findAndRemove(newScript.content);
          if (!draggedNode) return currentScript;
          
          const findAndInsert = (list: ScriptNode[]): boolean => {
              const idx = list.findIndex(n => n.id === targetId);
              if (idx !== -1) {
                  list.splice(idx, 0, draggedNode!);
                  return true;
              }
              for (const item of list) {
                  if (item.children && findAndInsert(item.children)) return true;
              }
              return false;
          };
          
          if (findAndInsert(newScript.content)) {
              return newScript;
          }
          return currentScript;
      });
  }, [setScript]);

  const openMagicPrompt = (beatId: string, context: string) => {
    setMagicState({ id: beatId, context });
    setMagicPrompt('');
  };

  const executeMagic = async () => {
    if (!magicState) return;
    
    setIsMagicLoading(true);
    const result = await generateBeatContent(
      magicState.context, 
      "Cinematic, visual storytelling", 
      magicPrompt || "Enhance the dramatic impact and visual clarity."
    );
    setIsMagicLoading(false);
    
    if (result) {
      updateNode(magicState.id, { content: result });
      setMagicState(null);
    }
  };

  // --- Drag Handlers ---
  const onDragStart = (e: React.DragEvent, id: string, type: NodeType) => {
      e.stopPropagation();
      setDragState({ draggedId: id, draggedType: type, overId: null });
      e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, id: string, type: NodeType) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragState.draggedId || dragState.draggedId === id) return;
      if (dragState.draggedType !== type) return; 
      setDragState(prev => ({ ...prev, overId: id }));
  };

  const onDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragState.draggedId && dragState.draggedId !== targetId) {
          moveNode(dragState.draggedId, targetId);
      }
      setDragState({ draggedId: null, draggedType: null, overId: null });
  };
  
  const onDragEnd = () => {
      setDragState({ draggedId: null, draggedType: null, overId: null });
  };

  // --- Renderers ---

  const renderBeat = (beat: ScriptNode, sceneIndex: number, beatIndex: number) => {
    // Beat label format: 01A, 01B... 
    const beatLabelDisplay = `${String(sceneIndex + 1).padStart(2, '0')}${String.fromCharCode(65 + (beatIndex % 26))}`;
    const isDragging = dragState.draggedId === beat.id;
    const isOver = dragState.overId === beat.id;
    const isMagicActive = magicState?.id === beat.id;

    return (
      <div 
        key={beat.id} 
        className={`group flex items-stretch relative border-b border-stone-200 dark:border-stone-800/50 last:border-0 transition-colors ${isDragging ? 'opacity-50 bg-stone-50 dark:bg-stone-800' : ''} ${isOver ? 'bg-stone-100 dark:bg-stone-800/50 shadow-inner' : ''} ${isMagicActive ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
        onDragOver={(e) => onDragOver(e, beat.id, 'beat')}
        onDrop={(e) => onDrop(e, beat.id)}
      >
        {/* Gutter Column - Dedicated control area to prevent conflict */}
        <div className="w-12 shrink-0 bg-stone-50/40 dark:bg-stone-900/20 border-r border-stone-200 dark:border-stone-800/50 flex flex-col items-center py-3 gap-3 select-none group-hover:bg-stone-50 dark:group-hover:bg-stone-900/40 transition-colors">
            
            {/* Label & Grip */}
            <div 
                className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, beat.id, 'beat')}
                onDragEnd={onDragEnd}
            >
                <span className="text-[10px] font-mono font-bold tracking-tighter opacity-60 group-hover:opacity-100">{beatLabelDisplay}</span>
                <GripVertical size={12} />
            </div>

            {/* Hover Actions - Visible on hover in the gutter */}
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-200">
                 <button 
                    onClick={() => openMagicPrompt(beat.id, `Context: Scene ${sceneIndex + 1}, Beat ${beatLabelDisplay}. Audio: ${beat.content?.audio}, Visual: ${beat.content?.visual}`)}
                    className={`p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 ${isMagicActive ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' : 'text-stone-400 hover:text-purple-600 dark:text-stone-600 dark:hover:text-purple-400'}`}
                    title="AI Director"
                >
                    <Wand2 size={12} />
                </button>
                <button 
                    onClick={() => deleteNode(beat.id)} 
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-600 dark:text-stone-600 dark:hover:text-red-400"
                    title="Delete Beat"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>

        {/* Audio Cell */}
        <div className="flex-1 min-w-0 border-r border-stone-200 dark:border-stone-800/50 p-4 relative hover:bg-stone-50/30 dark:hover:bg-stone-800/10 transition-colors group/cell">
             <div className="text-[9px] font-bold uppercase text-stone-300 dark:text-stone-700 absolute top-1 right-2 opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-opacity">Audio</div>
            <RichTextCell 
                html={beat.content?.audio || ''}
                onChange={(v) => updateNode(beat.id, { content: { ...beat.content!, audio: v } })}
                placeholder="Dialogue or audio cue..."
                resources={script.resources}
                className="font-script text-base leading-relaxed text-stone-900 dark:text-stone-100 min-h-[1.5em]"
                onResourceClick={onResourceClick}
            />
        </div>
        
        {/* Visual Cell */}
        <div className="flex-1 min-w-0 p-4 relative bg-stone-50/20 dark:bg-stone-900/20 hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors group/cell">
            <div className="text-[9px] font-bold uppercase text-stone-300 dark:text-stone-700 absolute top-1 right-2 opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-opacity">Visual</div>
            <RichTextCell 
                html={beat.content?.visual || ''}
                onChange={(v) => updateNode(beat.id, { content: { ...beat.content!, visual: v } })}
                placeholder="Visual action or camera..."
                resources={script.resources}
                className="font-mono text-sm leading-loose text-stone-600 dark:text-stone-300 min-h-[1.5em]"
                onResourceClick={onResourceClick}
            />
        </div>
      </div>
    );
  };

  const renderScene = (scene: ScriptNode, sceneIndex: number) => {
    const isHighlighted = highlightedSceneId === scene.id;
    const isDragging = dragState.draggedId === scene.id;
    const isOver = dragState.overId === scene.id;
    
    return (
      <div 
        key={scene.id} 
        id={scene.id}
        className={`relative group mb-6 transition-all duration-300 ${isDragging ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
        onDragOver={(e) => onDragOver(e, scene.id, 'scene')}
        onDrop={(e) => onDrop(e, scene.id)}
      >
        {/* Rail Connector */}
        <div className="absolute -left-8 top-[26px] w-8 h-px bg-stone-200 dark:bg-stone-800 group-hover:bg-stone-400 transition-colors"></div>
        <div className={`absolute -left-[2.15rem] top-[24px] w-1.5 h-1.5 rounded-full border bg-stone-50 dark:bg-stone-900 transition-all z-10 ${isHighlighted ? 'border-yellow-500 bg-yellow-500' : 'border-stone-300 dark:border-stone-700 group-hover:border-stone-400 group-hover:bg-stone-400'}`}></div>

        {/* Scene Card */}
        <div className={`
            rounded-xl border transition-all duration-200 overflow-hidden
            ${isHighlighted 
                ? 'bg-stone-50/80 border-stone-400 dark:border-stone-500 dark:bg-stone-900/80 shadow-lg ring-1 ring-stone-400/20' 
                : 'bg-white dark:bg-[#181716] border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 shadow-sm hover:shadow-md'
            }
        `}>
            {/* Header Area */}
            <div className="flex items-center gap-3 p-3 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-900/30">
                <div 
                    className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 p-1.5 rounded hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors opacity-0 group-hover:opacity-100"
                    draggable
                    onDragStart={(e) => onDragStart(e, scene.id, 'scene')}
                    onDragEnd={onDragEnd}
                 >
                     <GripVertical size={16} />
                 </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 min-w-0">
                     <div className="flex items-center gap-2 shrink-0 select-none">
                         <div className="bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                            SC {sceneIndex + 1}
                         </div>
                     </div>
                     
                     <div className="flex-1 relative group/input">
                         <input 
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm md:text-base font-bold font-mono text-stone-800 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-700 uppercase tracking-tight"
                            value={scene.title || ''}
                            onChange={(e) => updateNode(scene.id, { title: e.target.value })}
                            placeholder="INT. LOCATION - DAY"
                         />
                         <div className="absolute inset-0 border-b border-stone-300 dark:border-stone-700 scale-x-0 group-hover/input:scale-x-100 transition-transform origin-left pointer-events-none opacity-30"></div>
                     </div>
                </div>

                <div className="flex items-center gap-1 pl-2 border-l border-stone-200 dark:border-stone-800">
                     {/* Scene StoryIcon */}
                     <div 
                        className="w-7 h-7 p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-all cursor-pointer flex items-center justify-center" 
                        title="View in StoryClock"
                        onClick={onClockClick}
                     >
                        <StoryClock 
                            script={script} 
                            mode="icon" 
                            highlightedNodeId={scene.id} 
                            darkMode={true} // Always dark mode for icon to ensure contrast/visibility
                        />
                     </div>

                     <button 
                        onClick={() => toggleCollapse(scene.id)}
                        className="p-1.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                     >
                        {scene.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                     </button>

                     <button onClick={() => deleteNode(scene.id)} className="p-1.5 rounded text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Collapsible Body */}
            <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${scene.isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
                <div className="overflow-hidden">
                    {/* Scene Context/Description */}
                    <div className="px-4 pt-3 pb-2 border-b border-stone-100 dark:border-stone-800/50">
                        <div className="flex gap-2 items-start">
                            <span className="text-[10px] font-bold uppercase text-stone-300 dark:text-stone-600 mt-1 select-none">Ctx</span>
                            <RichTextCell 
                                html={scene.description || ''}
                                onChange={(v) => updateNode(scene.id, { description: v })}
                                placeholder="Set the scene: visuals, atmosphere, context..."
                                resources={script.resources}
                                className="flex-1 text-xs font-serif italic text-stone-500 dark:text-stone-400 min-h-[1.5em] focus:text-stone-900 dark:focus:text-stone-200 transition-colors"
                                onResourceClick={onResourceClick}
                            />
                        </div>
                    </div>

                    {/* Beat Table */}
                    <div className="">
                         {/* We removed the separate header for Audio/Visual since it is implied by the cells now */}
                         <div className="bg-white dark:bg-stone-900">
                            {scene.children?.map((beat, idx) => renderBeat(beat, sceneIndex, idx))}
                         </div>
                         
                         {/* Add Beat Footer */}
                         <div className="p-2 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800">
                             <button 
                                onClick={() => addNode(scene.id, 'beat')}
                                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-lg transition-all shadow-sm hover:shadow group/add"
                             >
                                <Plus size={12} className="group-hover/add:scale-110 transition-transform" /> Add Beat
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  };

  const renderAct = (act: ScriptNode, actIndex: number) => (
    <div key={act.id} className="act-node group mb-16 relative">
       
       {/* Act Header */}
       <div className="flex items-center gap-5 mb-6 group/header relative z-20 pl-2">
           <button 
                onClick={() => toggleCollapse(act.id)}
                className="z-20 w-8 h-8 flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-500 hover:shadow transition-all shadow-sm shrink-0"
           >
                {act.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
           </button>
           
           <div className="flex-1 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-1">
                   <span className="text-[10px] font-black tracking-[0.2em] text-stone-400 dark:text-stone-500 uppercase">
                       Act {['I','II','III','IV','V'][actIndex] || actIndex + 1}
                   </span>
                   <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800"></div>
               </div>
               <div className="flex items-center gap-3 group/title">
                   <input 
                        value={act.title || ''}
                        onChange={(e) => updateNode(act.id, { title: e.target.value })}
                        className="bg-transparent border-none focus:ring-0 p-0 text-2xl font-bold font-script text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 w-full"
                        placeholder="Act Title"
                   />
                   <button onClick={() => deleteNode(act.id)} className="opacity-0 group-hover/title:opacity-100 p-2 text-stone-300 hover:text-red-500 transition-all">
                        <Trash2 size={16} />
                   </button>
               </div>
           </div>
       </div>

       {/* Content Container with Tree Rail */}
       <div className={`relative pl-8 ml-6 transition-all duration-500 ${act.isCollapsed ? 'opacity-50 h-0 overflow-hidden' : 'opacity-100'}`}>
          {/* The Rail */}
          <div className="absolute left-0 top-0 bottom-8 w-px bg-stone-200 dark:bg-stone-800"></div>
          
          <div className="pt-2 pb-4">
              {act.children?.map((scene, idx) => renderScene(scene, idx))}
              
              {/* New Scene Node Placeholder */}
              <div className="relative mt-8 group/new">
                  <div className="absolute -left-8 top-1/2 w-6 h-px bg-stone-200 dark:bg-stone-800 group-hover/new:bg-stone-400 transition-colors"></div>
                  <button 
                    onClick={() => addNode(act.id, 'scene')}
                    className="w-full py-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center gap-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all"
                  >
                    <Clapperboard size={16} /> Create New Scene
                  </button>
              </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="w-full pb-40 font-sans">
       {script.content.map((act, idx) => renderAct(act, idx))}

       <div className="mt-20 pt-10 border-t border-stone-200 dark:border-stone-800 flex justify-center">
          <button 
            onClick={() => addNode('root', 'act')}
            className="px-8 py-4 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={16} /> Add New Act
          </button>
       </div>

       {/* AI Director Modal */}
       {magicState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
                    <h3 className="font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Sparkles size={16} className="text-purple-600 dark:text-purple-400" /> AI Director
                    </h3>
                    <button onClick={() => setMagicState(null)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"><X size={18} /></button>
                </div>
                
                <div className="p-5">
                    <label className="block text-[10px] font-bold uppercase text-stone-400 mb-2 flex items-center gap-1">
                        <MessageSquare size={12} /> Director's Instructions
                    </label>
                    <textarea 
                        value={magicPrompt}
                        onChange={(e) => setMagicPrompt(e.target.value)}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-lg text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-purple-500/30 placeholder:text-stone-300 dark:placeholder:text-stone-600"
                        placeholder="E.g., Make the dialogue snappier and increase the tension..."
                        autoFocus
                    />
                    <p className="text-[10px] text-stone-400 mt-2 italic">
                        The AI will rewrite the audio/visual content of this beat based on your direction.
                    </p>
                </div>

                <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2 bg-stone-50 dark:bg-stone-900/50">
                    <button 
                        onClick={() => setMagicState(null)}
                        className="px-4 py-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg font-bold text-xs transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeMagic}
                        disabled={isMagicLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isMagicLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        {isMagicLoading ? 'Directing...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
       )}
    </div>
  );
};
