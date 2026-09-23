import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  FolderKanban,
  CheckCheck,
  Megaphone,
  RefreshCw,
  Plus,
  X,
  User as UserIcon,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { Announcement, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const MessagesHub: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const isCEO = user?.role === 'CEO' || user?.role === 'ADMIN';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'channels'>('broadcasts');
  const [isLoading, setIsLoading] = useState(true);

  // New Direct Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get<Announcement[]>('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const fetchConversations = async (targetConvId?: string) => {
    try {
      const res = await api.get<any[]>('/messages/conversations');
      setConversations(res.data);
      if (targetConvId) {
        const found = res.data.find((c) => c.id === targetConvId);
        if (found) {
          setActiveConv(found);
          setActiveTab('channels');
          return;
        }
      }
      if (res.data.length > 0 && !activeConv) {
        setActiveConv(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setTeamMembers(res.data.filter((u) => u.id !== user?.id));
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await api.get<any[]>(`/messages/${convId}`);
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    // Check url params for convId
    const params = new URLSearchParams(window.location.search);
    const convIdFromUrl = params.get('convId');

    setIsLoading(true);
    Promise.all([fetchAnnouncements(), fetchConversations(convIdFromUrl || undefined), fetchTeamMembers()]).finally(() => {
      setIsLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      if (socket) {
        socket.emit('join_conversation', activeConv.id);
      }
    }
  }, [activeConv?.id]);

  // Socket listener for new message
  useEffect(() => {
    if (!socket) return;
    socket.on('new_message', (msg: any) => {
      if (msg.conversationId === activeConv?.id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
      }
    });

    socket.on('announcement_published', (ann: Announcement) => {
      setAnnouncements((prev) => [ann, ...prev]);
    });

    return () => {
      socket.off('new_message');
      socket.off('announcement_published');
    };
  }, [socket, activeConv?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConv) return;

    try {
      const { data } = await api.post('/messages', {
        conversationId: activeConv.id,
        text: newMessageText,
      });
      setMessages((prev) => [...prev, data]);
      setNewMessageText('');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleStartDirectChat = async (targetUser: User) => {
    try {
      setIsStartingChat(true);
      const res = await api.post('/messages/direct', { targetUserId: targetUser.id });
      const newConv = res.data;
      await fetchConversations(newConv.id);
      setActiveConv(newConv);
      setActiveTab('channels');
      setIsNewChatModalOpen(false);
    } catch (err) {
      console.error('Failed to start direct conversation:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.post(`/announcements/${id}/acknowledge`, {});
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const filteredTeam = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    m.designation?.toLowerCase().includes(teamSearch.toLowerCase()) ||
    m.department?.name?.toLowerCase().includes(teamSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-pink-400" />
            Communications & Broadcast Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time project chats, direct staff communication, and executive broadcast directives
          </p>
        </div>

        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-950/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Start Direct Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'broadcasts'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          CEO Executive Directives ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'channels'
              ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Channels & Direct Chats ({conversations.length})
        </button>
      </div>

      {/* Tab 1: CEO Broadcast Directives */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No executive broadcasts issued.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => {
                const isAck = ann.receipts?.[0]?.isAcknowledged;

                return (
                  <div
                    key={ann.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={ann.sender?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                          alt=""
                          className="w-10 h-10 rounded-2xl object-cover border border-amber-500/30 shadow-md"
                        />
                        <div>
                          <h3 className="text-base font-bold text-white">{ann.title}</h3>
                          <div className="text-xs text-slate-400">
                            Issued by <strong className="text-slate-200">{ann.sender?.name}</strong> •{' '}
                            <span className="font-mono">{new Date(ann.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                        Priority: {ann.priority}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                      {ann.message}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Target Audience: <strong className="text-slate-200">{ann.audience}</strong>
                      </span>

                      {isAck ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <CheckCheck className="w-4 h-4" /> Acknowledged by you
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(ann.id)}
                          className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                        >
                          Acknowledge Directive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Project Channels & Direct Chats */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden min-h-[550px]">
          {/* Channels Sidebar */}
          <div className="border-r border-slate-800 p-3 space-y-2 bg-slate-950/40">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Chats ({conversations.length})
              </span>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="text-[10px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[480px]">
              {conversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                const isDirect = c.type === 'DIRECT';

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConv(c)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand-600/20 text-brand-300 font-semibold border border-brand-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
                      {isDirect ? (
                        <Users className="w-4 h-4 text-pink-400" />
                      ) : (
                        <FolderKanban className="w-4 h-4 text-brand-400" />
                      )}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-bold text-slate-200 truncate">
                        {c.title || c.project?.name || 'Channel'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {c.messages?.[0]?.text || 'No messages yet'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Feed */}
          <div className="lg:col-span-3 flex flex-col justify-between p-4 h-[550px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No conversation history in this channel. Send a message to start collaboration.
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 max-w-[80%] ${isMine ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <img
                        src={m.sender?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60'}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          isMine
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] opacity-90">{m.sender?.name}</span>
                          <span className="text-[9px] opacity-70 font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type a message to team..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-950/40"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Start Direct Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">Start Direct Peer-to-Peer Chat</h3>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search staff by name or role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Team Members List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredTeam.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No team members found</div>
              ) : (
                filteredTeam.map((m) => (
                  <button
                    key={m.id}
                    disabled={isStartingChat}
                    onClick={() => handleStartDirectChat(m)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60'}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-xs text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.designation || m.role?.name || 'Team Member'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-pink-400 font-semibold px-2 py-1 bg-pink-500/10 rounded-lg border border-pink-500/20">
                      Message
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

