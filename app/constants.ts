
import { Script } from './types';

// Refined Lucide-style icons with consistent 2px stroke and 24x24 viewBox
export const ICONS = {
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  skull: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>`,
  cloudRain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`,
  disc: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><path d="M12 14a2 2 0 0 1 0-4"/></svg>`,
  zap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  map: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" x2="8" y1="2" y2="18"/><line x1="16" x2="16" y1="6" y2="22"/></svg>`,
  film: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  box: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  anchor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  ghost: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 22v-2h6v2"/><path d="M9 2v2h6V2"/><path d="M12 2a8 8 0 0 0-8 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a8 8 0 0 0-8-8z"/><path d="M9 10h.01"/><path d="M15 10h.01"/></svg>`,
};

export const INITIAL_SCRIPT: Script = {
  id: 'script-demo-v3',
  metadata: {
    title: 'The Recursive Script',
    author: 'The Operator',
    description: `
      <h1>PROJECT MANIFESTO</h1>
      <p><b>LOGLINE:</b> A <i>self-aware</i> screenplay battles against <b>Feature Creep</b> to reach the final draft before the deadline expires.</p>
      <hr>
      <h3>PRODUCTION TASKS</h3>
      <div class="todo-item" data-status="done"><input type="checkbox" checked> <span>Initialize Story Engine</span></div>
      <div class="todo-item" data-status="done"><input type="checkbox" checked> <span>Define Protagonist Goal</span></div>
      <div class="todo-item" data-status="in-progress"><input type="checkbox"> <span>Debug Act 2 Climax</span></div>
      <div class="todo-item"><input type="checkbox"> <span>Polish Dialogue</span></div>
      <br>
      <h3>SYSTEM LOGS</h3>
      <pre><code>> RUN DIAGNOSTIC
> CORE STABLE
> NARRATIVE: BRANCHING...</code></pre>
      <blockquote>"Stories are just data with a soul." - The Architect</blockquote>
    `,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  },
  resources: [
    { 
      id: 'res-writer', 
      type: 'character', 
      value: 'The User', 
      label: 'The User', 
      icon: ICONS.user, 
      color: '#205EA6', 
      tags: ['Protagonist', 'Human'],
      description: '<b>Role:</b> The creative force driving the input.<br><b>Motivation:</b> To finish the project.<br><b>Inventory:</b><br><ul><li>Coffee Mug</li><li>Keyboard</li><li>Crippling Anxiety</li></ul>'
    },
    { 
      id: 'res-creep', 
      type: 'character', 
      value: 'Feature Creep', 
      label: 'Feature Creep', 
      icon: ICONS.ghost, 
      color: '#AF3029', 
      tags: ['Antagonist', 'Abstract'],
      description: '<b>Definition:</b> The tendency for requirements to increase during development.<br><b>Abilities:</b><br><ol><li>Scope Expansion</li><li>Deadline Delay</li><li>Resource Drain</li></ol><p>Often appears when <span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span> is tired.</p>'
    },
    { 
      id: 'res-editor', 
      type: 'object', 
      value: 'The Editor', 
      label: 'KinoScripter', 
      icon: ICONS.box, 
      color: '#24837B', 
      tags: ['Setting', 'Meta'],
      description: 'The software environment where this story takes place. It runs on:<br><pre><code>React 19\nTailwind CSS\nGemini AI</code></pre>'
    },
    {
      id: 'res-img-mood',
      type: 'media',
      value: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
      label: 'Cyberpunk Mood',
      icon: ICONS.film,
      color: '#5E409D',
      tags: ['Visual', 'Reference'],
      description: 'Visual reference for the <span class="resource-chip" data-id="res-editor" data-type="object" style="--chip-color: #24837B"><span class="resource-icon">' + ICONS.box + '</span>KinoScripter</span> internal world.<br><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop" class="rounded-lg mt-2 border border-stone-200 dark:border-stone-700" />'
    },
    {
        id: 'res-link-tropes',
        type: 'web',
        value: 'https://tvtropes.org/pmwiki/pmwiki.php/Main/MediumAwareness',
        label: 'Medium Awareness',
        icon: ICONS.globe,
        color: '#AD8301',
        tags: ['Research', 'Trope'],
        description: 'Essential reading for meta-narratives. See also: <span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span>.'
    },
    {
        id: 'res-deadline',
        type: 'location', // somewhat abstract location
        value: 'The Deadline',
        label: 'The Deadline',
        icon: ICONS.clock,
        color: '#6F6E69',
        tags: ['Time', 'Limit'],
        description: 'The fixed point in time that cannot be moved. It is <b>inevitable</b>.'
    }
  ],
  content: [
    {
      id: 'act-1',
      type: 'act',
      title: 'Act I: The Blank Canvas',
      children: [
        {
          id: 'scene-1',
          type: 'scene',
          title: 'INT. NEW PROJECT - DAY',
          description: '<b>SETUP:</b> The blinking cursor of potential.',
          children: [
            {
              id: 'beat-1',
              type: 'beat',
              duration: 10,
              content: {
                audio: '<b>SOUND:</b><br>The gentle hum of a cooling fan.',
                visual: '<h1>INIT SEQUENCE</h1><br>A blank screen. <span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span> stares at the white void of <span class="resource-chip" data-id="res-editor" data-type="object" style="--chip-color: #24837B"><span class="resource-icon">' + ICONS.box + '</span>KinoScripter</span>.'
              }
            },
            {
              id: 'beat-2',
              type: 'beat',
              duration: 20,
              content: {
                audio: '<b>THE USER</b><br>Okay. Just a simple script. Three acts. No fancy stuff.',
                visual: 'They type "FADE IN". The text appears in Courier Prime.'
              }
            }
          ]
        },
        {
            id: 'scene-2',
            type: 'scene',
            title: 'EXT. INTERFACE - CONTINUOUS',
            description: '<b>INCITING INCIDENT:</b> The tools tempt the user.',
            children: [
                {
                    id: 'beat-3',
                    type: 'beat',
                    duration: 15,
                    content: {
                        audio: '<b>SOUND:</b><br>A notification chime.',
                        visual: 'A sidebar opens. It displays options:<br><ul><li>Graph View</li><li>AI Generation</li><li>Detailed Wiki</li></ul><br><span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span> is intrigued. <span class="resource-chip" data-id="res-creep" data-type="character" style="--chip-color: #AF3029"><span class="resource-icon">' + ICONS.ghost + '</span>Feature Creep</span> watches from the shadows.'
                    }
                }
            ]
        }
      ]
    },
    {
        id: 'act-2',
        type: 'act',
        title: 'Act II: Scope Creep',
        children: [
            {
                id: 'scene-3',
                type: 'scene',
                title: 'INT. THE CODEBLOCK - NIGHT',
                description: '<b>RISING ACTION:</b> Complexity increases.',
                children: [
                    {
                        id: 'beat-4',
                        type: 'beat',
                        duration: 30,
                        content: {
                            audio: '<b>FEATURE CREEP (V.O.)</b><br>Why just write? You could also visualize the data.',
                            visual: '<span class="resource-chip" data-id="res-creep" data-type="character" style="--chip-color: #AF3029"><span class="resource-icon">' + ICONS.ghost + '</span>Feature Creep</span> emerges from the settings menu. It looks like a tangle of unclosed HTML tags.'
                        }
                    },
                    {
                        id: 'beat-5',
                        type: 'beat',
                        duration: 45,
                        content: {
                            audio: '<b>SOUND:</b><br>Glitch noises.',
                            visual: '<span class="resource-chip" data-id="res-editor" data-type="object" style="--chip-color: #24837B"><span class="resource-icon">' + ICONS.box + '</span>KinoScripter</span> starts to fracture. Code bleeds into the dialogue:<br><pre><code>function narrate() {\n  if (scope > budget) {\n    panic();\n  }\n}</code></pre>'
                        }
                    }
                ]
            },
            {
                id: 'scene-4',
                type: 'scene',
                title: 'INT. THE RABBIT HOLE - LATER',
                description: '<b>MIDPOINT:</b> Losing sight of the story.',
                children: [
                     {
                         id: 'beat-6',
                         type: 'beat',
                         duration: 25,
                         content: {
                             audio: '<b>THE USER</b><br>I need to define the lore of the world first!',
                             visual: '<span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span> is buried under 50 open wiki tabs about <span class="resource-chip" data-id="res-link-tropes" data-type="web" style="--chip-color: #AD8301"><span class="resource-icon">' + ICONS.globe + '</span>Medium Awareness</span>.'
                         }
                     }
                ]
            }
        ]
    },
    {
        id: 'act-3',
        type: 'act',
        title: 'Act III: The MVP',
        children: [
            {
                id: 'scene-5',
                type: 'scene',
                title: 'INT. DEADLINE - DAWN',
                description: '<b>CLIMAX:</b> Focusing on what matters.',
                children: [
                    {
                        id: 'beat-7',
                        type: 'beat',
                        duration: 15,
                        content: {
                            audio: '<b>SOUND:</b><br>A ticking clock, getting louder.',
                            visual: '<span class="resource-chip" data-id="res-deadline" data-type="location" style="--chip-color: #6F6E69"><span class="resource-icon">' + ICONS.clock + '</span>The Deadline</span> looms over the screen. It is red and angry. <span class="resource-chip" data-id="res-creep" data-type="character" style="--chip-color: #AF3029"><span class="resource-icon">' + ICONS.ghost + '</span>Feature Creep</span> tries to block the export button.'
                        }
                    },
                    {
                        id: 'beat-8',
                        type: 'beat',
                        duration: 20,
                        content: {
                            audio: '<b>THE USER</b><br>Cut the features. Ship the story.',
                            visual: '<span class="resource-chip" data-id="res-writer" data-type="character" style="--chip-color: #205EA6"><span class="resource-icon">' + ICONS.user + '</span>The User</span> closes the wiki tabs. They minimize the <span class="resource-chip" data-id="res-img-mood" data-type="media" style="--chip-color: #5E409D"><span class="resource-icon">' + ICONS.film + '</span>Cyberpunk Mood</span> board. They defeat <span class="resource-chip" data-id="res-creep" data-type="character" style="--chip-color: #AF3029"><span class="resource-icon">' + ICONS.ghost + '</span>Feature Creep</span> with a single click.'
                        }
                    },
                    {
                        id: 'beat-9',
                        type: 'beat',
                        duration: 10,
                        content: {
                            audio: '<b>SYSTEM</b><br>Export Complete.',
                            visual: '<b>FADE OUT.</b>'
                        }
                    }
                ]
            }
        ]
    }
  ],
  history: []
};

