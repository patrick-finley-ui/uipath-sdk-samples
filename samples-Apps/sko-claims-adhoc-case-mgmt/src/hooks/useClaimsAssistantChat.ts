import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UiPath } from '@uipath/uipath-typescript';
import {
  ConversationalAgent,
  MessageRole,
  type ConversationGetResponse,
  type SessionStream,
} from '@uipath/uipath-typescript/conversational-agent';

type ClaimsAssistantMessageRole = 'user' | 'assistant' | 'system';

export interface ClaimsAssistantMessage {
  id: string;
  role: ClaimsAssistantMessageRole;
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

interface UseClaimsAssistantChatOptions {
  sdk: UiPath | null;
  agentId: number;
  folderId: number;
}

interface UseClaimsAssistantChatResult {
  messages: ClaimsAssistantMessage[];
  isInitializing: boolean;
  isSessionReady: boolean;
  isStreaming: boolean;
  connectionStatus: string;
  error: string | null;
  initialize: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endSession: () => void;
  clearError: () => void;
  cleanup: () => void;
}

const createEventId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

export const useClaimsAssistantChat = ({
  sdk,
  agentId,
  folderId,
}: UseClaimsAssistantChatOptions): UseClaimsAssistantChatResult => {
  const [messages, setMessages] = useState<ClaimsAssistantMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);

  const conversationalAgent = useMemo(() => {
    if (!sdk) {
      return null;
    }
    return new ConversationalAgent(sdk);
  }, [sdk]);

  const conversationRef = useRef<ConversationGetResponse | null>(null);
  const sessionRef = useRef<SessionStream | null>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  const exchangeAssistantMessageMapRef = useRef<Map<string, string>>(new Map());
  const sessionCleanupHandlersRef = useRef<Array<() => void>>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSessionHandlers = useCallback(() => {
    for (const cleanup of sessionCleanupHandlersRef.current) {
      cleanup();
    }
    sessionCleanupHandlersRef.current = [];
  }, []);

  const markAssistantMessageComplete = useCallback((assistantMessageId: string) => {
    setMessages((previousMessages) =>
      previousMessages.map((message) => {
        if (message.id !== assistantMessageId) {
          return message;
        }

        return {
          ...message,
          isStreaming: false,
        };
      })
    );
  }, []);

  const registerSessionHandlers = useCallback(
    (session: SessionStream) => {
      clearSessionHandlers();
      const cleanupHandlers: Array<() => void> = [];

      cleanupHandlers.push(
        session.onSessionStarted(() => {
          setIsSessionReady(true);
          setIsInitializing(false);
        })
      );

      cleanupHandlers.push(
        session.onSessionEnd(() => {
          setIsSessionReady(false);
          setIsStreaming(false);
          exchangeAssistantMessageMapRef.current.clear();
          sessionRef.current = null;
        })
      );

      cleanupHandlers.push(
        session.onErrorStart((sessionError) => {
          setError(sessionError.message || 'Claims Assistant session error.');
          setIsStreaming(false);
        })
      );

      cleanupHandlers.push(
        session.onExchangeStart((exchange) => {
          const assistantMessageId = exchangeAssistantMessageMapRef.current.get(exchange.exchangeId);
          if (!assistantMessageId) {
            return;
          }

          exchange.onMessageStart((message) => {
            if (!message.isAssistant) {
              return;
            }

            message.onContentPartStart((contentPart) => {
              if (!(contentPart.isText || contentPart.isMarkdown || contentPart.isHtml)) {
                return;
              }

              contentPart.onChunk((chunk) => {
                const chunkData = chunk.data ?? '';
                if (!chunkData) {
                  return;
                }

                setMessages((previousMessages) =>
                  previousMessages.map((existingMessage) => {
                    if (existingMessage.id !== assistantMessageId) {
                      return existingMessage;
                    }

                    return {
                      ...existingMessage,
                      content: `${existingMessage.content}${chunkData}`,
                      isStreaming: true,
                    };
                  })
                );
              });

              contentPart.onCompleted(() => {
                markAssistantMessageComplete(assistantMessageId);
              });
            });

            message.onCompleted(() => {
              markAssistantMessageComplete(assistantMessageId);
            });
          });

          exchange.onExchangeEnd(() => {
            exchangeAssistantMessageMapRef.current.delete(exchange.exchangeId);
            markAssistantMessageComplete(assistantMessageId);
            setIsStreaming(false);
          });

          exchange.onErrorStart((exchangeError) => {
            exchangeAssistantMessageMapRef.current.delete(exchange.exchangeId);
            setError(exchangeError.message || 'Claims Assistant exchange error.');
            setIsStreaming(false);
            setMessages((previousMessages) =>
              previousMessages.map((existingMessage) => {
                if (existingMessage.id !== assistantMessageId) {
                  return existingMessage;
                }

                return {
                  ...existingMessage,
                  content:
                    existingMessage.content ||
                    'Unable to retrieve a response from the Claims Assistant.',
                  isStreaming: false,
                };
              })
            );
          });
        })
      );

      sessionCleanupHandlersRef.current = cleanupHandlers;
    },
    [clearSessionHandlers, markAssistantMessageComplete]
  );

