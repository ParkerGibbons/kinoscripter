
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Script, ViewMode, Resource, ScriptNode, ScriptVersion } from './types';
import { INITIAL_SCRIPT, TEMPLATES } from './constants';
import { ScriptEditor } from './components/ScriptEditor';
import { StoryClock } from './components/StoryClock';
import { ResourceManager } from './components/ResourceManager';
import { RichTextCell } from './components/RichTextCell';
import { TaskBoard, TodoItem } from './components/TaskBoard';
import { ScriptReader } from './components/ScriptReader';
import { generateScript } from './services/geminiService';
import { 
  Layout,
  Moon,
  Sun,
  ChevronDown,
  Check,
  Download,
  Copy,
  History,
  FileText,
  Trash2,
  Clock,
  RotateCcw,
  Calendar,
  Loader2,
  AlertCircle,
  Save,
  List,
  BarChart2,
  Book,
  Sparkles,
  LayoutTemplate,
  X,
  Wand2,
  Upload,
  Link as LinkIcon,
  File as FileIcon,
  Globe,
  CheckSquare,
  Maximize2,
  AlignLeft,
  BookOpen
} from 'lucide-react';

const getScriptStats = (script: Script) => {
    let words = 0;
    let duration = 0;
    
    const traverse = (nodes: ScriptNode[]) => {
        if (!nodes) return;
        nodes.forEach(node => {
            if (node.title) words += node.title.split(/\s+/).length;
            if (node.description) words += node.description.split(/\s+/).length;
            if (node.content) {
                const audio = (node.content.audio || '').replace(/<[^>]*>/g, ' ');
                const visual = (node.content.visual || '').replace(/<[^>]*>/g, ' ');
                words += audio.split(/\s+/).filter(w => w.trim().length > 0).length;
                words += visual.split(/\s+/).filter(w => w.trim().length > 0).length;
            }
            duration += (node.duration || 0);
            if (node.children) traverse(node.children);
        });
    };
    
    if (script.content) traverse(script.content);
    
    return {
        words,
        resources: script.resources ? script.resources.length : 0,
        duration
    };
};

// Helper to parse a HTML string and find check items
const extractTodosFromHtml = (html: string, nodeId: string, nodeType: string, field: string, context: string): TodoItem[] => {
    if (!html) return [];
    const todos: TodoItem[] = [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const items = tempDiv.querySelectorAll('.todo-item');
    items.forEach((item, idx) => {
        const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
            // Get text content (excluding the checkbox itself)
            const span = item.querySelector('span');
            const text = span ? span.innerHTML : item.textContent || '';
            
            // Determine status based on checked attr or data-status
            let status: 'todo' | 'in-progress' | 'done' = 'todo';
            
            if (checkbox.hasAttribute('checked') || checkbox.checked) {
                status = 'done';
            } else {
                const statusAttr = item.getAttribute('data-status');
                if (statusAttr === 'in-progress') status = 'in-progress';
            }

            todos.push({
                id: `${nodeId}-${field}-${idx}`,
                nodeId,
                nodeType,
                field,
                text: text,
                status,
                context,
                originalIndex: idx
            });
        }
    });
    
    return todos;
};

