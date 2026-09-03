import React, { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  FolderKanban,
  Trash2,
  X,
  RefreshCw,
  FileCode,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { api } from '../api/client';
import { Document, Project } from '../types';
import { useAuth } from '../context/AuthContext';

export const DocumentsHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('PROJECT');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const [dRes, pRes] = await Promise.all([
        api.get<Document[]>('/documents', {
          search: searchTerm || undefined,
          category: categoryFilter || undefined,
        }),
        api.get<Project[]>('/projects'),
      ]);
      setDocuments(dRes.data);
      setProjects(pRes.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, categoryFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      alert('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('title', docTitle || fileToUpload.name);
      formData.append('category', docCategory);
      if (selectedProjectId) formData.append('projectId', selectedProjectId);

      await api.post('/documents/upload', formData);
      setIsUploadOpen(false);
      setFileToUpload(null);
      setDocTitle('');
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImage className="w-5 h-5 text-purple-400" />;
      default:
        return <FileCode className="w-5 h-5 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-teal-400" />
            Document Vault
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Secure asset repository with automated version history and project linking
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by title or file name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="PROJECT">Project Assets</option>
            <option value="TASK">Task Deliverables</option>
            <option value="CLIENT">Client Contracts</option>
            <option value="COMPANY">Company Policies</option>
            <option value="INVOICE">Invoices & Finance</option>
          </select>
        </div>

        <button
          onClick={fetchDocuments}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Documents Table / Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No documents found in vault.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Document Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Linked Project</th>
                  <th className="p-4">Uploader</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Latest Version</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileType)}
                        <div>
                          <div className="font-bold text-white">{doc.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">{doc.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {doc.project ? (
                        <button
                          onClick={() => onNavigate(`/projects/${doc.project?.id}`)}
                          className="text-brand-400 hover:underline font-semibold"
                        >
                          {doc.project.name}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={doc.uploader?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60'}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-slate-300">{doc.uploader?.name || 'System'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {(doc.fileSize / 1024).toFixed(0)} KB
                    </td>
                    <td className="p-4 font-mono text-brand-400">
                      v{doc.versions?.[0]?.versionNumber || 1}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Upload Document</h2>
            <p className="text-xs text-slate-400 mb-4">Supported: PDF, DOCX, XLSX, PPTX, JPG, PNG (Max 25MB)</p>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select File *</label>
                <input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Architecture Specification v2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="PROJECT">PROJECT</option>
                    <option value="TASK">TASK</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="COMPANY">COMPANY</option>
                    <option value="INVOICE">INVOICE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Link to Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- None / General --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-brand-600/30"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
