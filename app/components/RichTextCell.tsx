
import React, { useState, useRef, useEffect } from 'react';
import { Resource, ResourceType } from '../types';
import { 
    Link as LinkIcon, 
    Image as ImageIcon, 
    Tag, 
    Bold, 
    Italic, 
    Underline, 
    Strikethrough, 
    Code, 
    LayoutGrid, 
    Heading1, 
    Heading2, 
    Heading3, 
    List, 
    ListOrdered, 
    Quote, 
    Minus,
    Pilcrow,
    Sparkles,
    User,
    MapPin,
    Box,
    Film,
    Globe,
    FileText,
    CheckSquare
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface RichTextCellProps {
  html: string;
  onChange: (html: string) => void;
  placeholder?: string;
  resources: Resource[];
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  showImages?: boolean;
  onResourceClick?: (resourceId: string) => void;
}

type ResourceFilterType = 'all' | ResourceType;

interface SlashCommand {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    command?: string;
    value?: string;
    customAction?: () => void;
}

// Helper to generate the HTML string for a chip
const createResourceChipHtml = (resource: Resource): string => {
    const iconSvg = resource.icon || `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
    const colorStyle = resource.color ? `style="--chip-color: ${resource.color}"` : '';
    
    return `<span class="resource-chip" data-id="${resource.id}" data-type="${resource.type}" ${colorStyle} contenteditable="false"><span class="resource-icon">${iconSvg}</span>${resource.label || resource.value}</span>`;
};

// Preview Tooltip Component
const ResourcePreviewTooltip: React.FC<{ 
    resource: Resource | null; 
    position: { top: number; left: number } | null; 
}> = ({ resource, position }) => {
    if (!resource || !position) return null;

    return createPortal(
        <div 
            className="fixed z-[100] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150 max-w-xs pointer-events-none"
            style={{ top: position.top + 10, left: position.left }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: resource.color || '#a855f7' }}>
                   <div dangerouslySetInnerHTML={{ __html: resource.icon || '' }} className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" />
                </div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{resource.label || 'Resource'}</span>
            </div>
            
            {(resource.type === 'media' && (resource.embeddedData || (resource.value && resource.value.startsWith('http')))) && (
                <div className="rounded overflow-hidden mb-2 bg-stone-100 dark:bg-stone-800">
                    {resource.embeddedData && resource.mimeType ? (
                        resource.mimeType.startsWith('image/') ? (
                            <img src={`data:${resource.mimeType};base64,${resource.embeddedData}`} alt="Preview" className="w-full h-32 object-cover" />
                        ) : resource.mimeType.startsWith('video/') ? (
                            <video src={`data:${resource.mimeType};base64,${resource.embeddedData}`} className="w-full h-32 object-cover" muted />
                        ) : null
                    ) : (
                        <img src={resource.value} alt="Preview" className="w-full h-32 object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                    )}
                </div>
            )}
            
            {(resource.value && !resource.value.startsWith('http') && resource.type !== 'note') && (
                 <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 break-all bg-stone-50 dark:bg-stone-950 p-1.5 rounded border border-stone-100 dark:border-stone-800">
                    {resource.value}
                </div>
            )}
        </div>,
        document.body
    );
};

export const RichTextCell: React.FC<RichTextCellProps> = ({ 
  html, 
  onChange, 
  placeholder, 
  resources, 
  className,
  onFocus,
  onBlur,
  onResourceClick
}) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);
  const slashListRef = useRef<HTMLDivElement>(null);
  
  // Mention Menu State (@)
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionTypeFilter, setMentionTypeFilter] = useState<ResourceFilterType>('all');

  // Slash Menu State (/)
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Autolink Suggestion State
  const [suggestedLink, setSuggestedLink] = useState<Resource | null>(null);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  // Formatting Menu State (Selection)
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);
  const [formattingMenuPos, setFormattingMenuPos] = useState({ top: 0, left: 0 });

  // Preview State
  const [hoveredResource, setHoveredResource] = useState<Resource | null>(null);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null);

  const SLASH_COMMANDS: SlashCommand[] = [
    { id: 'todo', label: 'Checklist', description: 'Add a task to be done.', icon: <CheckSquare size={14} />, customAction: () => insertTodo() },
    { id: 'p', label: 'Text', description: 'Just start writing with plain text.', icon: <Pilcrow size={14} />, command: 'formatBlock', value: 'P' },
    { id: 'h1', label: 'Heading 1', description: 'Big section heading.', icon: <Heading1 size={14} />, command: 'formatBlock', value: 'H1' },
    { id: 'h2', label: 'Heading 2', description: 'Medium section heading.', icon: <Heading2 size={14} />, command: 'formatBlock', value: 'H2' },
    { id: 'h3', label: 'Heading 3', description: 'Small section heading.', icon: <Heading3 size={14} />, command: 'formatBlock', value: 'H3' },
    { id: 'ul', label: 'Bullet List', description: 'Create a simple bulleted list.', icon: <List size={14} />, command: 'insertUnorderedList' },
    { id: 'ol', label: 'Numbered List', description: 'Create a list with numbering.', icon: <ListOrdered size={14} />, command: 'insertOrderedList' },
    { id: 'quote', label: 'Quote', description: 'Capture a quote.', icon: <Quote size={14} />, command: 'formatBlock', value: 'BLOCKQUOTE' },
    { id: 'code', label: 'Code', description: 'Capture a code snippet.', icon: <Code size={14} />, command: 'formatBlock', value: 'PRE' },
    { id: 'hr', label: 'Divider', description: 'Visually separate content.', icon: <Minus size={14} />, command: 'insertHorizontalRule' },
  ];

  // Initialize content
  useEffect(() => {
    if (contentEditableRef.current && contentEditableRef.current.innerHTML !== html) {
      contentEditableRef.current.innerHTML = html;
    }
  }, []); 

  useEffect(() => {
     if (document.activeElement !== contentEditableRef.current && contentEditableRef.current && html !== contentEditableRef.current.innerHTML) {
        contentEditableRef.current.innerHTML = html;
     }
  }, [html]);

  // Scroll effects for menus
  useEffect(() => {
    if (showMentionMenu && mentionListRef.current) {
        const selectedEl = mentionListRef.current.children[mentionSelectedIndex] as HTMLElement;
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [mentionSelectedIndex, showMentionMenu]);

  useEffect(() => {
    if (showSlashMenu && slashListRef.current) {
        const selectedEl = slashListRef.current.children[slashSelectedIndex] as HTMLElement;
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [slashSelectedIndex, showSlashMenu]);


  // --- Event Handlers for Chip Interaction & Checkbox ---

  const handleMouseOver = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const chip = target.closest('.resource-chip');
      
      if (chip) {
          const id = chip.getAttribute('data-id');
          const resource = resources.find(r => r.id === id);
          if (resource) {
              const rect = chip.getBoundingClientRect();
              setPreviewPos({ top: rect.bottom, left: rect.left });
              setHoveredResource(resource);
              return;
          }
      }
      // If we are over the editor but NOT a chip, ensure we clear any tooltip
      setHoveredResource(null);
  };

  const handleMouseLeave = () => {
      setHoveredResource(null);
  };

  const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle Resource Click
      const chip = target.closest('.resource-chip');
      if (chip) {
          e.preventDefault(); // Prevent cursor placement if possible inside chip
          e.stopPropagation();
          const id = chip.getAttribute('data-id');
          if (id && onResourceClick) {
              onResourceClick(id);
          }
          return;
      }

      // Handle Checkbox Click
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
          // The native checkbox click will toggle the visual state,
          // BUT contentEditable does not reliably update the attribute in the innerHTML string.
          // We need to manually toggle the 'checked' attribute on the element
          // so it persists when we read innerHTML.
          const input = target as HTMLInputElement;
          
          // We use setAttribute because React's onChange or default behavior
          // might not reflect in the serialized HTML string.
          if (input.checked) {
              input.setAttribute('checked', 'true');
          } else {
              input.removeAttribute('checked');
          }

          // Trigger change immediately
          if (contentEditableRef.current) {
              onChange(contentEditableRef.current.innerHTML);
          }
      }
  };

  // --- Editor Logic ---

  const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setShowFormattingMenu(false);
          return;
      }

      const range = selection.getRangeAt(0);
      const container = contentEditableRef.current;

      if (!container || !container.contains(range.commonAncestorContainer)) {
          setShowFormattingMenu(false);
          return;
      }

      const rect = range.getBoundingClientRect();
      setFormattingMenuPos({
          top: rect.top - 45, 
          left: rect.left + (rect.width / 2)
      });
      setShowFormattingMenu(true);
  };

  const checkForAutolink = (textBeforeCursor: string, rect: DOMRect) => {
      // Clean text to avoid matching inside HTML tags accidentally (basic check)
      const words = textBeforeCursor.split(/\s+/);
      
      // Sort resources by length desc so "Chrono Watch" matches before "Watch"
      const sortedResources = [...resources].sort((a, b) => (b.label?.length || 0) - (a.label?.length || 0));
      
      for (const res of sortedResources) {
          const label = res.label || res.value;
          if (!label) continue;
          
          // Check if the text ends with this label
          // We use a regex to ensure it ends on a word boundary or exact match
          const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`${escapedLabel}$`, 'i');
          
          if (regex.test(textBeforeCursor)) {
              // Found a match!
              setSuggestedLink(res);
              setSuggestionPos({ top: rect.bottom + 5, left: rect.left });
              return true;
          }
      }
      setSuggestedLink(null);
      return false;
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Strip preview images if any leftover (though new implementation uses portal)
    const clone = e.currentTarget.cloneNode(true) as HTMLElement;
    const previews = clone.querySelectorAll('.resource-preview-img');
    previews.forEach(p => p.remove());
    
    const cleanHtml = clone.innerHTML;
    onChange(cleanHtml);
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      const text = textNode.textContent || '';
      const beforeCursor = text.slice(0, range.startOffset);
      
      // Check for @ Mention
      const mentionMatch = beforeCursor.match(/@(\w*)$/);
      // Check for / Slash Command
      const slashMatch = beforeCursor.match(/\/((\w*)|)$/); // matches / or /wo...
      
      const rect = range.getBoundingClientRect();

      if (mentionMatch) {
        setMentionPosition({ top: rect.bottom + 5, left: rect.left });
        setMentionQuery(mentionMatch[1]);
        setShowMentionMenu(true);
        setShowSlashMenu(false);
        setSuggestedLink(null); // Disable autolink while mentioning
        setMentionTypeFilter('all');
        setMentionSelectedIndex(0);
      } else if (slashMatch) {
        setSlashMenuPos({ top: rect.bottom + 5, left: rect.left });
        setSlashQuery(slashMatch[1]);
        setShowSlashMenu(true);
        setShowMentionMenu(false);
        setSuggestedLink(null);
        setSlashSelectedIndex(0);
      } else {
        setShowMentionMenu(false);
        setShowSlashMenu(false);
        // Only check for autolink if we are in a text node and not typing a command
        checkForAutolink(beforeCursor, rect);
      }
    }
  };

  const getFilteredResources = () => {
      return resources.filter(r => {
          const matchesText = (r.label || r.value).toLowerCase().includes(mentionQuery.toLowerCase());
          const matchesType = mentionTypeFilter === 'all' || r.type === mentionTypeFilter;
          return matchesText && matchesType;
      });
  };

  const getFilteredSlashCommands = () => {
      return SLASH_COMMANDS.filter(cmd => 
          cmd.label.toLowerCase().includes(slashQuery.toLowerCase())
      );
  };

  const confirmAutolink = () => {
      if (!suggestedLink) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType === Node.TEXT_NODE) {
           const text = textNode.textContent || '';
           const label = suggestedLink.label || suggestedLink.value;
           // Find the last occurrence of this label before cursor
           const beforeCursor = text.slice(0, range.startOffset);
           const index = beforeCursor.toLowerCase().lastIndexOf(label.toLowerCase());
           
           if (index !== -1) {
               const start = index;
               const end = range.startOffset;

               range.setStart(textNode, start);
               range.setEnd(textNode, end);
               range.deleteContents();

               // Generate Chip HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = createResourceChipHtml(suggestedLink);
                const chipNode = tempDiv.firstChild as Node;

                range.insertNode(chipNode);
                
                const space = document.createTextNode('\u00A0');
                range.setStartAfter(chipNode);
                range.setEndAfter(chipNode);
                range.insertNode(space);
                range.setStartAfter(space);
                range.setEndAfter(space);

                selection.removeAllRanges();
                selection.addRange(range);
                
                if (contentEditableRef.current) {
                    onChange(contentEditableRef.current.innerHTML);
                }
           }
      }
      setSuggestedLink(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // --- MENTION MENU NAVIGATION ---
      if (showMentionMenu) {
          const filtered = getFilteredResources();
          
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setMentionSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setMentionSelectedIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Tab') {
              e.preventDefault();
              const types: ResourceFilterType[] = ['all', 'character', 'location', 'object', 'media', 'note', 'web'];
              const currentIdx = types.indexOf(mentionTypeFilter);
              setMentionTypeFilter(types[(currentIdx + 1) % types.length]);
              setMentionSelectedIndex(0);
          } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered[mentionSelectedIndex]) {
                  insertMention(filtered[mentionSelectedIndex]);
              }
          } else if (e.key === 'Escape') {
              setShowMentionMenu(false);
          }
          return;
      }

      // --- SLASH MENU NAVIGATION ---
      if (showSlashMenu) {
          const filtered = getFilteredSlashCommands();
          
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSlashSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSlashSelectedIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              if (filtered[slashSelectedIndex]) {
                  executeSlashCommand(filtered[slashSelectedIndex]);
              }
          } else if (e.key === 'Escape') {
              setShowSlashMenu(false);
          }
          return;
      }

      // --- AUTOLINK SUGGESTION ---
      if (suggestedLink) {
          if (e.key === 'Tab') {
              e.preventDefault();
              confirmAutolink();
              return;
          } else if (e.key === 'Escape') {
              setSuggestedLink(null); // Dismiss suggestion
              return;
          }
      }

      // Markdown Shortcuts (Fallback)
      if (e.key === ' ') {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          
          const range = selection.getRangeAt(0);
          const textNode = range.startContainer;
          
          if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
             const offset = range.startOffset;
             const text = textNode.textContent.slice(0, offset);
             
             let command = '';
             let value = '';
             let charsToRemove = 0;
             let customAction = null;

             if (text === '#') { command = 'formatBlock'; value = 'H1'; charsToRemove = 1; }
             else if (text === '##') { command = 'formatBlock'; value = 'H2'; charsToRemove = 2; }
             else if (text === '###') { command = 'formatBlock'; value = 'H3'; charsToRemove = 3; }
             else if (text === '>') { command = 'formatBlock'; value = 'BLOCKQUOTE'; charsToRemove = 1; }
             else if (text === '-' || text === '*') { command = 'insertUnorderedList'; charsToRemove = 1; }
             else if (text === '1.') { command = 'insertOrderedList'; charsToRemove = 2; }
             else if (text === '[]') { customAction = insertTodo; charsToRemove = 2; }

             if (command || customAction) {
                 e.preventDefault();
                 range.setStart(textNode, 0);
                 range.setEnd(textNode, charsToRemove);
                 range.deleteContents();
                 
                 if (customAction) customAction();
                 else document.execCommand(command, false, value);
             }
          }
      }
  };

  const insertTodo = () => {
      const todoHtml = `<div class="todo-item"><input type="checkbox" /> <span>&nbsp;</span></div>`;
      document.execCommand('insertHTML', false, todoHtml);
      if (contentEditableRef.current) {
          onChange(contentEditableRef.current.innerHTML);
      }
      setShowSlashMenu(false);
  };

  const executeSlashCommand = (cmd: SlashCommand) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const match = text.slice(0, range.startOffset).match(/\/((\w*)|)$/);
          
          if (match) {
              // Remove the slash command text
              const start = range.startOffset - match[0].length;
              const end = range.startOffset;
              range.setStart(textNode, start);
              range.setEnd(textNode, end);
              range.deleteContents();
              
              // Execute the command
              if (cmd.customAction) {
                  cmd.customAction();
              } else if (cmd.command) {
                  document.execCommand(cmd.command, false, cmd.value);
              }
              
              if (contentEditableRef.current) {
                  onChange(contentEditableRef.current.innerHTML);
              }
          }
      }
      setShowSlashMenu(false);
  };

  const insertMention = (resource: Resource) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent || '';
        const match = text.slice(0, range.startOffset).match(/@(\w*)$/);
        
        if (match) {
            const start = range.startOffset - match[0].length;
            const end = range.startOffset;
            
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
            range.deleteContents();
            
            // Generate Chip HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createResourceChipHtml(resource);
            const chipNode = tempDiv.firstChild as Node;

            range.insertNode(chipNode);
            
            const space = document.createTextNode('\u00A0');
            range.setStartAfter(chipNode);
            range.setEndAfter(chipNode);
            range.insertNode(space);
            
            range.setStartAfter(space);
            range.setEndAfter(space);

            selection.removeAllRanges();
            selection.addRange(range);
            
            if (contentEditableRef.current) {
                onChange(contentEditableRef.current.innerHTML);
            }
        }
    }
    setShowMentionMenu(false);
  };

  const applyFormat = (e: React.MouseEvent, command: string, value?: string) => {
      e.preventDefault();
      document.execCommand(command, false, value);
      if (contentEditableRef.current) {
          onChange(contentEditableRef.current.innerHTML);
      }
  };

  const filteredResources = getFilteredResources();
  const filteredSlashCommands = getFilteredSlashCommands();

  return (
    <>
      <ResourcePreviewTooltip resource={hoveredResource} position={previewPos} />
      
      {/* Suggested Link Prompt */}
      {suggestedLink && (
          <div 
            className="fixed z-[100] bg-white dark:bg-stone-900 border border-purple-200 dark:border-purple-800 shadow-lg rounded-md p-1.5 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2"
            style={{ top: suggestionPos.top, left: suggestionPos.left }}
          >
             <div className="text-[10px] font-medium text-stone-500 dark:text-stone-400">Link to:</div>
             <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-bold">
                 <div dangerouslySetInnerHTML={{ __html: suggestedLink.icon || '' }} className="w-3 h-3 [&>svg]:w-full [&>svg]:h-full" />
                 {suggestedLink.label}
             </div>
             <div className="text-[9px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-1 rounded border border-stone-200 dark:border-stone-700">
                 Tab
             </div>
          </div>
      )}

      <div
        ref={contentEditableRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onMouseUp={checkSelection}
        onKeyUp={checkSelection}
        onBlur={(e) => {
            if (onBlur) onBlur();
            // Delay closing to allow clicks on menus
            setTimeout(() => {
                setShowMentionMenu(false);
                setShowSlashMenu(false);
                setSuggestedLink(null);
            }, 200);
        }}
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`rich-text-editor outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-600 empty:before:pointer-events-none ${className}`}
        data-placeholder={placeholder}
      />
      
      {/* Formatting Menu */}
      {showFormattingMenu && (
          <div 
             className="fixed z-[100] bg-stone-900 text-white rounded-lg shadow-xl flex items-center overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-stone-700"
             style={{ top: formattingMenuPos.top, left: formattingMenuPos.left, transform: 'translateX(-50%)' }}
             onMouseDown={(e) => e.preventDefault()}
          >
              <button onClick={(e) => applyFormat(e, 'bold')} className="p-2 hover:bg-stone-700 transition-colors" title="Bold"><Bold size={14} /></button>
              <button onClick={(e) => applyFormat(e, 'italic')} className="p-2 hover:bg-stone-700 transition-colors" title="Italic"><Italic size={14} /></button>
              <button onClick={(e) => applyFormat(e, 'underline')} className="p-2 hover:bg-stone-700 transition-colors" title="Underline"><Underline size={14} /></button>
              <button onClick={(e) => applyFormat(e, 'strikeThrough')} className="p-2 hover:bg-stone-700 transition-colors" title="Strikethrough"><Strikethrough size={14} /></button>
              <button onClick={(e) => applyFormat(e, 'formatBlock', 'PRE')} className="p-2 hover:bg-stone-700 transition-colors" title="Code Block"><Code size={14} /></button>
              <div className="w-px h-4 bg-stone-700 mx-1"></div>
              <button onClick={(e) => applyFormat(e, 'formatBlock', 'H1')} className="p-2 hover:bg-stone-700 transition-colors font-bold text-xs">H1</button>
              <button onClick={(e) => applyFormat(e, 'formatBlock', 'H2')} className="p-2 hover:bg-stone-700 transition-colors font-bold text-xs">H2</button>
              <button onClick={(e) => insertTodo()} className="p-2 hover:bg-stone-700 transition-colors" title="Checklist"><CheckSquare size={14} /></button>
          </div>
      )}

      {/* Mention Menu (@) */}
      {showMentionMenu && (
        <div 
            className="fixed z-[100] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl rounded-lg w-60 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
            style={{ top: mentionPosition.top, left: mentionPosition.left }}
        >
            {/* Filter Tabs */}
            <div className="flex border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-1 gap-1 overflow-x-auto no-scrollbar">
                {(['all', 'character', 'location', 'object'] as const).map(t => (
                     <button 
                        key={t}
                        onClick={() => setMentionTypeFilter(t)} 
                        className={`shrink-0 flex justify-center py-1 px-2 rounded text-[10px] font-bold uppercase transition-colors ${mentionTypeFilter === t ? 'bg-white dark:bg-stone-800 shadow text-stone-900 dark:text-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                     >
                         {t === 'all' ? <LayoutGrid size={12} /> : t.slice(0,4)}
                     </button>
                ))}
            </div>

            <div ref={mentionListRef} className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {filteredResources.map((r, idx) => (
                <button
                    key={r.id}
                    onClick={() => insertMention(r)}
                    onMouseEnter={() => setMentionSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-2 transition-colors ${
                        mentionSelectedIndex === idx 
                        ? 'bg-stone-100 dark:bg-stone-800' 
                        : 'text-stone-700 dark:text-stone-200'
                    }`}
                >
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: r.color || '#ccc' }}>
                         <div dangerouslySetInnerHTML={{ __html: r.icon || '' }} className="w-3 h-3 [&>svg]:w-full [&>svg]:h-full" />
                    </div>
                    <div className="truncate flex-1">
                        {r.label || r.value}
                    </div>
                </button>
            ))}
            {filteredResources.length === 0 && (
                <div className="px-3 py-4 text-center">
                    <div className="text-stone-300 mb-1">No items found</div>
                </div>
            )}
            </div>
        </div>
      )}

      {/* Slash Command Menu (/) */}
      {showSlashMenu && (
          <div 
              className="fixed z-[100] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl rounded-lg w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
              style={{ top: slashMenuPos.top, left: slashMenuPos.left }}
          >
              <div className="px-3 py-2 text-[10px] font-bold uppercase text-stone-400 bg-stone-50 dark:bg-stone-950/50 border-b border-stone-100 dark:border-stone-800 tracking-wider">
                  Basic Blocks
              </div>
              <div ref={slashListRef} className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {filteredSlashCommands.map((cmd, idx) => (
                      <button
                          key={cmd.id}
                          onClick={() => executeSlashCommand(cmd)}
                          onMouseEnter={() => setSlashSelectedIndex(idx)}
                          className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${
                              slashSelectedIndex === idx 
                              ? 'bg-stone-100 dark:bg-stone-800' 
                              : 'text-stone-700 dark:text-stone-200'
                          }`}
                      >
                          <div className="w-8 h-8 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center text-stone-500 dark:text-stone-400 shrink-0 shadow-sm">
                              {cmd.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">{cmd.label}</div>
                              <div className="text-[10px] text-stone-400 truncate">{cmd.description}</div>
                          </div>
                      </button>
                  ))}
                  {filteredSlashCommands.length === 0 && (
                    <div className="px-3 py-4 text-center">
                        <div className="text-[10px] text-stone-400">No matching commands</div>
                    </div>
                  )}
              </div>
          </div>
      )}
    </>
  );
};