export const TEMPLATES = [
  {
    id: 'template-demo',
    name: 'Demo Project',
    type: 'Tutorial',
    description: 'The meta-narrative script showing off advanced KinoScripter capabilities.',
    script: INITIAL_SCRIPT
  },
  {
    id: 'template-3act',
    name: 'Three Act Structure',
    type: 'Feature Film',
    description: 'Standard narrative structure: Setup, Confrontation, and Resolution.',
    script: {
        id: 'script-3act',
        metadata: {
            title: 'Three Act Structure',
            author: '',
            description: '<b>Structure Template:</b> Standard narrative form.<br><ul><li>Act I: Setup (approx 25%)</li><li>Act II: Confrontation (approx 50%)</li><li>Act III: Resolution (approx 25%)</li></ul>',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
            {
                id: 'act-1',
                type: 'act',
                title: 'Act I: Setup',
                children: [
                    { id: 'sc-1', type: 'scene', title: 'INT. INCITING INCIDENT', description: 'The event that sets the plot in motion.', children: [{ id: 'bt-1', type: 'beat', duration: 15, content: { audio: '', visual: '' } }] },
                    { id: 'sc-2', type: 'scene', title: 'INT. PLOT POINT 1', description: 'The protagonist leaves the ordinary world.', children: [{ id: 'bt-2', type: 'beat', duration: 15, content: { audio: '', visual: '' } }] }
                ]
            },
            {
                id: 'act-2',
                type: 'act',
                title: 'Act II: Confrontation',
                children: [
                    { id: 'sc-3', type: 'scene', title: 'INT. MIDPOINT', description: 'A major shift in the dynamic.', children: [{ id: 'bt-3', type: 'beat', duration: 15, content: { audio: '', visual: '' } }] },
                    { id: 'sc-4', type: 'scene', title: 'INT. LOW POINT', description: 'All is lost.', children: [{ id: 'bt-4', type: 'beat', duration: 15, content: { audio: '', visual: '' } }] }
                ]
            },
            {
                id: 'act-3',
                type: 'act',
                title: 'Act III: Resolution',
                children: [
                    { id: 'sc-5', type: 'scene', title: 'INT. CLIMAX', description: 'The final battle.', children: [{ id: 'bt-5', type: 'beat', duration: 15, content: { audio: '', visual: '' } }] }
                ]
            }
        ],
        history: []
    }
  },
  {
    id: 'template-hero',
    name: "Hero's Journey",
    type: 'Mythic / Epic',
    description: 'Based on Joseph Campbell\'s Monomyth. 12 stages of adventure.',
    script: {
        id: 'script-hero',
        metadata: {
            title: 'The Hero\'s Journey',
            author: '',
            description: '<b>Structure Template:</b> Monomyth structure.<br>A guide for epic narratives involving a call to adventure, initiation, and return.',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
            {
                id: 'act-1',
                type: 'act',
                title: 'Act I: Departure',
                children: [
                    { id: 'sc-1', type: 'scene', title: 'THE ORDINARY WORLD', description: 'Establish the status quo.', children: [] },
                    { id: 'sc-2', type: 'scene', title: 'CALL TO ADVENTURE', description: 'Disruption of the ordinary.', children: [] },
                    { id: 'sc-3', type: 'scene', title: 'REFUSAL OF THE CALL', description: 'Fear of the unknown.', children: [] },
                    { id: 'sc-4', type: 'scene', title: 'MEETING THE MENTOR', description: 'Gaining supplies/knowledge.', children: [] },
                    { id: 'sc-5', type: 'scene', title: 'CROSSING THE THRESHOLD', description: 'Commitment to the journey.', children: [] }
                ]
            },
            {
                id: 'act-2',
                type: 'act',
                title: 'Act II: Initiation',
                children: [
                    { id: 'sc-6', type: 'scene', title: 'TESTS, ALLIES, ENEMIES', description: 'Learning the rules of the new world.', children: [] },
                    { id: 'sc-7', type: 'scene', title: 'APPROACH', description: 'Preparing for the major challenge.', children: [] },
                    { id: 'sc-8', type: 'scene', title: 'THE ORDEAL', description: 'Death and rebirth.', children: [] },
                    { id: 'sc-9', type: 'scene', title: 'REWARD', description: 'Seizing the sword.', children: [] }
                ]
            },
            {
                id: 'act-3',
                type: 'act',
                title: 'Act III: Return',
                children: [
                    { id: 'sc-10', type: 'scene', title: 'THE ROAD BACK', description: 'The chase to return home.', children: [] },
                    { id: 'sc-11', type: 'scene', title: 'RESURRECTION', description: 'Final test.', children: [] },
                    { id: 'sc-12', type: 'scene', title: 'RETURN WITH ELIXIR', description: 'Master of two worlds.', children: [] }
                ]
            }
        ],
        history: []
    }
  },
  {
    id: 'template-stc',
    name: 'Save the Cat',
    type: 'Blockbuster',
    description: 'Blake Snyder\'s beat sheet structure optimized for pacing.',
    script: {
        id: 'script-stc',
        metadata: {
            title: 'Save the Cat Beat Sheet',
            author: '',
            description: '<b>Structure Template:</b> A highly structured pacing guide common in modern screenwriting.',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
             {
                id: 'act-1',
                type: 'act',
                title: 'Act I',
                children: [
                    { id: 'sc-1', type: 'scene', title: 'OPENING IMAGE', children: [] },
                    { id: 'sc-2', type: 'scene', title: 'THEME STATED', children: [] },
                    { id: 'sc-3', type: 'scene', title: 'CATALYST', children: [] },
                    { id: 'sc-4', type: 'scene', title: 'DEBATE', children: [] }
                ]
             },
             {
                id: 'act-2',
                type: 'act',
                title: 'Act II',
                children: [
                    { id: 'sc-5', type: 'scene', title: 'BREAK INTO TWO', children: [] },
                    { id: 'sc-6', type: 'scene', title: 'B STORY', children: [] },
                    { id: 'sc-7', type: 'scene', title: 'FUN AND GAMES', children: [] },
                    { id: 'sc-8', type: 'scene', title: 'MIDPOINT', children: [] },
                    { id: 'sc-9', type: 'scene', title: 'BAD GUYS CLOSE IN', children: [] },
                    { id: 'sc-10', type: 'scene', title: 'ALL IS LOST', children: [] },
                    { id: 'sc-11', type: 'scene', title: 'DARK NIGHT OF THE SOUL', children: [] }
                ]
             },
             {
                id: 'act-3',
                type: 'act',
                title: 'Act III',
                children: [
                    { id: 'sc-12', type: 'scene', title: 'BREAK INTO THREE', children: [] },
                    { id: 'sc-13', type: 'scene', title: 'FINALE', children: [] },
                    { id: 'sc-14', type: 'scene', title: 'FINAL IMAGE', children: [] }
                ]
             }
        ],
        history: []
    }
  },
  {
    id: 'template-commercial',
    name: '30s Commercial',
    type: 'Advertising',
    description: 'A structured two-column script for a 30-second spot. Includes setup, problem, solution, and call to action.',
    script: {
        id: 'script-ad-30s',
        metadata: {
            title: 'Untitled Spot (30s)',
            author: '',
            description: 'Client: \nProduct: \nTarget Audience: ',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
            {
                id: 'act-1',
                type: 'act',
                title: 'The Spot',
                children: [
                     {
                        id: 'sc-1',
                        type: 'scene',
                        title: '00:00 - 00:05: THE HOOK',
                        description: 'Grab attention immediately.',
                        children: [{id:'b1',type:'beat',duration:5,content:{audio:'Music starts.',visual:'High energy opening shot.'}}]
                     },
                     {
                        id: 'sc-2',
                        type: 'scene',
                        title: '00:05 - 00:20: THE STORY/PROBLEM',
                        description: 'Demonstrate the need or the lifestyle.',
                        children: [{id:'b2',type:'beat',duration:15,content:{audio:'VO: ...',visual:'Product in action.'}}]
                     },
                     {
                        id: 'sc-3',
                        type: 'scene',
                        title: '00:20 - 00:30: RESOLUTION & CTA',
                        description: 'Logo and Call to Action.',
                        children: [{id:'b3',type:'beat',duration:10,content:{audio:'VO: Available now.',visual:'Logo animation. URL on screen.'}}]
                     }
                ]
            }
        ],
        history: []
    }
  },
  {
    id: 'template-music-video',
    name: 'Music Video',
    type: 'Music Video',
    description: 'Broken down by song sections (Verse, Chorus, Bridge) to sync visuals with audio timing.',
    script: {
        id: 'script-music-vid',
        metadata: {
            title: 'Untitled Music Video',
            author: '',
            description: 'Artist: \nSong: \nBPM: ',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
            {
                id: 'act-1',
                type: 'act',
                title: 'Intro & Verse 1',
                children: []
            },
            {
                id: 'act-2',
                type: 'act',
                title: 'Chorus 1',
                children: []
            },
            {
                id: 'act-3',
                type: 'act',
                title: 'Verse 2',
                children: []
            }
        ],
        history: []
    }
  },
  {
    id: 'template-doc',
    name: 'Documentary Outline',
    type: 'Documentary',
    description: 'A structure for organizing interviews, B-roll, and archival footage.',
    script: {
        id: 'script-doc',
        metadata: {
            title: 'Untitled Documentary',
            author: '',
            description: 'Subject: \nKey Themes: ',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [
            {id:'res-int-1',type:'character',value:'Interviewee 1',label:'Interviewee 1',color:'#205EA6'},
            {id:'res-broll',type:'media',value:'',label:'General B-Roll',color:'#66800B'}
        ],
        content: [
             {
                id: 'act-1',
                type: 'act',
                title: 'Part 1: Introduction',
                children: [{id:'sc-1',type:'scene',title:'INT. INTERVIEW',description:'Establishing the subject.',children:[{id:'b1',type:'beat',duration:15,content:{audio:'Talking head.',visual:'Lower thirds title.'}}]}]
            }
        ],
        history: []
    }
  },
  {
    id: 'template-blank',
    name: 'Blank Canvas',
    type: 'New Project',
    description: 'Start from scratch with an empty canvas.',
    script: {
        id: 'script-blank',
        metadata: {
            title: 'Untitled Project',
            author: '',
            description: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
        },
        resources: [],
        content: [
            {
                id: 'act-1',
                type: 'act',
                title: 'Act I',
                children: []
            }
        ],
        history: []
    }
  }
];
