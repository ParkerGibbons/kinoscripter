
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Resource, ResourceType } from '../types';
import { 
  X, Plus, Trash2, Save, Sparkles, Search, 
  ChevronRight, ChevronDown, User, MapPin, Box, 
  FileText, Film, Globe, Network, Edit3, Tag,
  LayoutGrid, MoreHorizontal, Filter, ImageIcon, Type
} from 'lucide-react';
import { RichTextCell } from './RichTextCell';
import { generateResourceProfile, generateImage } from '../services/geminiService';
import { ICONS } from '../constants';

interface ResourceManagerProps {
  resources: Resource[];
  onAdd: (r: Resource) => void;
  onUpdate: (r: Resource) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  initialSelectedId?: string | null;
}

// Flexoki Palette
const COLORS = [
    '#AF3029', '#BC5215', '#AD8301', '#66800B', '#24837B', '#205EA6', '#5E409D', '#A02F6F', '#100F0F', '#6F6E69', '#878580', '#CECDC3'
];

const ICON_PRESETS = [
    { name: 'user', svg: ICONS.user },
    { name: 'map', svg: ICONS.map },
    { name: 'box', svg: ICONS.box },
    { name: 'image', svg: ICONS.film },
    { name: 'target', svg: ICONS.target },
    { name: 'key', svg: ICONS.key },
    { name: 'skull', svg: ICONS.skull },
    { name: 'zap', svg: ICONS.zap },
    { name: 'clock', svg: ICONS.clock },
    { name: 'globe', svg: ICONS.globe },
    { name: 'anchor', svg: ICONS.anchor },
    { name: 'star', svg: ICONS.star },
];

const TYPE_CONFIG: Record<ResourceType, { label: string, icon: React.ReactNode, defaultColor: string, defaultIcon: string }> = {
    character: { label: 'Character', icon: <User size={12} />, defaultColor: '#A02F6F', defaultIcon: ICONS.user }, 
    location: { label: 'Location', icon: <MapPin size={12} />, defaultColor: '#BC5215', defaultIcon: ICONS.map },
    object: { label: 'Object', icon: <Box size={12} />, defaultColor: '#205EA6', defaultIcon: ICONS.box }, 
    media: { label: 'Media', icon: <Film size={12} />, defaultColor: '#5E409D', defaultIcon: ICONS.film }, 
    web: { label: 'Web', icon: <Globe size={12} />, defaultColor: '#24837B', defaultIcon: ICONS.globe }, 
    note: { label: 'Note', icon: <FileText size={12} />, defaultColor: '#6F6E69', defaultIcon: ICONS.book },
};

const getConfig = (type: string) => TYPE_CONFIG[type as ResourceType] || TYPE_CONFIG['note'];

