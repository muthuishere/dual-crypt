import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClipboardDocumentIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import 'github-markdown-css/github-markdown-light.css';

export default function CodeViewer({ 
  currentContent = '',
  fullContent = '',
  title = "Code Implementation",
  visible, 
  onClose 
}) {
  const [viewMode, setViewMode] = useState('current'); // 'current' | 'full'
  const [copied, setCopied] = useState(false);

  // Reset copied state when content changes
  useEffect(() => {
    setCopied(false);
  }, [currentContent, fullContent]);

  const displayContent = viewMode === 'current' ? currentContent : fullContent;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const downloadAsFile = () => {
    const blob = new Blob([displayContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = viewMode === 'current' 
      ? `current-implementation.md`
      : `complete-implementation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!visible) return null;

  return (
    <Transition appear show={visible} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child 
          as={Fragment} 
          enter="ease-out duration-300" 
          enterFrom="opacity-0" 
          enterTo="opacity-100" 
          leave="ease-in duration-200" 
          leaveFrom="opacity-100" 
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child 
              as={Fragment} 
              enter="ease-out duration-300" 
              enterFrom="opacity-0 scale-95" 
              enterTo="opacity-100 scale-100" 
              leave="ease-in duration-200" 
              leaveFrom="opacity-100 scale-100" 
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      {title}
                    </Dialog.Title>
                    
                    {/* View Mode Toggle - Only show if fullContent exists */}
                    {fullContent && (
                      <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => setViewMode('current')}
                          className={`px-3 py-1.5 text-sm font-medium ${
                            viewMode === 'current' 
                              ? 'bg-blue-500 text-white' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Current
                        </button>
                        <button
                          onClick={() => setViewMode('full')}
                          className={`px-3 py-1.5 text-sm font-medium ${
                            viewMode === 'full' 
                              ? 'bg-blue-500 text-white' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Complete Implementation
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={copyToClipboard} 
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-1.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button 
                      onClick={downloadAsFile} 
                      className="inline-flex items-center px-3 py-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                      Download
                    </button>
                    <button 
                      onClick={onClose} 
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {displayContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