  const endSession = useCallback(() => {
    try {
      conversationRef.current?.endSession();
    } catch (sessionEndError) {
      const errorMessage =
        sessionEndError instanceof Error ? sessionEndError.message : 'Failed to end session.';
      setError(errorMessage);
    } finally {
      clearSessionHandlers();
      exchangeAssistantMessageMapRef.current.clear();
      sessionRef.current = null;
      setIsSessionReady(false);
      setIsStreaming(false);
    }
  }, [clearSessionHandlers]);

  const initialize = useCallback(async (): Promise<void> => {
    if (!conversationalAgent) {
      const initializationError = 'UiPath SDK is not initialized.';
      setError(initializationError);
      throw new Error(initializationError);
    }

    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    if (sessionRef.current && !sessionRef.current.ended) {
      setIsSessionReady(true);
      return Promise.resolve();
    }

    setIsInitializing(true);
    setError(null);

    const initializePromise = (async () => {
      if (!conversationRef.current) {
        conversationRef.current = await conversationalAgent.conversations.create(agentId, folderId, {
          autogenerateLabel: true,
        });
      }

      const existingSession = conversationRef.current.getSession();
      const shouldWaitForSessionStart = !existingSession || existingSession.ended;
      const session = shouldWaitForSessionStart
        ? conversationRef.current.startSession({ echo: true })
        : existingSession;

      sessionRef.current = session;
      registerSessionHandlers(session);

      if (!shouldWaitForSessionStart) {
        setIsSessionReady(true);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const removeStartedHandler = session.onSessionStarted(() => {
          if (settled) {
            return;
          }
          settled = true;
          removeStartedHandler();
          removeErrorHandler();
          resolve();
        });

        const removeErrorHandler = session.onErrorStart((sessionError) => {
          if (settled) {
            return;
          }
          settled = true;
          removeStartedHandler();
          removeErrorHandler();
          reject(
            new Error(sessionError.message || 'Unable to initialize Claims Assistant session.')
          );
        });
      });
    })();

    initializationPromiseRef.current = initializePromise
      .catch((initializationError) => {
        const errorMessage =
          initializationError instanceof Error
            ? initializationError.message
            : 'Failed to initialize Claims Assistant.';
        setError(errorMessage);
        throw initializationError;
      })
      .finally(() => {
        initializationPromiseRef.current = null;
        setIsInitializing(false);
      });

    return initializationPromiseRef.current;
  }, [agentId, conversationalAgent, folderId, registerSessionHandlers]);

  const sendMessage = useCallback(
    async (text: string): Promise<void> => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        return;
      }

      setError(null);
      const userMessageId = createEventId('user');
      const assistantMessageId = createEventId('assistant');

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: userMessageId,
          role: 'user',
          content: trimmedText,
          createdAt: new Date(),
        },
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
          isStreaming: true,
        },
      ]);
      setIsStreaming(true);

      let exchangeId: string | null = null;

      try {
        await initialize();

        const activeSession = sessionRef.current;
        if (!activeSession) {
          throw new Error('Claims Assistant session is unavailable.');
        }

        exchangeId = createEventId('exchange');
        exchangeAssistantMessageMapRef.current.set(exchangeId, assistantMessageId);

        const exchange = activeSession.startExchange({ exchangeId });
        await exchange.sendMessageWithContentPart({
          data: trimmedText,
          role: MessageRole.User,
        });
      } catch (sendError) {
        if (exchangeId) {
          exchangeAssistantMessageMapRef.current.delete(exchangeId);
        }

        const errorMessage =
          sendError instanceof Error ? sendError.message : 'Failed to send message.';

        setMessages((previousMessages) =>
          previousMessages.map((existingMessage) => {
            if (existingMessage.id !== assistantMessageId) {
              return existingMessage;
            }

            return {
              ...existingMessage,
              content: existingMessage.content || `Unable to send message: ${errorMessage}`,
              isStreaming: false,
            };
          })
        );

        setIsStreaming(false);
        setError(errorMessage);
      }
    },
    [initialize]
  );

  const cleanup = useCallback(() => {
    endSession();
    clearSessionHandlers();
    initializationPromiseRef.current = null;
  }, [clearSessionHandlers, endSession]);

  useEffect(() => {
    if (!conversationalAgent) {
      setConnectionStatus('Disconnected');
      return undefined;
    }

    return conversationalAgent.onConnectionStatusChanged(
      (status: string, connectionError: Error | null) => {
        setConnectionStatus(status);
        if (connectionError) {
          setError(connectionError.message);
        }
      }
    );
  }, [conversationalAgent]);

  return {
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
  };
};