export const ResourceManager: React.FC<ResourceManagerProps> = ({ resources, onAdd, onUpdate, onDelete, onClose, initialSelectedId }) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null);
  const [activeTab, setActiveTab] = useState<'editor' | 'graph'>('editor');
  const [activeFilter, setActiveFilter] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Brainstorm Modal State
  const [showBrainstormDialog, setShowBrainstormDialog] = useState(false);
  const [brainstormType, setBrainstormType] = useState<'text' | 'image'>('text');
  const [brainstormPrompt, setBrainstormPrompt] = useState('');
  const [generatedResult, setGeneratedResult] = useState<string | null>(null); 
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  const [tagInput, setTagInput] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [editBuffer, setEditBuffer] = useState<Resource | null>(null);

  useEffect(() => {
    if (selectedId) {
        const res = resources.find(r => r.id === selectedId);
        if (res) {
            setEditBuffer({ ...res });
        } else {
            setSelectedId(null);
        }
    } else {
        setEditBuffer(null);
    }
  }, [selectedId, resources]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
              const target = event.target as HTMLElement;
              if (target.closest('.color-picker-popover')) return;
              if (target.closest('.add-menu-popover')) return;
              if (target.closest('.brainstorm-modal')) return;
              // Don't close if clicking inside the resource manager itself (redundant check but safe)
              if (target.closest('.resource-manager-container')) return; 
              
              handleSave();
              onClose();
          }
      };
      
      const handleEsc = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
              if (showBrainstormDialog) {
                  setShowBrainstormDialog(false);
                  return;
              }
              handleSave();
              onClose();
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEsc);
      };
  }, [editBuffer, onClose, showBrainstormDialog]);

  const handleSave = () => {
      if (editBuffer) {
          onUpdate(editBuffer);
      }
  };

  const handleBufferChange = (key: keyof Resource, value: any) => {
      if (editBuffer) {
          const updated = { ...editBuffer, [key]: value };
          setEditBuffer(updated);
          onUpdate(updated); 
      }
  };

  const handleInternalLinkClick = (id: string) => {
      handleSave();
      setSelectedId(id);
      setActiveTab('editor');
  };

  const handleExecuteBrainstorm = async () => {
      if (!editBuffer) return;
      setIsBrainstorming(true);
      setGeneratedResult(null);

      if (brainstormType === 'text') {
          const result = await generateResourceProfile(
              editBuffer.label, 
              editBuffer.type, 
              editBuffer.description || '', 
              brainstormPrompt
          );
          setGeneratedResult(result);
      } else {
          // Image Gen
          const context = editBuffer.description ? editBuffer.description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
          const fullPrompt = `Concept art for a ${editBuffer.type} named "${editBuffer.label}". ${context}. ${brainstormPrompt}`;
          const result = await generateImage(fullPrompt);
          setGeneratedResult(result);
      }
      setIsBrainstorming(false);
  };

  const handleAcceptBrainstorm = () => {
      if (!generatedResult || !editBuffer) return;
      
      if (brainstormType === 'text') {
          handleBufferChange('description', (editBuffer.description || '') + '<br/><hr/><br/>' + generatedResult);
      } else {
          // Create new media resource
          const newMedia: Resource = {
              id: `res-img-${Date.now()}`,
              type: 'media',
              value: generatedResult, // base64 url
              label: `Art: ${editBuffer.label}`,
              color: '#5E409D', // Media color
              description: `AI Generated concept for ${editBuffer.label}. Prompt: ${brainstormPrompt}`
          };
          onAdd(newMedia);
      }
      setShowBrainstormDialog(false);
      setGeneratedResult(null);
      setBrainstormPrompt('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim() && editBuffer) {
          e.preventDefault();
          const newTags = [...(editBuffer.tags || [])];
          if (!newTags.includes(tagInput.trim())) {
              newTags.push(tagInput.trim());
              handleBufferChange('tags', newTags);
          }
          setTagInput('');
      }
  };

  const removeTag = (tag: string) => {
      if (!editBuffer) return;
      handleBufferChange('tags', (editBuffer.tags || []).filter(t => t !== tag));
  };

  const filteredResources = useMemo(() => {
      return resources.filter(r => {
          const matchesSearch = (r.label || r.value).toLowerCase().includes(searchQuery.toLowerCase());
          const matchesFilter = activeFilter === 'all' || r.type === activeFilter;
          return matchesSearch && matchesFilter;
      });
  }, [resources, searchQuery, activeFilter]);

  // D3 Graph Logic
  useEffect(() => {
      if (activeTab !== 'graph' || !svgRef.current) return;

      const width = 800;
      const height = 600;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const g = svg.append("g");

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on("zoom", (event) => {
              g.attr("transform", event.transform);
          });
      svg.call(zoom);

      const nodes = resources.map(r => ({
          id: r.id,
          ...r,
          x: width/2 + (Math.random() - 0.5) * 50,
          y: height/2 + (Math.random() - 0.5) * 50
      }));

      const links: any[] = [];
      resources.forEach(source => {
          if (!source.description) return;
          const matches = source.description.matchAll(/data-id="([^"]+)"/g);
          for (const match of matches) {
              const targetId = match[1];
              if (resources.find(r => r.id === targetId) && source.id !== targetId) {
                  links.push({ source: source.id, target: targetId });
              }
          }
      });

      const simulation = d3.forceSimulation(nodes as any)
          .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
          .force("charge", d3.forceManyBody().strength(-400))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(40));

      const link = g.append("g")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-opacity", 0.6)
          .selectAll("line")
          .data(links)
          .join("line")
          .attr("stroke-width", 1.5)
          .attr("marker-end", "url(#arrowhead)");

      svg.append("defs").append("marker")
          .attr("id", "arrowhead")
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 28)
          .attr("refY", 0)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          .attr("fill", "#9ca3af");

      const node = g.append("g")
          .selectAll("g")
          .data(nodes)
          .join("g")
          .call(d3.drag<any, any>()
              .on("start", (event, d) => {
                  if (!event.active) simulation.alphaTarget(0.3).restart();
                  d.fx = d.x;
                  d.fy = d.y;
              })
              .on("drag", (event, d) => {
                  d.fx = event.x;
                  d.fy = event.y;
              })
              .on("end", (event, d) => {
                  if (!event.active) simulation.alphaTarget(0);
                  d.fx = null;
                  d.fy = null;
              }));

      node.append("circle")
          .attr("r", 20)
          .attr("fill", (d: any) => d.color || '#ccc')
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("cursor", "pointer")
          .on("click", (e, d: any) => {
              setSelectedId(d.id);
              setActiveTab('editor');
          });

      node.append("foreignObject")
          .attr("x", -8)
          .attr("y", -8)
          .attr("width", 16)
          .attr("height", 16)
          .style("pointer-events", "none")
          .html((d: any) => `<div class="text-white w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">${d.icon}</div>`);

      node.append("text")
          .text((d: any) => d.label || d.value)
          .attr("x", 0)
          .attr("y", 32)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("font-family", "sans-serif")
          .style("fill", "#6b7280")
          .style("pointer-events", "none")
          .each(function(d: any) {
              const bbox = this.getBBox();
              d3.select(this.parentNode as any).insert("rect", "text")
                  .attr("x", bbox.x - 4)
                  .attr("y", bbox.y - 2)
                  .attr("width", bbox.width + 8)
                  .attr("height", bbox.height + 4)
                  .attr("rx", 4)
                  .style("fill", "rgba(255,255,255,0.8)");
          });

      simulation.on("tick", () => {
          link
              .attr("x1", (d: any) => d.source.x)
              .attr("y1", (d: any) => d.source.y)
              .attr("x2", (d: any) => d.target.x)
              .attr("y2", (d: any) => d.target.y);

          node
              .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

  }, [activeTab, resources]);

  const handleCreateNew = (type: ResourceType = 'note') => {
      const newId = `res-${Date.now()}`;
      const config = getConfig(type);
      const newRes: Resource = {
          id: newId,
          type: type,
          value: type === 'media' || type === 'web' ? 'https://' : '',
          label: 'Untitled ' + config.label,
          color: config.defaultColor,
          icon: config.defaultIcon,
          description: '',
          tags: []
      };
      onAdd(newRes);
      setSelectedId(newId);
      setActiveTab('editor');
      setShowAddMenu(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 md:p-8 resource-manager-container">
      
      {/* Brainstorm Modal */}
      {showBrainstormDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm brainstorm-modal">
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-500" /> AI Brainstorm
                    </h3>
                    <button onClick={() => setShowBrainstormDialog(false)} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
                </div>
                
                <div className="p-5">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setBrainstormType('text')}
                            className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${brainstormType === 'text' ? 'bg-white dark:bg-stone-700 shadow text-stone-900 dark:text-stone-100' : 'text-stone-500'}`}
                        >
                            <Type size={14} /> Text Profile
                        </button>
                        <button 
                            onClick={() => setBrainstormType('image')}
                            className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${brainstormType === 'image' ? 'bg-white dark:bg-stone-700 shadow text-stone-900 dark:text-stone-100' : 'text-stone-500'}`}
                        >
                            <ImageIcon size={14} /> Visual Concept
                        </button>
                    </div>

                    <label className="block text-[10px] font-bold uppercase text-stone-400 mb-2">
                        Director's Instructions
                    </label>
                    <textarea 
                        value={brainstormPrompt}
                        onChange={(e) => setBrainstormPrompt(e.target.value)}
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-lg text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder={brainstormType === 'text' ? "E.g., Make them a retired spy with a dark secret..." : "E.g., Cyberpunk aesthetic, moody lighting, neon rain..."}
                    />

                    {/* Result Preview */}
                    {generatedResult && (
                        <div className="mt-4 border rounded-lg overflow-hidden border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950">
                            {brainstormType === 'text' ? (
                                <div className="p-3 text-xs font-mono max-h-40 overflow-y-auto" dangerouslySetInnerHTML={{__html: generatedResult}} />
                            ) : (
                                <img src={generatedResult} alt="Generated" className="w-full h-48 object-cover" />
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2 bg-stone-50 dark:bg-stone-900/50">
                    {!generatedResult ? (
                         <button 
                            onClick={handleExecuteBrainstorm}
                            disabled={isBrainstorming}
                            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                         >
                             {isBrainstorming ? <><Sparkles className="animate-spin" size={14}/> Thinking...</> : 'Generate'}
                         </button>
                    ) : (
                        <>
                             <button 
                                onClick={() => setGeneratedResult(null)}
                                className="px-4 py-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg font-bold text-sm transition-colors"
                             >
                                 Discard
                             </button>
                             <button 
                                onClick={handleAcceptBrainstorm}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-purple-700 transition-all"
                             >
                                 {brainstormType === 'text' ? 'Append to Notes' : 'Save to Gallery'}
                             </button>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      <div ref={modalRef} className="w-full max-w-7xl h-[90vh] bg-white dark:bg-stone-950 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex overflow-hidden">
        
        {/* --- LEFT PANE: NAVIGATION --- */}
        <div className="w-1/4 min-w-[280px] max-w-[320px] bg-stone-50/50 dark:bg-stone-900/30 border-r border-stone-200 dark:border-stone-800 flex flex-col">
            
            {/* Sidebar Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col gap-4">


                <div className="flex p-1 bg-stone-200/50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-800">
                    <button 
                        onClick={() => setActiveTab('editor')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}`}
                    >
                        <Edit3 size={14} /> Wiki
                    </button>
                    <button 
                        onClick={() => setActiveTab('graph')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'graph' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'}`}
                    >
                        <Network size={14} /> Graph
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-stone-500/20 outline-none transition-all placeholder:text-stone-400"
                            placeholder="Search entries..."
                        />
                    </div>
                    
                    {/* Add Button with Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className="h-full px-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                        >
                            <Plus size={16} />
                        </button>
                        {showAddMenu && (
                            <div className="add-menu-popover absolute top-full right-0 mt-2 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-3 py-2 text-[9px] font-bold uppercase text-stone-400">Create New</div>
                                {(Object.keys(TYPE_CONFIG) as ResourceType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleCreateNew(t)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 transition-colors"
                                    >
                                        <span className="text-stone-400">{TYPE_CONFIG[t].icon}</span>
                                        {TYPE_CONFIG[t].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Tabs - Icon Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                    <button 
                        onClick={() => setActiveFilter('all')}
                        className={`shrink-0 pl-2 pr-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center gap-1.5 ${activeFilter === 'all' ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}
                    >
                        <LayoutGrid size={12} /> All
                    </button>
                    {(Object.keys(TYPE_CONFIG) as ResourceType[]).map(t => (
                         <button 
                            key={t}
                            onClick={() => setActiveFilter(t)}
                            className={`shrink-0 pl-2 pr-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center gap-1.5 ${activeFilter === t ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900' : 'bg-white dark:bg-stone-900 text-stone-500 border-stone-200 dark:border-stone-700 hover:border-stone-300'}`}
                        >
                            {TYPE_CONFIG[t].icon}
                            {TYPE_CONFIG[t].label}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredResources.map(res => (
                    <button
                        key={res.id}
                        onClick={() => { setSelectedId(res.id); setActiveTab('editor'); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all group relative flex items-center gap-3 ${
                            selectedId === res.id 
                            ? 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 shadow-sm' 
                            : 'bg-transparent border-transparent hover:bg-stone-100 dark:hover:bg-stone-900'
                        }`}
                    >
                        <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-white shadow-sm text-xs transition-transform group-hover:scale-105" style={{ backgroundColor: res.color || '#ccc' }}>
                                <div dangerouslySetInnerHTML={{ __html: res.icon || '' }} className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs font-bold truncate mb-0.5 ${selectedId === res.id ? 'text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                                {res.label || res.value}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">{res.type}</span>
                                {res.tags && res.tags.length > 0 && (
                                    <span className="text-[9px] text-stone-400 px-1 rounded bg-stone-100 dark:bg-stone-800 truncate max-w-[80px]">
                                        #{res.tags[0]} {res.tags.length > 1 && `+${res.tags.length - 1}`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <ChevronRight size={14} className={`text-stone-300 transition-transform ${selectedId === res.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50'}`} />
                    </button>
                ))}
                
                {filteredResources.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <div className="inline-block p-3 rounded-full bg-stone-100 dark:bg-stone-900 mb-2">
                            <Search size={20} className="text-stone-400" />
                        </div>
                        <div className="text-xs font-bold text-stone-500">No entries found</div>
                    </div>
                )}
            </div>
        </div>

        {/* --- RIGHT PANE: CONTENT --- */}
        <div className="flex-1 bg-white dark:bg-stone-950 flex flex-col relative overflow-hidden">
            
            {/* GRAPH MODE */}
            {activeTab === 'graph' && (
                <div className="flex-1 relative bg-stone-50 dark:bg-stone-950/50">
                    <div className="absolute top-4 right-4 z-10">
                        <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-full shadow-sm border border-stone-200 dark:border-stone-800 transition-all">
                            <X size={18} className="text-stone-500" />
                        </button>
                    </div>
                    <svg ref={svgRef} className="w-full h-full" style={{ cursor: 'grab' }}></svg>
                    <div className="absolute bottom-4 right-4 bg-white dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm max-w-xs pointer-events-none">
                        <h4 className="text-[10px] font-bold uppercase text-stone-400 mb-1">Network Graph</h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400">Visualizes connections based on mentions in wiki descriptions.</p>
                    </div>
                </div>
            )}

            {/* EDITOR MODE */}
            {activeTab === 'editor' && (editBuffer ? (
                <>
                    {/* Content Header */}
                    <div className="border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950 p-8 shrink-0 relative z-10">
                        
                        {/* Actions Top Right */}
                        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
                            <button 
                                onClick={() => setShowBrainstormDialog(true)}
                                className="h-8 px-3 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-2"
                                title="Auto-generate profile with AI"
                            >
                                <Sparkles size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Brainstorm</span>
                            </button>
                            
                            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800"></div>

                            <button 
                                onClick={() => {
                                    if(window.confirm("Delete this entry?")) {
                                        onDelete(editBuffer.id);
                                        setSelectedId(null);
                                    }
                                }}
                                className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Entry"
                            >
                                <Trash2 size={16} />
                            </button>

                            <button 
                                onClick={onClose} 
                                className="h-8 w-8 flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                                title="Close Wiki"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex gap-6 pt-2">
                            {/* Large Icon */}
                            <div className="shrink-0 relative group/icon">
                                <button 
                                    onClick={() => setShowAppearance(!showAppearance)}
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-sm border border-stone-100 dark:border-stone-800 hover:ring-4 hover:ring-stone-100 dark:hover:ring-stone-800 transition-all cursor-pointer overflow-hidden"
                                    style={{ backgroundColor: editBuffer.color }}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: editBuffer.icon || '' }} className="w-10 h-10 [&>svg]:w-full [&>svg]:h-full" />
                                </button>
                                {showAppearance && (
                                    <div className="color-picker-popover absolute top-full left-0 mt-3 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="text-[10px] font-bold uppercase text-stone-400 mb-2">Theme Color</div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {COLORS.map(c => (
                                                <button 
                                                    key={c}
                                                    onClick={() => handleBufferChange('color', c)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${editBuffer.color === c ? 'border-stone-900 dark:border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase text-stone-400 mb-2">Iconography</div>
                                        <div className="flex flex-wrap gap-2">
                                            {ICON_PRESETS.map(p => (
                                                <button
                                                    key={p.name}
                                                    onClick={() => handleBufferChange('icon', p.svg)}
                                                    className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                                                >
                                                    <div dangerouslySetInnerHTML={{ __html: p.svg }} className="w-4 h-4" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main Details */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                
                                {/* Meta Row */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-800">
                                        {getConfig(editBuffer.type).icon} <span>{getConfig(editBuffer.type).label}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {editBuffer.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] text-stone-500 dark:text-stone-400 bg-transparent px-1.5 py-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1 group/tag">
                                                #{tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-500 hidden group-hover/tag:block"><X size={8} /></button>
                                            </span>
                                        ))}
                                        <div className="relative group/addtag">
                                            <input 
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                placeholder="Add tag..."
                                                className="bg-transparent border-none p-0 text-[10px] w-16 focus:w-24 transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:ring-0 text-stone-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <input 
                                    className="block w-full text-4xl font-black text-stone-900 dark:text-stone-100 bg-transparent border-none p-0 focus:ring-0 placeholder:text-stone-300 dark:placeholder:text-stone-700 leading-tight mb-4"
                                    value={editBuffer.label || ''}
                                    onChange={(e) => handleBufferChange('label', e.target.value)}
                                    placeholder="Untitled"
                                />

                                {/* Value Field */}
                                {(editBuffer.type === 'web' || editBuffer.type === 'media' || (editBuffer.value && editBuffer.value.startsWith('http'))) ? (
                                     <div className="flex items-center gap-3 p-2.5 bg-stone-50 dark:bg-stone-900/40 rounded-lg border border-stone-200 dark:border-stone-800 max-w-2xl group/url focus-within:border-stone-300 dark:focus-within:border-stone-700 transition-colors">
                                        <Globe size={14} className="text-stone-400 shrink-0 ml-1" />
                                        <input 
                                            className="flex-1 bg-transparent border-none p-0 text-xs font-mono text-blue-600 dark:text-blue-400 focus:ring-0 truncate"
                                            value={editBuffer.value}
                                            onChange={(e) => handleBufferChange('value', e.target.value)}
                                            placeholder="https://..."
                                        />
                                        <a 
                                            href={editBuffer.value} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[10px] font-bold uppercase text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 px-2"
                                        >
                                            Open
                                        </a>
                                     </div>
                                ) : (
                                     editBuffer.type !== 'note' && (
                                        <input 
                                            className="text-lg font-medium text-stone-500 dark:text-stone-400 bg-transparent border-none p-0 w-full focus:ring-0 placeholder:text-stone-300" 
                                            value={editBuffer.value} 
                                            onChange={(e) => handleBufferChange('value', e.target.value)}
                                            placeholder="Subtitle / Role / Detail..."
                                        />
                                     )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editor Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-stone-950">
                         <div className="max-w-3xl mx-auto p-8">
                              <div className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700 select-none">
                                  <FileText size={12} /> Wiki Content
                              </div>
                              
                              <RichTextCell 
                                   html={editBuffer.description || ''}
                                   onChange={(html) => handleBufferChange('description', html)}
                                   placeholder={`Describe ${editBuffer.label || 'this entry'}... Use @ to link other pages.`}
                                   resources={resources}
                                   onResourceClick={handleInternalLinkClick}
                                   className="font-mono text-sm leading-loose text-stone-600 dark:text-stone-300 min-h-[300px] focus:outline-none"
                              />
                         </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="h-8 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between px-4 text-[10px] text-stone-400 shrink-0">
                        <div className="font-mono opacity-50">{editBuffer.id}</div>
                        <div className="flex items-center gap-1"><Save size={10} /> Auto-saved</div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-300 dark:text-stone-700 opacity-50 pointer-events-none select-none relative">
                     <div className="absolute top-6 right-6 z-10 pointer-events-auto">
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full shadow-sm border border-stone-200 dark:border-stone-800 transition-all">
                            <X size={18} className="text-stone-500" />
                        </button>
                    </div>
                    <div className="w-24 h-24 rounded-3xl bg-stone-100 dark:bg-stone-900 mb-6 flex items-center justify-center transform rotate-12">
                        <FileText size={40} />
                    </div>
                    <p className="text-xl font-bold tracking-tight">Select an entry</p>
                    <p className="text-sm mt-2">or create a new page to start building your world.</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
    