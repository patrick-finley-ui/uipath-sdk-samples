import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { UiPath } from '@uipath/uipath-typescript';
import { useClaimsAssistantChat } from '../../hooks/useClaimsAssistantChat';

interface ClaimsAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sdk: UiPath | null;
  agentId: number;
  folderId: number;
  title: string;
}

const getConnectionStatusStyle = (status: string): string => {
  if (status === 'Connected') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }

  if (status === 'Connecting') {
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  }

  return 'bg-gray-100 text-gray-600 border border-gray-200';
};

export const ClaimsAssistantPanel = ({
  isOpen,
  onClose,
  sdk,
  agentId,
  folderId,
  title,
}: ClaimsAssistantPanelProps) => {
  const [draftMessage, setDraftMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    messages,
    isInitializing,
    isSessionReady,
    isStreaming,
    connectionStatus,
    error,
    initialize,
    sendMessage,
    endSession,
    clearError,
    cleanup,
  } = useClaimsAssistantChat({
    sdk,
    agentId,
    folderId,
  });

  useEffect(() => {
    if (isOpen) {
      void initialize();
      return;
    }

    endSession();
  }, [endSession, initialize, isOpen]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isStreaming, messages]);

  const handleSend = async () => {
    const text = draftMessage.trim();
    if (!text || isInitializing || isStreaming) {
      return;
    }

    setDraftMessage('');
    await sendMessage(text);
  };

  const handleInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const panelStatusLabel = isInitializing
    ? 'Initializing'
    : isStreaming
      ? 'Streaming'
      : isSessionReady
        ? 'Ready'
        : connectionStatus;

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ${
        isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConnectionStatusStyle(connectionStatus)}`}>
              {panelStatusLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
          aria-label="Close chat"
          title="Close (ESC)"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <div className="flex items-start justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
                aria-label="Dismiss chat error"
                title="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {messages.length === 0 && !error && (
          <div className="h-full flex items-center justify-center text-center text-sm text-gray-500 px-4">
            <div>
              <p className="font-medium text-gray-700 mb-1">Ask the Claims Assistant anything about this claim.</p>
              <p>Conversation starts when you send your first message.</p>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  isUser ? 'bg-uipath-orange text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content || (message.isStreaming ? '...' : '')}
                  {message.isStreaming && (
                    <span className="inline-block ml-1 h-4 w-1 bg-current align-[-2px] animate-pulse rounded-sm" />
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-3 rounded-b-lg">
        <div className="flex items-end gap-2">
          <textarea
            value={draftMessage}
            onChange={(event) => setDraftMessage(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a message..."
            rows={2}
            disabled={isInitializing || !sdk}
            className="flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-uipath-orange/40 focus:border-uipath-orange disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draftMessage.trim() || isInitializing || isStreaming || !sdk}
            className="inline-flex items-center justify-center rounded-lg bg-uipath-orange px-3 py-2 text-sm font-medium text-white hover:bg-uipath-orange-light disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Press Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
};
