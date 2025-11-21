
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Script } from '../types';
import { 
  Clock, 
  GitCommit, 
  Share2,
  Workflow,
  Maximize2,
  ChevronRight,
  Check
} from 'lucide-react';

export type StoryClockMode = 'full' | 'glyph' | 'icon';

interface StoryClockProps {
  script: Script;
  mode?: StoryClockMode;
  onSceneClick?: (sceneId: string) => void;
  onClockClick?: () => void; 
  darkMode?: boolean;
  highlightedNodeId?: string | null;
}

interface TimelineNode {
    id: string;
    type: 'act' | 'scene' | 'beat';
    title: string;
    description?: string;
    start: number;
    end: number;
    duration: number;
    depth: number; // 0=Act, 1=Scene, 2=Beat
    children?: TimelineNode[];
    resourceIds: string[]; // Resources used in this node
    actIndex?: number; // for coloring
}

interface ResourceThread {
    resourceId: string;
    points: number[]; // Angles (radians) where this resource appears
    color: string;
}

interface StructurePoint {
    l: string; // label
    p: number; // percent (0-1)
    color?: string;
}

const STRUCTURE_TEMPLATES: Record<string, { label: string, points: StructurePoint[] }> = {
  'three-act': {
    label: 'Standard (3 Act)',
    points: [
      { l: "Inciting Incident", p: 0.12, color: '#AF3029' },
      { l: "Plot Pt 1", p: 0.25, color: '#BC5215' },
      { l: "Midpoint", p: 0.50, color: '#AD8301' },
      { l: "Plot Pt 2", p: 0.75, color: '#BC5215' },
      { l: "Climax", p: 0.90, color: '#AF3029' },
    ]
  },
  'save-cat': {
    label: "Save the Cat",
    points: [
      { l: "Catalyst", p: 0.10, color: '#BC5215' },
      { l: "Break into 2", p: 0.20, color: '#AD8301' },
      { l: "Midpoint", p: 0.50, color: '#66800B' },
      { l: "All is Lost", p: 0.75, color: '#282726' },
      { l: "Break into 3", p: 0.85, color: '#AD8301' },
    ]
  },
  'heros-journey': {
    label: "Hero's Journey",
    points: [
      { l: "Call to Adventure", p: 0.12, color: '#205EA6' },
      { l: "Threshold", p: 0.25, color: '#24837B' },
      { l: "Ordeal", p: 0.50, color: '#AF3029' },
      { l: "Road Back", p: 0.75, color: '#5E409D' },
      { l: "Resurrection", p: 0.90, color: '#A02F6F' },
    ]
  },
  'harmon': {
    label: "Harmon Circle",
    points: [
      { l: "You", p: 0.00, color: '#205EA6' },
      { l: "Need", p: 0.125, color: '#24837B' },
      { l: "Go", p: 0.25, color: '#66800B' },
      { l: "Search", p: 0.375, color: '#AD8301' },
      { l: "Find", p: 0.50, color: '#BC5215' },
      { l: "Take", p: 0.625, color: '#AF3029' },
      { l: "Return", p: 0.75, color: '#A02F6F' },
      { l: "Change", p: 0.875, color: '#5E409D' },
    ]
  },
  'none': {
      label: 'None',
      points: []
  }
};

// DISTINCT PALETTE FOR GLYPH ACTS
const GLYPH_ACT_COLORS = [
  "#AF3029", // Red
  "#BC5215", // Orange
  "#AD8301", // Yellow
  "#66800B", // Green
  "#205EA6", // Blue
  "#5E409D", // Purple
];

