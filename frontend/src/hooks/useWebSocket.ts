"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export type WebSocketMessage = {
  type: "link_created" | "link_updated" | "link_deleted";
  data: any;
};

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(groupId: string | null) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!groupId) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        console.error("No access token available");
        setStatus("error");
        return;
      }

      // Determine WebSocket URL based on environment
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const apiHost =
        process.env.NODE_ENV === "production"
          ? "coveapi.egeuysal.com"
          : "localhost:8080";
      const wsUrl = `${wsProtocol}//${apiHost}/v1/ws?token=${encodeURIComponent(session.access_token)}`;

      console.log("Connecting to WebSocket");
      setStatus("connecting");

      // Create WebSocket connection with auth token in URL
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("connected");
        reconnectAttemptsRef.current = 0;

        // Send authentication and subscribe to group
        ws.send(
          JSON.stringify({
            type: "subscribe",
            groupId: groupId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log("WebSocket message received:", message);
          setLastMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setStatus("error");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus("disconnected");
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setStatus("error");
    }
  }, [groupId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  useEffect(() => {
    if (groupId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [groupId, connect, disconnect]);

  return {
    status,
    lastMessage,
    sendMessage,
    reconnect: connect,
  };
}
