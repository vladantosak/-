import { useEffect, useRef, useState } from 'react';
import { Order, ChatMessage } from '../types';
import { getAuthToken } from '../lib/api';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface UseWebSocketOptions {
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onMessage?: (message: ChatMessage) => void;
  onWalletUpdated?: (data: { userId: string; balance: number; reservedBalance: number }) => void;
  onVerificationReviewed?: (verification: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    let isUnmounted = false;

    function connect() {
      if (typeof window === 'undefined' || isUnmounted) return;

      if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const token = getAuthToken();
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
      const wsUrl = `${protocol}//${window.location.host}/ws${tokenParam}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          const curToken = getAuthToken();
          if (curToken) {
            try {
              ws.send(JSON.stringify({ type: 'auth', token: curToken }));
            } catch {
              // ignore
            }
          }
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            const { type, payload } = data;

            switch (type) {
              case 'authenticated':
                setIsAuthenticated(true);
                break;
              case 'order_created':
                options.onOrderCreated?.(payload);
                break;
              case 'order_updated':
              case 'order_accepted':
              case 'receipt_uploaded':
              case 'order_completed':
              case 'order_disputed':
              case 'order_canceled':
                options.onOrderUpdated?.(payload);
                break;
              case 'chat_message':
              case 'new_message':
                options.onMessage?.(payload);
                break;
              case 'wallet_updated':
                options.onWalletUpdated?.(payload);
                break;
              case 'verification_updated':
              case 'verification_reviewed':
                options.onVerificationReviewed?.(payload);
                break;
              default:
                break;
            }
          } catch (e) {
            console.warn('[WS] Parse message warning:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setIsAuthenticated(false);
          if (socketRef.current === ws) {
            socketRef.current = null;
          }
          if (!reconnectTimeoutRef.current && !isUnmounted) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connect();
            }, 3000);
          }
        };

        ws.onerror = () => {
          // Standard browser WebSocket error event has isTrusted:true without details.
          // The browser automatically invokes onclose immediately following onerror.
        };
      } catch (err) {
        if (!reconnectTimeoutRef.current && !isUnmounted) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const authenticate = (token: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: 'auth', token }));
      } catch {
        // Will authenticate on next open
      }
    }
  };

  return { isConnected, isAuthenticated, authenticate };
}
