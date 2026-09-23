import React, { useEffect, useState } from 'react';
import { MessageSquare, ArrowRight, X, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

interface MessageAlertModalProps {
  onNavigate: (path: string) => void;
  onOpenConversation?: (convId: string) => void;
}

interface AlertMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  text: string;
  conversationTitle?: string;
  conversationId: string;
  timestamp: string;
}

export const MessageAlertModal: React.FC<MessageAlertModalProps> = ({ onNavigate, onOpenConversation }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [currentAlert, setCurrentAlert] = useState<AlertMessage | null>(null);
  const [lastMsgId, setLastMsgId] = useState<string | null>(null);

  // Handle incoming message event from socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleGlobalMessage = (payload: any) => {
      const msg = payload.message || payload;
      const convId = payload.conversationId || msg.conversationId;

      // Ignore our own messages
      if (msg.senderId === user.id || msg.sender?.id === user.id) return;

      const alert: AlertMessage = {
        id: msg.id,
        senderName: msg.sender?.name || 'Team Member',
        senderRole: msg.sender?.designation || msg.sender?.role?.name || 'Colleague',
        senderAvatar: msg.sender?.avatarUrl,
        text: msg.text || '',
        conversationTitle: payload.title || 'Team Channel',
        conversationId: convId,
        timestamp: new Date().toISOString(),
      };

      setLastMsgId(msg.id);
      setCurrentAlert(alert);
    };

    socket.on('new_message_global', handleGlobalMessage);
    socket.on('new_message', handleGlobalMessage);

    return () => {
      socket.off('new_message_global', handleGlobalMessage);
      socket.off('new_message', handleGlobalMessage);
    };
  }, [socket, user]);

  // Polling fallback to check for recent unread direct messages (every 25 seconds)
  useEffect(() => {
    if (!user) return;

    const checkRecentMessages = async () => {
      try {
        const res = await api.get<any[]>('/messages/conversations');
        if (res.data && res.data.length > 0) {
          const convWithRecentMsg = res.data.find(
            (c) => c.messages && c.messages.length > 0 && c.messages[0].senderId !== user.id
          );

          if (convWithRecentMsg) {
            const topMsg = convWithRecentMsg.messages[0];
            const msgTime = new Date(topMsg.createdAt).getTime();
            const now = Date.now();

            // Only trigger if message is within the last 45 seconds and hasn't been shown
            if (now - msgTime < 45000 && topMsg.id !== lastMsgId) {
              const dismissed = sessionStorage.getItem(`dismissed_msg_${topMsg.id}`);
              if (!dismissed) {
                setLastMsgId(topMsg.id);
                setCurrentAlert({
                  id: topMsg.id,
                  senderName: topMsg.sender?.name || 'Team Member',
                  senderRole: 'Colleague',
                  senderAvatar: topMsg.sender?.avatarUrl,
                  text: topMsg.text,
                  conversationTitle: convWithRecentMsg.title || convWithRecentMsg.project?.name || 'Direct Chat',
                  conversationId: convWithRecentMsg.id,
                  timestamp: topMsg.createdAt,
                });
              }
            }
          }
        }
      } catch (err) {
        // Silently catch polling error
      }
    };

    const interval = setInterval(checkRecentMessages, 25000);
    return () => clearInterval(interval);
  }, [user, lastMsgId]);

  if (!currentAlert) return null;

  const handleDismiss = () => {
    if (currentAlert) {
      sessionStorage.setItem(`dismissed_msg_${currentAlert.id}`, 'true');
    }
    setCurrentAlert(null);
  };

  const handleOpenChat = () => {
    if (currentAlert) {
      sessionStorage.setItem(`dismissed_msg_${currentAlert.id}`, 'true');
      const convId = currentAlert.conversationId;
      setCurrentAlert(null);
      if (onOpenConversation) {
        onOpenConversation(convId);
      }
      onNavigate(`/messages?convId=${convId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-pink-500/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-pink-950/50 space-y-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
              New Message Alert
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Info */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
          {currentAlert.senderAvatar ? (
            <img
              src={currentAlert.senderAvatar}
              alt=""
              className="w-12 h-12 rounded-2xl object-cover border border-pink-500/30 shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md">
              <User className="w-6 h-6" />
            </div>
          )}

          <div>
            <h4 className="text-base font-bold text-white leading-tight">{currentAlert.senderName}</h4>
            <p className="text-xs text-slate-400">{currentAlert.senderRole}</p>
            {currentAlert.conversationTitle && (
              <span className="text-[10px] text-pink-300/80 font-mono mt-0.5 block">
                Channel: {currentAlert.conversationTitle}
              </span>
            )}
          </div>
        </div>

        {/* Message Snippet */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-slate-200 text-sm leading-relaxed max-h-32 overflow-y-auto">
          "{currentAlert.text}"
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            Dismiss
          </button>

          <button
            onClick={handleOpenChat}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Open & Reply</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
