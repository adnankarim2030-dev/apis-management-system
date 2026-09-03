import React, { useState, useEffect, useRef } from 'react';
import { Search, FolderKanban, CheckSquare, Users, Building, FileText, X, ArrowRight } from 'lucide-react';
import { api } from '../../api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/search', { q: query, limit: 5 });
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/40 gap-3">
          <Search className="w-5 h-5 text-brand-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, employees, clients, documents..."
            className="w-full bg-transparent border-none text-white placeholder-slate-400 focus:outline-none text-sm font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-sm text-slate-400">Searching APIS database...</div>
          )}

          {!isLoading && !query && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type anything to search across all organizational datasets.
            </div>
          )}

          {!isLoading && query && results && results.totalCount === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {results && (
            <>
              {/* Projects */}
              {results.projects?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-brand-400" /> Projects ({results.projects.length})
                  </div>
                  <div className="space-y-1">
                    {results.projects.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigate(`/projects/${p.id}`);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                            {p.projectCode}
                          </span>
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{p.progress}%</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Tasks ({results.tasks.length})
                  </div>
                  <div className="space-y-1">
                    {results.tasks.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onNavigate(`/tasks`);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">{t.project?.name}</div>
                          <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                            {t.title}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {t.status.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff / Users */}
              {results.users?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" /> Employees ({results.users.length})
                  </div>
                  <div className="space-y-1">
                    {results.users.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onNavigate(`/team`);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-200 group-hover:text-white">
                              {u.name}
                            </div>
                            <div className="text-xs text-slate-400">{u.designation}</div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{u.employeeId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients */}
              {results.clients?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" /> Clients ({results.clients.length})
                  </div>
                  <div className="space-y-1">
                    {results.clients.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onNavigate(`/clients`);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-200 group-hover:text-white">
                            {c.company}
                          </div>
                          <div className="text-xs text-slate-400">Contact: {c.contactPerson}</div>
                        </div>
                        <span className="text-xs text-slate-400">{c.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {results.documents?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Documents ({results.documents.length})
                  </div>
                  <div className="space-y-1">
                    {results.documents.map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onNavigate(`/documents`);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors group"
                      >
                        <div className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                          {d.title}
                        </div>
                        <span className="text-[10px] uppercase font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {d.fileType}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