export const StoryClock: React.FC<StoryClockProps> = ({ 
    script, 
    mode = 'full', 
    onSceneClick, 
    onClockClick,
    darkMode = false, 
    highlightedNodeId 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [activeStructureKey, setActiveStructureKey] = useState<string>('three-act');
  const [showThreads, setShowThreads] = useState(true); 
  const [showTicks, setShowTicks] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<TimelineNode | null>(null);
  const [hoveredResource, setHoveredResource] = useState<string | null>(null);

  // 1. Process Data
  const { nodes, totalDuration, threads } = useMemo(() => {
      if (!script || !script.content || !Array.isArray(script.content)) {
          return { nodes: [], totalDuration: 60, threads: [] };
      }

      let t = 0;
      const allNodes: TimelineNode[] = [];
      const beatNodes: TimelineNode[] = [];

      const processNode = (scriptNode: any, depth: number, actIdx: number): TimelineNode => {
          const start = t;
          let kids: TimelineNode[] = [];
          
          const foundResources: string[] = [];
          if (depth === 2 && scriptNode.content) {
             const html = (scriptNode.content.audio || '') + (scriptNode.content.visual || '');
             const matches = html.matchAll(/data-id="([^"]+)"/g);
             for (const m of matches) {
                 if (!foundResources.includes(m[1])) foundResources.push(m[1]);
             }
          }

          if (scriptNode.children) {
              scriptNode.children.forEach((child: any) => {
                  kids.push(processNode(child, depth + 1, actIdx));
              });
          } else {
              const dur = scriptNode.duration || 15;
              t += dur;
          }

          const end = t;
          const duration = end - start;
          
          const node: TimelineNode = {
              id: scriptNode.id,
              type: depth === 0 ? 'act' : depth === 1 ? 'scene' : 'beat',
              title: scriptNode.title || (depth === 2 ? 'Beat' : 'Untitled'),
              description: scriptNode.description,
              start,
              end,
              duration,
              depth,
              children: kids,
              resourceIds: foundResources,
              actIndex: actIdx
          };
          
          allNodes.push(node);
          if (depth === 2) beatNodes.push(node);
          
          return node;
      };

      script.content.forEach((act, idx) => processNode(act, 0, idx));
      
      const resourceMap = new Map<string, number[]>();
      beatNodes.forEach(beat => {
          if (beat.resourceIds.length === 0) return;
          const midTime = (beat.start + beat.end) / 2;
          beat.resourceIds.forEach(rid => {
              if (!resourceMap.has(rid)) resourceMap.set(rid, []);
              const existing = resourceMap.get(rid)!;
              // Only add point if distinct enough to avoid clumping
              if (existing.length === 0 || Math.abs(existing[existing.length - 1] - midTime) > 5) {
                  existing.push(midTime);
              }
          });
      });

      const generatedThreads: ResourceThread[] = [];
      // Flexoki Palette
      const colors = [
        "#AF3029", // Red
        "#BC5215", // Orange
        "#AD8301", // Yellow
        "#66800B", // Green
        "#24837B", // Cyan
        "#205EA6", // Blue
        "#5E409D", // Purple
        "#A02F6F"  // Magenta
      ];
      
      let cIdx = 0;
      resourceMap.forEach((times, rid) => {
          // Only generate thread if resource appears multiple times
          if (times.length > 1) {
              generatedThreads.push({
                  resourceId: rid,
                  points: times,
                  color: colors[cIdx % colors.length]
              });
              cIdx++;
          }
      });

      return { nodes: allNodes, totalDuration: Math.max(t, 60), threads: generatedThreads };
  }, [script]);

  // 2. D3 Rendering
  useEffect(() => {
    if (!svgRef.current) return;
    if (nodes.length === 0) return;

    const size = mode === 'full' ? 800 : 400; // Use 400 for glyph to keep coordinate math high-res
    const margin = mode === 'full' ? 80 : 0; // No margin for glyph to maximize visual space
    const radius = size / 2 - margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Defs for gradients
    const defs = svg.append("defs");
    
    // Radial Glow for center
    const radialGradient = defs.append("radialGradient")
        .attr("id", "centerGlow")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "50%");
    radialGradient.append("stop").attr("offset", "0%").attr("stop-color", darkMode ? "#282726" : "#fff").attr("stop-opacity", 0.5);
    radialGradient.append("stop").attr("offset", "100%").attr("stop-color", darkMode ? "#100F0F" : "#F2F0E5").attr("stop-opacity", 0);

    const g = svg
      .attr("viewBox", `0 0 ${size} ${size}`)
      .append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    const angleScale = d3.scaleLinear()
      .domain([0, totalDuration])
      .range([0, 2 * Math.PI]);

    // --- CONFIG ---
    // Chunkier rings for glyph mode
    const rActs = mode === 'glyph' 
        ? { inner: radius * 0.75, outer: radius } 
        : { inner: radius * 0.9, outer: radius * 0.98 };
        
    const rScenes = { inner: radius * 0.82, outer: radius * 0.89 };
    const rBeats = { inner: radius * 0.78, outer: radius * 0.81 };
    
    const rThreadInner = mode === 'glyph' ? radius * 0.65 : radius * 0.70;

    // --- BACKGROUND ---
    if (mode === 'full') {
        g.append("circle")
            .attr("r", radius + 20)
            .attr("fill", darkMode ? "#100F0F" : "#fff")
            .attr("opacity", 0.5);
    } else if (mode === 'glyph') {
        // Solid background circle for Glyph to handle contrast
        g.append("circle")
            .attr("r", radius)
            .attr("fill", darkMode ? "#1c1917" : "#f5f5f4")
            .attr("stroke", darkMode ? "#292524" : "#e7e5e4")
            .attr("stroke-width", 2);
    }

    // --- THREADS (BUNDLED CURVES) ---
    if (showThreads && (mode === 'full' || mode === 'glyph')) {
        const threadGroup = g.append("g").attr("class", "threads");
        
        threads.forEach(thread => {
            const isDimmed = hoveredResource && hoveredResource !== thread.resourceId;
            const isHighlighted = hoveredResource === thread.resourceId;
            
            // Refined Curve Logic: Quadratic Bezier connecting points on the inner ring
            for (let i = 0; i < thread.points.length - 1; i++) {
                 const t1 = thread.points[i];
                 const t2 = thread.points[i+1];
                 
                 // Skip if points are too close
                 if (Math.abs(t2 - t1) < totalDuration * 0.01) continue;
                 
                 const a1 = angleScale(t1);
                 const a2 = angleScale(t2);
                 
                 const x1 = Math.sin(a1) * rThreadInner;
                 const y1 = -Math.cos(a1) * rThreadInner;
                 const x2 = Math.sin(a2) * rThreadInner;
                 const y2 = -Math.cos(a2) * rThreadInner;
                 
                 // Calculate Control Point
                 const dist = Math.abs(a1 - a2);
                 let angleDiff = Math.abs(a1 - a2);
                 if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                 const pullFactor = Math.min(0.8, angleDiff / Math.PI); // 0.0 to 0.8
                 const rControl = rThreadInner * (1 - pullFactor);
                 
                 let midAngle = (a1 + a2) / 2;
                 if (Math.abs(a1 - a2) > Math.PI) midAngle += Math.PI;

                 const cpx = Math.sin(midAngle) * rControl;
                 const cpy = -Math.cos(midAngle) * rControl;

                 threadGroup.append("path")
                    .attr("d", `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`)
                    .attr("fill", "none")
                    .attr("stroke", thread.color)
                    // Thicker strokes for Glyph mode to make it pop
                    .attr("stroke-width", mode === 'glyph' ? 3 : (isHighlighted ? 2.5 : 1.2))
                    // Higher opacity for Glyph mode
                    .attr("stroke-opacity", mode === 'glyph' ? 0.5 : (isHighlighted ? 0.9 : (isDimmed ? 0.05 : 0.3)))
                    .style("mix-blend-mode", darkMode ? "screen" : "multiply")
                    .style("pointer-events", "none");
            }
        });
    }

    // --- BEAT TRACK (TICKS) ---
    const beats = nodes.filter(n => n.type === 'beat');
    if (mode === 'full') {
         g.selectAll(".beat-tick")
            .data(beats)
            .enter()
            .append("line")
            .attr("x1", d => Math.sin(angleScale(d.start)) * rBeats.inner)
            .attr("y1", d => -Math.cos(angleScale(d.start)) * rBeats.inner)
            .attr("x2", d => Math.sin(angleScale(d.start)) * rBeats.outer)
            .attr("y2", d => -Math.cos(angleScale(d.start)) * rBeats.outer)
            .attr("stroke", d => {
                if (d.resourceIds.length > 0) {
                     const t = threads.find(th => d.resourceIds.includes(th.resourceId));
                     return t ? t.color : (darkMode ? "#575653" : "#DAD8CE");
                }
                return darkMode ? "#282726" : "#E6E4D9";
            })
            .attr("stroke-width", d => d.resourceIds.length > 0 ? 2 : 1)
            .attr("opacity", d => d.resourceIds.length > 0 ? 1 : 0.5)
            .on("mouseover", (e, d) => {
                setHoveredNode(d);
                if (d.resourceIds.length > 0) setHoveredResource(d.resourceIds[0]);
            })
            .on("mouseout", () => {
                 setHoveredNode(null);
                 setHoveredResource(null);
            });
    }

    // --- SCENES (ARCS) ---
    const scenes = nodes.filter(n => n.type === 'scene');
    const sceneArc = d3.arc<TimelineNode>()
        .innerRadius(rScenes.inner)
        .outerRadius(rScenes.outer)
        .startAngle(d => angleScale(d.start))
        .endAngle(d => angleScale(d.end))
        .padAngle(0.005)
        .cornerRadius(2);

    if (mode === 'full') {
        g.selectAll(".scene-arc")
            .data(scenes)
            .enter()
            .append("path")
            .attr("d", sceneArc)
            .attr("fill", (d, i) => {
                if (highlightedNodeId === d.id) return "#AD8301";
                if (hoveredNode?.id === d.id) return "#AD8301";
                
                const baseLight = i % 2 === 0 ? "#F2F0E5" : "#E6E4D9";
                const baseDark = i % 2 === 0 ? "#282726" : "#403E3C";
                return darkMode ? baseDark : baseLight;
            })
            .attr("opacity", (d) => {
                if (hoveredNode && hoveredNode.id !== d.id) return 0.3;
                return 1;
            })
            .style("cursor", "pointer")
            .on("mouseover", (e, d) => setHoveredNode(d))
            .on("mouseout", () => setHoveredNode(null))
            .on("click", (e, d) => onSceneClick && onSceneClick(d.id));
    }

    // --- ACTS (OUTER RING) ---
    const acts = nodes.filter(n => n.type === 'act');
    const actArc = d3.arc<TimelineNode>()
        .innerRadius(rActs.inner)
        .outerRadius(rActs.outer)
        .startAngle(d => angleScale(d.start))
        .endAngle(d => angleScale(d.end))
        // Larger gap in glyph mode for style
        .padAngle(mode === 'glyph' ? 0.08 : 0.01) 
        .cornerRadius(mode === 'glyph' ? 8 : 4);

    g.selectAll(".act-arc")
        .data(acts)
        .enter()
        .append("path")
        .attr("d", actArc)
        .attr("fill", (d) => {
            if (mode === 'glyph') {
                // Use vivid colors for Glyph mode
                return GLYPH_ACT_COLORS[(d.actIndex || 0) % GLYPH_ACT_COLORS.length];
            }
            const colors = darkMode 
                ? ["#575653", "#6F6E69", "#575653", "#6F6E69"] 
                : ["#CECDC3", "#DAD8CE", "#CECDC3", "#DAD8CE"];
            return colors[(d.actIndex || 0) % colors.length];
        })
        .attr("opacity", (d) => {
             if (mode === 'full' && hoveredNode && hoveredNode.actIndex !== d.actIndex) return 0.3;
             return 0.9;
        })
        .on("mouseover", (e, d) => mode === 'full' && setHoveredNode(d))
        .on("mouseout", () => mode === 'full' && setHoveredNode(null));

    // --- OVERLAYS (FULL MODE) ---
    if (mode === 'full') {
        
        // Time Ticks (Minutes)
        if (showTicks) {
            const tickGroup = g.append("g").style("pointer-events", "none");
            const totalMinutes = Math.ceil(totalDuration / 60);
            const step = Math.max(1, Math.floor(totalMinutes / 60)); 

            for (let m = 0; m < totalMinutes; m += step) {
                const seconds = m * 60;
                const angle = angleScale(seconds);
                const isHour = m % 10 === 0;
                
                const r1 = radius + 5;
                const r2 = radius + (isHour ? 12 : 8);
                
                tickGroup.append("line")
                    .attr("x1", Math.sin(angle) * r1)
                    .attr("y1", -Math.cos(angle) * r1)
                    .attr("x2", Math.sin(angle) * r2)
                    .attr("y2", -Math.cos(angle) * r2)
                    .attr("stroke", darkMode ? "#575653" : "#DAD8CE")
                    .attr("stroke-width", isHour ? 2 : 1);
                
                if (isHour) {
                     tickGroup.append("text")
                        .attr("x", Math.sin(angle) * (r2 + 10))
                        .attr("y", -Math.cos(angle) * (r2 + 10))
                        .text(m)
                        .attr("text-anchor", "middle")
                        .attr("dominant-baseline", "middle")
                        .style("font-family", "JetBrains Mono")
                        .style("font-size", "10px")
                        .style("fill", darkMode ? "#6F6E69" : "#B7B5AC");
                }
            }
        }

        // Act Labels
        g.selectAll(".act-label")
            .data(acts)
            .enter()
            .append("text")
            .attr("transform", d => {
                const angle = (angleScale(d.start) + angleScale(d.end)) / 2;
                const r = rActs.outer + 15;
                // Flip text if bottom half
                const rotate = (angle * 180 / Math.PI);
                const flip = angle > Math.PI / 2 && angle < 3 * Math.PI / 2;
                return `translate(${Math.sin(angle)*r},${-Math.cos(angle)*r}) rotate(${flip ? rotate - 180 : rotate})`;
            })
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .text(d => d.title.replace(/^Act \w+:?\s*/i, '').substring(0, 20))
            .style("font-size", "9px")
            .style("font-weight", "bold")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.05em")
            .style("fill", darkMode ? "#CECDC3" : "#575653")
            .style("pointer-events", "none")
            .style("opacity", d => d.duration > totalDuration * 0.1 ? 1 : 0);

        // --- STRUCTURE POINTS ---
        const activeStructure = STRUCTURE_TEMPLATES[activeStructureKey];
        if (activeStructure && activeStructure.points.length > 0) {
            const sGroup = g.append("g").style("pointer-events", "none");
            
            activeStructure.points.forEach(pt => {
                const angle = angleScale(totalDuration * pt.p);
                // Dashed line
                sGroup.append("line")
                    .attr("x1", 0).attr("y1", 0)
                    .attr("x2", Math.sin(angle) * radius)
                    .attr("y2", -Math.cos(angle) * radius)
                    .attr("stroke", pt.color || "#AF3029")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "3,4")
                    .style("opacity", 0.3);
                
                // Label
                const labelR = rThreadInner - 15;
                const labelX = Math.sin(angle) * labelR;
                const labelY = -Math.cos(angle) * labelR;

                sGroup.append("text")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .text(pt.l)
                    .attr("text-anchor", angle > Math.PI ? "end" : "start")
                    .style("fill", pt.color || "#AF3029")
                    .style("font-size", "9px")
                    .style("font-weight", "bold")
                    .style("opacity", 0.7)
                    .attr("transform", `rotate(${-15}, ${labelX}, ${labelY})`); 
            });
        }
    }

    // --- CENTER INFO ---
    const center = g.append("g").attr("class", "center-info");
    
    if (mode === 'full') {
        if (hoveredNode) {
            center.append("text")
                .text(hoveredNode.type.toUpperCase())
                .attr("y", -12)
                .attr("text-anchor", "middle")
                .style("fill", "#BC5215")
                .style("font-size", "9px")
                .style("font-weight", "bold")
                .style("letter-spacing", "0.1em");
                
            center.append("text")
                .text(hoveredNode.title)
                .attr("y", 5)
                .attr("text-anchor", "middle")
                .style("fill", darkMode ? "#CECDC3" : "#100F0F")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .each(function() {
                    const self = d3.select(this);
                    const len = self.node()?.getComputedTextLength() || 0;
                    if (len > 140) self.style("font-size", "10px");
                });
            
            if (hoveredResource) {
                 const rName = script.resources.find(r => r.id === hoveredResource)?.label || "Resource";
                 center.append("text")
                    .text(rName)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .style("fill", "#5E409D")
                    .style("font-size", "10px")
                    .style("font-weight", "bold");
            } else {
                center.append("text")
                    .text(`${Math.round(hoveredNode.duration)}s`)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .style("fill", darkMode ? "#878580" : "#6F6E69")
                    .style("font-family", "JetBrains Mono")
                    .style("font-size", "10px");
            }
        } else {
            // Default Center
            const m = Math.floor(totalDuration / 60);
            const s = Math.floor(totalDuration % 60);
            
            center.append("text")
                .text("TOTAL RUNTIME")
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .style("fill", darkMode ? "#575653" : "#B7B5AC")
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .style("letter-spacing", "0.1em");

            center.append("text")
                .text(`${m}m ${s}s`)
                .attr("y", 5)
                .attr("text-anchor", "middle")
                .style("fill", darkMode ? "#CECDC3" : "#100F0F")
                .style("font-family", "JetBrains Mono")
                .style("font-size", "20px")
                .style("font-weight", "bold");
                
            center.append("text")
                .text(`${script.content.length} ACTS • ${scenes.length} SCENES`)
                .attr("y", 22)
                .attr("text-anchor", "middle")
                .style("fill", darkMode ? "#878580" : "#6F6E69")
                .style("font-size", "9px")
                .style("font-weight", "medium");
        }
    } else if (mode === 'glyph') {
        center.append("circle")
            .attr("r", radius)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("click", () => onClockClick && onClockClick());
            
        const m = Math.floor(totalDuration / 60);
        
        // BOLD glyph center text
        center.append("text")
            .text(`${m}m`)
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .style("fill", darkMode ? "#fff" : "#000")
            .style("font-family", "JetBrains Mono")
            .style("font-size", "48px")
            .style("font-weight", "800")
            .style("pointer-events", "none");
    }

  }, [nodes, totalDuration, threads, mode, darkMode, activeStructureKey, showThreads, showTicks, hoveredNode, hoveredResource, onSceneClick, highlightedNodeId, onClockClick, script.resources]);


  // --- RENDER JSX ---

  if (mode === 'icon') {
      return (
        <div 
            className="w-full h-full flex items-center justify-center"
            onClick={onClockClick}
        >
            <svg ref={svgRef} className="w-full h-full" style={{overflow: 'visible'}}></svg>
        </div>
      );
  }

  if (mode === 'glyph') {
      return (
          <div className="w-full h-full flex items-center justify-center select-none" title="Story Structure">
             <svg ref={svgRef} className="w-full h-full" style={{overflow: 'hidden'}}></svg>
          </div>
      );
  }
  
  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-paper dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden`}>
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm">
          {/* Structure Toggle & Dropdown */}
          <div className="relative group">
             <button 
                className={`p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center ${activeStructureKey !== 'none' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-stone-400'}`}
                title="Structure Points"
             >
               <GitCommit size={18} />
             </button>
             
             {/* Hover Menu */}
             <div className="absolute left-full top-0 ml-2 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl p-1 hidden group-hover:block animate-in fade-in slide-in-from-left-2 duration-150 z-30">
                 <div className="px-2 py-1.5 text-[9px] font-bold uppercase text-stone-400 tracking-wider border-b border-stone-100 dark:border-stone-800 mb-1">Structure Template</div>
                 {Object.keys(STRUCTURE_TEMPLATES).map(key => (
                     <button 
                        key={key}
                        onClick={() => setActiveStructureKey(key)}
                        className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center justify-between ${activeStructureKey === key ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                     >
                         {STRUCTURE_TEMPLATES[key].label}
                         {activeStructureKey === key && <Check size={12} />}
                     </button>
                 ))}
             </div>
          </div>

          <button 
            onClick={() => setShowThreads(!showThreads)} 
            className={`p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${showThreads ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-stone-400'}`}
            title="Toggle Resource Threads"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => setShowTicks(!showTicks)} 
            className={`p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${showTicks ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}
            title="Toggle Grid"
          >
            <Clock size={18} />
          </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="text-[10px] font-bold uppercase text-stone-400 mb-1 tracking-widest">Layers</div>
         <div className="flex items-center gap-2 text-[10px] font-medium text-stone-500 dark:text-stone-400">
             <div className="w-2 h-2 rounded-full bg-stone-400"></div> Acts
         </div>
         <div className="flex items-center gap-2 text-[10px] font-medium text-stone-500 dark:text-stone-400">
             <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700"></div> Scenes
         </div>
         {showThreads && (
             <div className="flex items-center gap-2 text-[10px] font-medium text-purple-500 mt-1">
                <Workflow size={10} /> Narrative Threads
            </div>
         )}
         {activeStructureKey !== 'none' && (
             <div className="flex items-center gap-2 text-[10px] font-medium text-red-500 mt-1">
                <GitCommit size={10} /> {STRUCTURE_TEMPLATES[activeStructureKey].label}
            </div>
         )}
      </div>

      <svg ref={svgRef} className="w-full h-full max-w-[800px] max-h-[800px]"></svg>
    </div>
  );
};
