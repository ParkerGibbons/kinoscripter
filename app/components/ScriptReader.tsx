
import React from 'react';
import { Script, ScriptNode } from '../types';
import { Printer } from 'lucide-react';

interface ScriptReaderProps {
    script: Script;
}

export const ScriptReader: React.FC<ScriptReaderProps> = ({ script }) => {
    const handlePrint = () => {
        window.print();
    };

    const renderContent = (nodes: ScriptNode[]) => {
        return nodes.map(node => {
            if (node.type === 'act') {
                return (
                    <div key={node.id} className="mb-12 mt-16 break-before-auto">
                        <h2 className="text-center font-bold underline uppercase text-xl tracking-widest mb-8 border-b-2 border-black pb-2 inline-block">
                            {node.title}
                        </h2>
                        {node.children && renderContent(node.children)}
                    </div>
                );
            }
            if (node.type === 'scene') {
                return (
                    <div key={node.id} className="mb-8 break-inside-avoid">
                         <div className="font-bold uppercase mb-2 bg-stone-100 px-3 py-1 inline-block rounded text-sm tracking-wide border border-stone-300 print:border-none print:bg-transparent print:p-0 print:text-base">
                            {node.title}
                         </div>
                         {node.description && (
                             <div className="mb-4 text-sm italic opacity-80 px-4 max-w-2xl" dangerouslySetInnerHTML={{ __html: node.description }} />
                         )}
                         <div className="space-y-4 pl-2">
                             {node.children && renderContent(node.children)}
                         </div>
                    </div>
                );
            }
            if (node.type === 'beat') {
                return (
                    <div key={node.id} className="grid grid-cols-2 gap-8 mb-4 px-4 break-inside-avoid">
                        <div className="font-mono text-sm leading-relaxed">
                            <div className="uppercase text-[10px] font-bold text-stone-400 mb-1 tracking-wider select-none print:hidden">Audio</div>
                            <div dangerouslySetInnerHTML={{ __html: node.content?.audio || '' }} />
                        </div>
                        <div className="font-mono text-sm leading-relaxed">
                            <div className="uppercase text-[10px] font-bold text-stone-400 mb-1 tracking-wider select-none print:hidden">Visual</div>
                            <div dangerouslySetInnerHTML={{ __html: node.content?.visual || '' }} />
                        </div>
                    </div>
                );
            }
            return null;
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto bg-white text-black shadow-2xl min-h-screen print:shadow-none print:w-full print:m-0 print:max-w-none">
            {/* Print Toolbar (Hidden in Print) */}
            <div className="p-4 border-b border-stone-200 flex justify-end print:hidden bg-stone-50 sticky top-0 z-50">
                 <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors shadow-sm"
                 >
                     <Printer size={16} /> Print Script
                 </button>
            </div>

            <div className="p-12 md:p-20 print:p-0">
                {/* Title Page */}
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center mb-20 print:min-h-screen print:break-after-page print:mb-0 relative">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-8 font-script">
                        {script.metadata.title || 'Untitled Project'}
                    </h1>
                    <div className="text-sm font-mono uppercase tracking-widest mb-16">
                        By {script.metadata.author || 'Unknown Author'}
                    </div>
                    
                    {script.metadata.description && (
                        <div className="max-w-xl text-sm leading-loose opacity-80 font-mono italic border-t border-b border-stone-200 py-8">
                             <div dangerouslySetInnerHTML={{__html: script.metadata.description}} />
                        </div>
                    )}

                    <div className="absolute bottom-0 text-xs font-mono opacity-40 uppercase tracking-widest">
                         Draft: {new Date(script.metadata.modified).toLocaleDateString()}
                    </div>
                </div>

                {/* Script Body */}
                <div className="font-script text-base leading-normal">
                    {renderContent(script.content)}
                </div>
                
                <div className="mt-20 pt-10 border-t border-stone-200 text-center text-xs font-mono opacity-30 uppercase tracking-widest print:hidden">
                    End of Script
                </div>
            </div>
        </div>
    );
};