export default function App() {
  const [script, setScript] = useState<Script>(() => {
    let loaded = INITIAL_SCRIPT;
    try {
        const saved = localStorage.getItem('kinoscripter-v3'); // Bumped version to force load new demo content
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.content)) {
                 if (!parsed.history) parsed.history = [];
                 if (!parsed.resources) parsed.resources = [];
                 if (!parsed.metadata) parsed.metadata = { ...INITIAL_SCRIPT.metadata };
                 loaded = parsed;
            }
        }
    } catch (e) {
        console.error("Failed to load script from storage", e);
    }
    
    if (!loaded.history || loaded.history.length === 0) {
         loaded.history = [{
             id: 'v-init',
             label: 'Version 1',
             timestamp: new Date().toISOString(),
             stats: getScriptStats(loaded),
             data: {
                 content: JSON.parse(JSON.stringify(loaded.content)),
                 resources: JSON.parse(JSON.stringify(loaded.resources)),
                 metadata: { ...loaded.metadata }
             }
         }];
    }
    return loaded;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('script');
  const [highlightedScene, setHighlightedScene] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('kino-theme') === 'dark' || 
             (!localStorage.getItem('kino-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });
  
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showTaskBoard, setShowTaskBoard] = useState(false);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
  
  const [sidebarTab, setSidebarTab] = useState<'outline' | 'stats' | 'history' | 'tasks'>('outline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  // --- Generator State ---
  const [genTab, setGenTab] = useState<'templates' | 'ai' | 'url'>('templates');
  const [genPrompt, setGenPrompt] = useState('');
  const [genFormat, setGenFormat] = useState('Short Film');
  const [genUrl, setGenUrl] = useState('');
  const [genFileContent, setGenFileContent] = useState<string | null>(null);
  const [genFileName, setGenFileName] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const currentStats = useMemo(() => getScriptStats(script), [script.content, script.resources]);

  // --- Todo Aggregation ---
  const allTodos = useMemo(() => {
      let list: TodoItem[] = [];
      
      // 1. Metadata (Logline/Description)
      if (script.metadata.description) {
          list = list.concat(extractTodosFromHtml(script.metadata.description, 'metadata', 'script', 'description', 'Project Description'));
      }

      // 2. Traverse Content
      const traverse = (nodes: ScriptNode[], actName: string = '') => {
          nodes.forEach(node => {
              let contextName = actName;
              if (node.type === 'act') contextName = node.title || 'Act';
              if (node.type === 'scene') contextName = `${actName ? actName + ' > ' : ''}${node.title || 'Scene'}`;
              
              // Check description
              if (node.description) {
                  list = list.concat(extractTodosFromHtml(node.description, node.id, node.type, 'description', contextName));
              }
              // Check beat content
              if (node.content) {
                  if (node.content.audio) list = list.concat(extractTodosFromHtml(node.content.audio, node.id, node.type, 'audio', contextName + ' (Audio)'));
                  if (node.content.visual) list = list.concat(extractTodosFromHtml(node.content.visual, node.id, node.type, 'visual', contextName + ' (Visual)'));
              }
              
              if (node.children) traverse(node.children, contextName);
          });
      };
      traverse(script.content);

      // 3. Traverse Resources
      script.resources.forEach(res => {
          if (res.description) {
              list = list.concat(extractTodosFromHtml(res.description, res.id, res.type, 'description', `Wiki: ${res.label || res.value}`));
          }
      });

      return list;
  }, [script]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('kino-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('kino-theme', 'light');
    }
  }, [darkMode]);

  // Handle URL parameters for file loading
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const fileParam = urlParams.get('file');
      const filepathParam = urlParams.get('filepath');

      // If file parameter exists (base64-encoded JSON)
      if (fileParam) {
          try {
              const decoded = decodeURIComponent(fileParam);
              const parsed = JSON.parse(atob(decoded));
              loadScriptFromData(parsed);
              // Clean up URL
              window.history.replaceState({}, '', window.location.pathname);
          } catch (err) {
              console.error("Failed to load script from URL parameter:", err);
          }
      }
      // If filepath parameter exists, try File System Access API
      else if (filepathParam) {
          // Note: File System Access API doesn't support opening files by path directly
          // This would require a different approach or user interaction
          // For now, we'll just trigger the file picker
          loadScriptFromFileSystem();
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []); // Run once on mount
  
  // Adjust title height
  useEffect(() => {
      if (titleRef.current) {
          titleRef.current.style.height = 'auto';
          titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
  }, [script.metadata.title, viewMode]);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
        isMounted.current = true;
        return;
    }
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saving');
        const updatedScript = {
            ...script,
            metadata: {
                ...(script.metadata || INITIAL_SCRIPT.metadata),
                modified: new Date().toISOString()
            }
        };
        localStorage.setItem('kinoscripter-v3', JSON.stringify(updatedScript));
        setTimeout(() => {
             setSaveStatus(prev => prev === 'saving' ? 'saved' : prev);
        }, 600);
    }, 1500);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [script]);

  const scrollToNode = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHighlightedScene(id);
          setTimeout(() => setHighlightedScene(null), 2500);
      }
  };

  const handleClockSceneClick = (sceneId: string) => {
    setViewMode('script');
    // Allow DOM to update viewMode first
    setTimeout(() => scrollToNode(sceneId), 100);
  };
  
  const handleResourceClick = (resourceId: string) => {
      setActiveResourceId(resourceId);
      setShowResourceModal(true);
  };

  const handleTaskStatusChange = (todo: TodoItem, newStatus: 'todo' | 'in-progress' | 'done') => {
    const newScript = { ...script };
    let found = false;

    // Helper to update html string
    const updateHtml = (originalHtml: string) => {
        const div = document.createElement('div');
        div.innerHTML = originalHtml;
        const items = div.querySelectorAll('.todo-item');
        
        if (items[todo.originalIndex]) {
            const wrapper = items[todo.originalIndex] as HTMLElement;
            const checkbox = wrapper.querySelector('input[type="checkbox"]') as HTMLInputElement;
            
            // Clear old state
            checkbox.removeAttribute('checked');
            checkbox.checked = false;
            wrapper.removeAttribute('data-status');

            // Set new state
            if (newStatus === 'done') {
                checkbox.setAttribute('checked', 'true');
                checkbox.checked = true;
            } else if (newStatus === 'in-progress') {
                wrapper.setAttribute('data-status', 'in-progress');
            } else {
                // Todo default
                wrapper.setAttribute('data-status', 'todo');
            }
            return div.innerHTML;
        }
        return originalHtml;
    };

    // 1. Check Metadata
    if (todo.nodeId === 'metadata' && todo.field === 'description') {
         newScript.metadata.description = updateHtml(newScript.metadata.description);
         found = true;
    }

    // 2. Search Resources
    if (!found) {
        const resIndex = newScript.resources.findIndex(r => r.id === todo.nodeId);
        if (resIndex !== -1) {
            newScript.resources[resIndex].description = updateHtml(newScript.resources[resIndex].description || '');
            found = true;
        }
    }

    // 3. Search Content
    if (!found) {
        const traverseAndUpdate = (nodes: ScriptNode[]) => {
            for (const node of nodes) {
                if (node.id === todo.nodeId) {
                    if (todo.field === 'description' && node.description) {
                        node.description = updateHtml(node.description);
                    } else if (todo.field === 'audio' && node.content) {
                        node.content.audio = updateHtml(node.content.audio);
                    } else if (todo.field === 'visual' && node.content) {
                        node.content.visual = updateHtml(node.content.visual);
                    }
                    return true;
                }
                if (node.children && traverseAndUpdate(node.children)) return true;
            }
            return false;
        };
        traverseAndUpdate(newScript.content);
    }

    setScript(newScript);
  };

  const exportScript = (scriptToExport: Script = script, nameOverride?: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scriptToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const filename = nameOverride || (scriptToExport.metadata?.title || 'Untitled').replace(/\s+/g, '_').toLowerCase();
    downloadAnchorNode.setAttribute("download", `${filename}.kinoscript`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Helper function to load script from parsed JSON
  const loadScriptFromData = (parsed: any) => {
      try {
          if (!parsed.content) throw new Error("Invalid structure");
          if (!parsed.history) parsed.history = [];
          if (!parsed.resources) parsed.resources = [];
          if (parsed.history.length === 0) {
               parsed.history = [{
                   id: 'v-init-loaded',
                   label: 'Version 1',
                   timestamp: new Date().toISOString(),
                   stats: getScriptStats(parsed),
                   data: {
                       content: JSON.parse(JSON.stringify(parsed.content)),
                       resources: JSON.parse(JSON.stringify(parsed.resources)),
                       metadata: { ...parsed.metadata }
                   }
               }];
          }
          setScript(parsed);
          setShowFileMenu(false);
          return true;
      } catch (err) {
          console.error("Failed to load script:", err);
          alert("Invalid Kinoscript file");
          return false;
      }
  };

  const loadScript = (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileReader = new FileReader();
      if (e.target.files && e.target.files[0]) {
          fileReader.readAsText(e.target.files[0], "UTF-8");
          fileReader.onload = (event) => {
              if(event.target?.result) {
                  try {
                      const parsed = JSON.parse(event.target.result as string);
                      loadScriptFromData(parsed);
                  } catch (err) {
                      alert("Invalid Kinoscript file");
                  }
              }
          };
      }
  };

  // Load script from File System Access API
  const loadScriptFromFileSystem = async () => {
      // Check if File System Access API is available
      if (!('showOpenFilePicker' in window)) {
          // Fallback: trigger file input
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.kinoscript,.json';
          fileInput.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                      if (event.target?.result) {
                          try {
                              const parsed = JSON.parse(event.target.result as string);
                              loadScriptFromData(parsed);
                          } catch (err) {
                              alert("Invalid Kinoscript file");
                          }
                      }
                  };
                  reader.readAsText(target.files[0], "UTF-8");
              }
          };
          fileInput.click();
          return;
      }

      try {
          const [fileHandle] = await (window as any).showOpenFilePicker({
              types: [{
                  description: 'Kinoscript files',
                  accept: {
                      'application/json': ['.kinoscript', '.json']
                  }
              }],
              multiple: false
          });
          
          const file = await fileHandle.getFile();
          const text = await file.text();
          const parsed = JSON.parse(text);
          loadScriptFromData(parsed);
      } catch (err: any) {
          // User cancelled or error occurred
          if (err.name !== 'AbortError') {
              console.error("Failed to open file:", err);
          }
      }
  };

  // Handle file upload for generation context
  const handleGenFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setGenFileName(file.name);
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setGenFileContent(ev.target.result as string);
              }
          };
          reader.readAsText(file);
      }
  };

  const handleGenerateScript = async () => {
      if (!genPrompt && !genFileContent && !genUrl) return;
      
      setIsGenerating(true);
      
      const promptToUse = genTab === 'url' 
          ? `Analyze the content at the provided URL (${genUrl}) and convert it into a script structure.` 
          : genPrompt;

      const newScript = await generateScript({
          prompt: promptToUse,
          format: genFormat,
          referenceContent: genFileContent || undefined,
          referenceUrl: genUrl || undefined
      });
      
      setIsGenerating(false);
      
      if (newScript) {
          // Ensure basics exist
          if (!newScript.history) newScript.history = [];
          
          setScript(newScript);
          setShowNewProjectModal(false);
          setShowFileMenu(false);
          // Reset form
          setGenPrompt('');
          setGenFileContent(null);
          setGenFileName(null);
          setGenUrl('');
      } else {
          alert("Failed to generate script. Please check API key or try a simpler prompt.");
      }
  };

  const addResource = (r: Resource) => {
      setScript(prev => ({ ...prev, resources: [...prev.resources, r] }));
  };

  const updateResource = (updated: Resource) => {
      setScript(prev => ({
          ...prev,
          resources: prev.resources.map(r => r.id === updated.id ? updated : r)
      }));
  };

  const deleteResource = (id: string) => {
      setScript(prev => ({
          ...prev,
          resources: prev.resources.filter(r => r.id !== id)
      }));
  };

  const formatDate = (isoString: string) => {
      try {
        return new Date(isoString).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
      } catch(e) {
          return 'Unknown Date';
      }
  };

  const handleSaveVersion = () => {
      const versionId = `v-${Date.now()}`;
      const versionLabel = `Version ${script.history.length + 1}`;
      
      const newVersion: ScriptVersion = {
          id: versionId,
          label: versionLabel,
          timestamp: new Date().toISOString(),
          stats: getScriptStats(script),
          data: {
              content: JSON.parse(JSON.stringify(script.content)),
              resources: JSON.parse(JSON.stringify(script.resources)),
              metadata: { ...script.metadata }
          }
      };

      setScript(prev => ({
          ...prev,
          history: [newVersion, ...prev.history] 
      }));
      setShowSaveMenu(false);
      setSidebarTab('history'); 
  };

  const handleSaveAsNewScript = () => {
      const newId = `script-${Date.now()}`;
      const copy = {
          ...script,
          id: newId,
          metadata: {
              ...script.metadata,
              title: `${script.metadata.title} (Copy)`,
              created: new Date().toISOString(),
              modified: new Date().toISOString()
          },
          history: [] 
      };
      copy.history = [{
           id: 'v-init-copy',
           label: 'Version 1',
           timestamp: new Date().toISOString(),
           stats: getScriptStats(copy),
           data: {
               content: JSON.parse(JSON.stringify(copy.content)),
               resources: JSON.parse(JSON.stringify(copy.resources)),
               metadata: { ...copy.metadata }
           }
      }];
      
      exportScript(copy);
      setShowSaveMenu(false);
  };

  const handleRestoreVersion = (version: ScriptVersion) => {
      if (confirm(`Restore "${version.label}" from ${formatDate(version.timestamp)}?`)) {
          setScript(prev => ({
              ...prev,
              content: JSON.parse(JSON.stringify(version.data.content)),
              resources: JSON.parse(JSON.stringify(version.data.resources)),
              metadata: { ...prev.metadata, ...version.data.metadata }, 
          }));
      }
  };

  return (
    <div className={`h-screen flex flex-col font-sans selection:bg-stone-200 dark:selection:bg-stone-700 selection:text-stone-900 dark:selection:text-stone-50 overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-stone-950 text-stone-200' : 'bg-paper text-ink'}`}>
      
      {showResourceModal && (
          <ResourceManager 
              resources={script.resources}
              onAdd={addResource}
              onUpdate={updateResource}
              onDelete={deleteResource}
              onClose={() => setShowResourceModal(false)}
              initialSelectedId={activeResourceId}
          />
      )}

      {showTaskBoard && (
          <TaskBoard 
              todos={allTodos}
              onStatusChange={handleTaskStatusChange}
              onNavigate={(nodeId) => {
                  // If it's a resource, open modal. If node, scroll.
                  if (nodeId.startsWith('res-')) {
                      setActiveResourceId(nodeId);
                      setShowResourceModal(true);
                  } else if (nodeId === 'metadata') {
                      setViewMode('script');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                      setViewMode('script');
                      scrollToNode(nodeId);
                  }
              }}
              onClose={() => setShowTaskBoard(false)}
          />
      )}

      {/* New Project / Templates Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-stone-950 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                 {/* Modal Header */}
                 <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/30">
                     <div>
                         <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Start New Project</h2>
                         <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Choose a template, import content, or let AI generate a draft.</p>
                     </div>
                     <button onClick={() => setShowNewProjectModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-900 rounded-full transition-colors">
                         <X size={20} className="text-stone-500" />
                     </button>
                 </div>

                 {/* Tabs */}
                 <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 bg-stone-50/30 dark:bg-stone-900/20">
                     <button 
                        onClick={() => setGenTab('templates')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${genTab === 'templates' ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                     >
                         <LayoutTemplate size={16} /> Preset Templates
                     </button>
                     <button 
                        onClick={() => setGenTab('ai')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${genTab === 'ai' ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                     >
                         <Sparkles size={16} /> AI Generator
                     </button>
                     <button 
                        onClick={() => setGenTab('url')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${genTab === 'url' ? 'border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                     >
                         <Globe size={16} /> From URL
                     </button>
                 </div>

                 {/* Content */}
                 <div className="flex-1 overflow-y-auto bg-stone-50/30 dark:bg-stone-900/30 relative">
                     
                     {isGenerating && (
                         <div className="absolute inset-0 z-20 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                             <div className="w-16 h-16 rounded-full border-4 border-stone-200 dark:border-stone-800 border-t-stone-600 dark:border-t-stone-400 animate-spin"></div>
                             <div>
                                <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">Generating Script...</h3>
                                <p className="text-stone-500 dark:text-stone-400 max-w-sm mt-2">Gemini is analyzing inputs and structuring acts, scenes, and beats.</p>
                             </div>
                         </div>
                     )}

                     {genTab === 'templates' && (
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                             {TEMPLATES.map(t => (
                                 <button 
                                    key={t.id}
                                    onClick={() => {
                                        setScript(JSON.parse(JSON.stringify(t.script)));
                                        setShowNewProjectModal(false);
                                        setShowFileMenu(false);
                                    }}
                                    className="flex flex-col text-left bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md rounded-xl p-5 transition-all group"
                                 >
                                     <div className="flex items-center justify-between mb-3">
                                         <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                                             {t.type}
                                         </span>
                                     </div>
                                     <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-2 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">{t.name}</h3>
                                     <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                                         {t.description}
                                     </p>
                                 </button>
                             ))}
                         </div>
                     )}
                     
                     {/* AI Tab Content */}
                     {genTab === 'ai' && (
                         <div className="p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="space-y-6">
                                 <div className="bg-stone-100 dark:bg-stone-900 p-4 rounded-lg border border-stone-200 dark:border-stone-800 flex gap-3">
                                     <Wand2 className="shrink-0 text-stone-600 dark:text-stone-400" size={20} />
                                     <div className="text-sm text-stone-700 dark:text-stone-300">
                                         Describe your idea or upload a document. AI will create a fully structured Kinoscript with visual tags.
                                     </div>
                                 </div>

                                 <div>
                                     <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Project Format</label>
                                     <select 
                                        value={genFormat}
                                        onChange={(e) => setGenFormat(e.target.value)}
                                        className="w-full p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-sm"
                                     >
                                         <option>Short Film</option>
                                         <option>Commercial (30s)</option>
                                         <option>Commercial (60s)</option>
                                         <option>Music Video</option>
                                         <option>Documentary Outline</option>
                                         <option>Feature Film Outline</option>
                                         <option>Youtube Video Essay</option>
                                     </select>
                                 </div>

                                 <div>
                                     <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Your Idea / Prompt</label>
                                     <textarea 
                                        value={genPrompt}
                                        onChange={(e) => setGenPrompt(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-stone-500/20 outline-none"
                                        placeholder="A sci-fi thriller about a robot who learns to paint..."
                                     />
                                 </div>

                                 <div>
                                     <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Reference File (Optional)</label>
                                     <div className="relative">
                                        <input 
                                            type="file" 
                                            onChange={handleGenFileUpload}
                                            className="hidden" 
                                            id="gen-file-upload"
                                            accept=".txt,.md,.json,.csv"
                                        />
                                        <label 
                                            htmlFor="gen-file-upload"
                                            className="w-full flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-sm cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors truncate"
                                        >
                                            <Upload size={14} className="text-stone-400" />
                                            <span className="truncate text-stone-600 dark:text-stone-300">{genFileName || "Upload text/md file..."}</span>
                                        </label>
                                     </div>
                                 </div>

                                 <button 
                                    onClick={handleGenerateScript}
                                    disabled={!genPrompt && !genFileContent}
                                    className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-all rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                                 >
                                     <Sparkles size={18} /> Generate Draft
                                 </button>
                             </div>
                         </div>
                     )}

                     {/* URL Tab Content */}
                     {genTab === 'url' && (
                        <div className="p-8 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col justify-center min-h-[60%]">
                             <div className="text-center mb-8">
                                 <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                     <Globe size={32} className="text-stone-400" />
                                 </div>
                                 <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">Convert URL to Script</h3>
                                 <p className="text-sm text-stone-500 mt-2">Enter a link to a short story, article, or existing screenplay. Gemini will analyze it using Google Search and format it.</p>
                             </div>

                             <div className="space-y-4">
                                 <input 
                                     value={genUrl}
                                     onChange={(e) => setGenUrl(e.target.value)}
                                     className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-base focus:ring-2 focus:ring-stone-500/20 outline-none shadow-sm"
                                     placeholder="https://..."
                                 />
                                 
                                 <button 
                                     onClick={handleGenerateScript}
                                     disabled={!genUrl}
                                     className="w-full py-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-all rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                 >
                                     <Sparkles size={18} /> Analyze & Generate
                                 </button>
                             </div>
                        </div>
                     )}
                 </div>
            </div>
        </div>
      )}

      <header className="h-14 border-b border-stone-200/50 dark:border-stone-800/50 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 relative transition-colors duration-300 shadow-sm">
        
        <div className="flex items-center gap-4">
           <div className="relative">
               <button 
                 onClick={() => setShowFileMenu(!showFileMenu)}
                 className="flex items-center space-x-2 font-mono text-sm text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors"
               >
                   <span className="font-bold tracking-tight">KinoScripter</span>
                   <span className="text-stone-400 dark:text-stone-600">/</span>
                   <span className="font-medium truncate max-w-[200px] text-stone-600 dark:text-stone-300">{script.metadata.title || 'Untitled'}</span>
                   <ChevronDown size={12} className="text-stone-400 ml-1" />
               </button>
               
               {showFileMenu && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowFileMenu(false)}></div>
                   <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                       <div className="px-4 py-2 text-[10px] uppercase font-bold text-stone-400 tracking-wider border-b border-stone-100 dark:border-stone-800 mb-1">Project</div>
                       <button onClick={() => {setShowNewProjectModal(true); setShowFileMenu(false)}} className="block w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                           <LayoutTemplate size={14} className="text-stone-500" /> New Project...
                       </button>
                       <label className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer flex items-center gap-2 transition-colors">
                           <FileText size={14} className="text-stone-400" /> Load Script File
                           <input type="file" accept=".kinoscript,.json" onChange={loadScript} className="hidden" />
                       </label>
                       <div className="my-1 border-t border-stone-100 dark:border-stone-800"></div>
                       <button onClick={() => {setScript(INITIAL_SCRIPT); setShowFileMenu(false)}} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors">
                           <Trash2 size={14} /> Reset Demo
                       </button>
                   </div>
                   </>
               )}
           </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-0.5 rounded-lg border border-stone-200 dark:border-stone-800">
                <button onClick={() => setViewMode('script')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'script' ? 'bg-white dark:bg-stone-800 shadow text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>Editor</button>
                <button onClick={() => setViewMode('reader')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'reader' ? 'bg-white dark:bg-stone-800 shadow text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>
                     <BookOpen size={12} /> Reader
                </button>
                <button onClick={() => setViewMode('clock')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'clock' ? 'bg-white dark:bg-stone-800 shadow text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>Clock</button>
            </div>

            <div className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-2"></div>

            <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative">
                <button 
                    onClick={() => setShowSaveMenu(!showSaveMenu)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                        saveStatus === 'unsaved' 
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800'
                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                >
                    {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin" /> : (saveStatus === 'saved' ? <Check size={12} /> : <AlertCircle size={12} />)}
                    <span>{saveStatus === 'saved' ? 'Saved' : (saveStatus === 'saving' ? 'Saving...' : 'Unsaved')}</span>
                    <ChevronDown size={10} />
                </button>

                {showSaveMenu && (
                   <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowSaveMenu(false)}></div>
                   <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                       <div className="px-4 py-2 text-[10px] uppercase font-bold text-stone-400 tracking-wider border-b border-stone-100 dark:border-stone-800 mb-1">Versioning</div>
                       <button onClick={handleSaveVersion} className="block w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                           <History size={14} className="text-stone-500" /> Snapshot Version
                       </button>
                       <button onClick={handleSaveAsNewScript} className="block w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                           <Copy size={14} className="text-stone-500" /> Save as Copy
                       </button>
                       <div className="my-1 border-t border-stone-100 dark:border-stone-800"></div>
                       <button onClick={() => exportScript()} className="block w-full text-left px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 transition-colors">
                           <Download size={14} className="text-green-600" /> Export to File
                       </button>
                   </div>
                   </>
               )}
            </div>

            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-md transition-colors ${sidebarOpen ? 'text-stone-900 bg-stone-100 dark:text-stone-100 dark:bg-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <Layout size={18} />
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto relative scroll-smooth bg-stone-50/30 dark:bg-stone-950/30">
            <div className="max-w-5xl mx-auto py-12 px-6 md:px-12 relative min-h-full">
              
              {viewMode === 'script' && (
                  <div className="animate-in fade-in duration-500">
                      <div className="mb-16 relative mx-auto max-w-4xl">
                          <div className="bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-black/50 relative overflow-hidden group transition-all hover:border-stone-300 dark:hover:border-stone-700">
                              
                              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-grain bg-repeat"></div>
                              {/* Minimal neutral gradient */}
                              <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-stone-50/50 dark:from-stone-900/10 to-transparent pointer-events-none"></div>

                              <div className="relative z-10 p-8 md:p-10 flex flex-col gap-6">
                                  
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-10">
                                      <div className="flex-1 w-full min-w-0 space-y-3">
                                          <textarea 
                                              ref={titleRef}
                                              value={script.metadata.title}
                                              onChange={(e) => setScript({...script, metadata: {...script.metadata, title: e.target.value}})}
                                              className="w-full resize-none overflow-hidden bg-transparent border-none focus:ring-0 p-0 text-2xl md:text-4xl font-black font-script text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 tracking-tight leading-tight uppercase"
                                              placeholder="UNTITLED SCREENPLAY"
                                              rows={1}
                                              spellCheck={false}
                                          />
                                          
                                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                                              <div className="flex items-center gap-2">
                                                  <span className="text-stone-400 opacity-50">By</span>
                                                  <input 
                                                      value={script.metadata.author}
                                                      onChange={(e) => setScript({...script, metadata: {...script.metadata, author: e.target.value}})}
                                                      className="bg-transparent border-b border-stone-300 dark:border-stone-700 focus:border-stone-500 focus:ring-0 py-0 px-0 text-stone-800 dark:text-stone-200 min-w-[60px] transition-colors placeholder-stone-300 font-bold uppercase"
                                                      placeholder="NAME"
                                                  />
                                              </div>
                                              <div className="w-px h-3 bg-stone-300 dark:bg-stone-700"></div>
                                              <div className="flex items-center gap-2">
                                                  <span className="text-stone-400 opacity-50">Draft</span>
                                                  <span className="font-bold text-stone-800 dark:text-stone-200">{script.history.length + 1}.0</span>
                                              </div>
                                               <div className="w-px h-3 bg-stone-300 dark:bg-stone-700"></div>
                                               <div className="flex items-center gap-2">
                                                  <span className="text-stone-400 opacity-50">Time</span>
                                                  <span className="font-bold text-stone-800 dark:text-stone-200">{Math.floor(currentStats.duration / 60)}m</span>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="shrink-0 relative group hidden sm:block">
                                           <div 
                                              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-stone-100 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 shadow-inner flex items-center justify-center cursor-pointer hover:scale-105 hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-300 overflow-hidden"
                                              onClick={() => setViewMode('clock')}
                                              title="View Story Clock"
                                           >
                                              <div className="w-full h-full">
                                                 <StoryClock 
                                                    script={script} 
                                                    mode="glyph" 
                                                    darkMode={darkMode} 
                                                    onClockClick={() => setViewMode('clock')} 
                                                 />
                                              </div>
                                           </div>
                                      </div>
                                  </div>

                                  {/* UPDATED DESCRIPTION BOX - Matches Beat Cell Style */}
                                  <div className="w-full pt-6 border-t border-stone-100 dark:border-stone-800/50 group/desc">
                                       <div className="relative">
                                            <div className="text-[9px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 mb-2 select-none group-hover/desc:text-stone-500 dark:group-hover/desc:text-stone-500 transition-colors flex items-center gap-2">
                                                <AlignLeft size={10} /> Description / Logline
                                            </div>
                                            <div className="p-4 bg-stone-50/20 dark:bg-stone-900/20 border border-stone-200 dark:border-stone-800/50 rounded-lg hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors">
                                               <RichTextCell 
                                                  html={script.metadata.description}
                                                  onChange={(val) => setScript({...script, metadata: {...script.metadata, description: val}})}
                                                  resources={script.resources}
                                                  // Matching Visual Cell Style: font-mono, text-sm, leading-loose
                                                  className="font-mono text-sm leading-loose text-stone-600 dark:text-stone-300 min-h-[4em] focus:text-stone-900 dark:focus:text-stone-100 transition-colors focus:outline-none"
                                                  placeholder="Start typing the logline, synopsis, or project notes here..."
                                                  onResourceClick={handleResourceClick}
                                               />
                                            </div>
                                       </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <ScriptEditor 
                          script={script} 
                          setScript={setScript} 
                          highlightedSceneId={highlightedScene}
                          onResourceClick={handleResourceClick}
                          onClockClick={() => setViewMode('clock')}
                      />
                  </div>
              )}
              
              {viewMode === 'reader' && (
                  <div className="flex justify-center py-6 animate-in fade-in duration-500">
                      <ScriptReader script={script} />
                  </div>
              )}

              {viewMode === 'clock' && (
                  <div className="h-[80vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                      <StoryClock 
                        script={script} 
                        mode="full"
                        onSceneClick={handleClockSceneClick}
                        darkMode={darkMode} 
                      />
                  </div>
              )}
            </div>
          </main>

          {sidebarOpen && (
              <aside className="w-80 border-l border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-950/50 backdrop-blur-sm flex flex-col transition-all duration-300">
                  <div className="flex border-b border-stone-200 dark:border-stone-800">
                      <button 
                        onClick={() => setSidebarTab('outline')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'outline' ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-900/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                      >
                          <List size={12} />
                      </button>
                      <button 
                        onClick={() => setSidebarTab('stats')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'stats' ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-900/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                      >
                          <Sparkles size={12} />
                      </button>
                      <button 
                        onClick={() => setSidebarTab('history')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'history' ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-900/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                      >
                          <History size={12} />
                      </button>
                      <button 
                        onClick={() => setSidebarTab('tasks')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'tasks' ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 bg-stone-50/50 dark:bg-stone-900/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                      >
                          <CheckSquare size={12} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                      
                      {sidebarTab === 'outline' && (
                          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
                              {script.content.map((act, actIdx) => (
                                  <div key={act.id}>
                                      <button 
                                          onClick={() => scrollToNode(act.id)}
                                          className="w-full text-left mb-2 flex items-center gap-2 group hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                                      >
                                           <div className="text-[9px] font-black text-stone-300 group-hover:text-stone-500 dark:group-hover:text-stone-400 uppercase tracking-widest border border-stone-200 dark:border-stone-800 rounded px-1.5 py-0.5">
                                               Act {['I','II','III','IV','V'][actIdx] || actIdx + 1}
                                           </div>
                                           <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate flex-1">{act.title || 'Untitled Act'}</span>
                                      </button>
                                      
                                      <div className="pl-3 ml-2 border-l border-stone-200 dark:border-stone-800 space-y-0.5">
                                          {act.children?.map((scene, sceneIdx) => (
                                               <button 
                                                  key={scene.id}
                                                  onClick={() => scrollToNode(scene.id)}
                                                  className={`w-full text-left px-3 py-1.5 text-[10px] font-medium font-mono truncate transition-colors rounded hover:bg-stone-100 dark:hover:bg-stone-800 ${highlightedScene === scene.id ? 'bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}
                                              >
                                                  <span className="opacity-40 mr-2 text-[9px]">{sceneIdx + 1}</span>
                                                  {scene.title || 'UNTITLED SCENE'}
                                               </button>
                                          ))}
                                          {(!act.children || act.children.length === 0) && (
                                              <div className="px-3 py-1 text-[10px] text-stone-300 italic">No scenes</div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                              
                              {script.content.length === 0 && (
                                  <div className="text-center py-10 text-stone-400 text-xs">
                                      No acts created.
                                  </div>
                              )}
                          </div>
                      )}

                      {sidebarTab === 'stats' && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                              {/* ... Resource list same as before ... */}
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Wiki Resources</h3>
                                  <button onClick={() => setShowResourceModal(true)} className="text-[10px] font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1">Manage</button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                  {script.resources.map(r => (
                                      <button 
                                        key={r.id}
                                        onClick={() => handleResourceClick(r.id)}
                                        className="text-left p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-sm transition-all group"
                                      >
                                          <div className="flex items-center gap-2 mb-1.5">
                                              <div className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0" style={{ backgroundColor: r.color }}>
                                                  <div dangerouslySetInnerHTML={{ __html: r.icon || '' }} className="w-2.5 h-2.5 [&>svg]:w-full [&>svg]:h-full" />
                                              </div>
                                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{r.type}</span>
                                          </div>
                                          <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-stone-600 dark:group-hover:text-stone-300">{r.label || r.value}</div>
                                      </button>
                                  ))}
                                  <button 
                                    onClick={() => setShowResourceModal(true)}
                                    className="p-2 rounded-lg border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-900/10 transition-colors flex flex-col items-center justify-center text-stone-400 hover:text-stone-600"
                                  >
                                      <span className="text-lg mb-1">+</span>
                                      <span className="text-[9px] font-bold uppercase">Add New</span>
                                  </button>
                              </div>
                              
                              <div className="mt-6 pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
                                  <h3 className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Script Stats</h3>
                                  <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                                      <div className="text-[10px] text-stone-400 mb-1">Total Words</div>
                                      <div className="text-2xl font-black font-mono">{currentStats.words}</div>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                                      <div className="text-[10px] text-stone-400 mb-1">Est. Runtime</div>
                                      <div className="text-2xl font-black font-mono">{Math.floor(currentStats.duration / 60)}m {currentStats.duration % 60}s</div>
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      {sidebarTab === 'history' && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                              {script.history.map((version, idx) => (
                                  <div key={version.id} className="group p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm hover:border-stone-300 dark:hover:border-stone-600 transition-all">
                                      <div className="flex items-center justify-between mb-2">
                                          <span className="text-sm font-bold text-stone-800 dark:text-stone-200">{version.label}</span>
                                          {idx === 0 && <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold uppercase border border-stone-200">Latest</span>}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mb-3">
                                          <Calendar size={10} />
                                          <span>{formatDate(version.timestamp)}</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-500 mb-3 bg-stone-50 dark:bg-stone-950 p-2 rounded">
                                          <div>{version.stats.words} words</div>
                                          <div>{Math.floor(version.stats.duration / 60)}m {version.stats.duration % 60}s</div>
                                      </div>
                                      <button 
                                        onClick={() => handleRestoreVersion(version)}
                                        className="w-full py-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 rounded transition-colors flex items-center justify-center gap-2"
                                      >
                                          <RotateCcw size={12} /> Restore
                                      </button>
                                  </div>
                              ))}
                              {script.history.length === 0 && (
                                  <div className="text-center text-stone-400 text-xs py-8">No version history available.</div>
                              )}
                          </div>
                      )}

                      {sidebarTab === 'tasks' && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                               <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800">
                                   <div className="flex items-center justify-between mb-2">
                                       <h3 className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Total Tasks</h3>
                                       <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{allTodos.length}</span>
                                   </div>
                                   <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden flex">
                                       <div className="h-full bg-cyan-600 transition-all duration-500" style={{ width: `${allTodos.length > 0 ? (allTodos.filter(t => t.status === 'done').length / allTodos.length) * 100 : 0}%` }}></div>
                                       <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${allTodos.length > 0 ? (allTodos.filter(t => t.status === 'in-progress').length / allTodos.length) * 100 : 0}%` }}></div>
                                   </div>
                                   <div className="flex justify-between mt-2 text-[9px] text-stone-400">
                                       <div className="flex items-center gap-2">
                                           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-600"></div> {allTodos.filter(t => t.status === 'done').length}</div>
                                           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {allTodos.filter(t => t.status === 'in-progress').length}</div>
                                       </div>
                                       <span>{allTodos.filter(t => t.status === 'todo').length} left</span>
                                   </div>
                               </div>

                               <button 
                                    onClick={() => setShowTaskBoard(true)}
                                    className="w-full py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                               >
                                   <Maximize2 size={14} /> Open Project Board
                               </button>

                               <div className="space-y-1 mt-4">
                                   {allTodos.slice(0, 10).map(todo => (
                                       <button 
                                            key={todo.id}
                                            onClick={() => handleTaskStatusChange(todo, todo.status === 'done' ? 'todo' : 'done')}
                                            className={`w-full text-left group flex items-start gap-3 p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-colors ${todo.status === 'in-progress' ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}
                                       >
                                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${todo.status === 'done' ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-stone-300 dark:border-stone-600 bg-transparent'}`}>
                                                {todo.status === 'done' && <Check size={10} />}
                                            </div>
                                            <div className={`text-xs leading-relaxed ${todo.status === 'done' ? 'line-through text-stone-400' : 'text-stone-700 dark:text-stone-300'}`}>
                                                <div className="line-clamp-2" dangerouslySetInnerHTML={{__html: todo.text}} />
                                                <div className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-wide flex items-center gap-1">
                                                    {todo.status === 'in-progress' && <Loader2 size={8} className="text-orange-500 animate-spin" />}
                                                    {todo.context}
                                                </div>
                                            </div>
                                       </button>
                                   ))}
                                   {allTodos.length > 10 && (
                                       <div className="text-center text-[10px] text-stone-400 pt-2">
                                           + {allTodos.length - 10} more tasks
                                       </div>
                                   )}
                                   {allTodos.length === 0 && (
                                       <div className="text-center py-8 text-stone-400 text-xs italic px-4">
                                           No tasks found. Type <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-cyan-600">/todo</code> in any text field to create one.
                                       </div>
                                   )}
                               </div>
                          </div>
                      )}
                  </div>
              </aside>
          )}
      </div>
    </div>
  );
}