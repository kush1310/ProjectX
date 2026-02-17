import { useEffect, useRef, useState, useCallback } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";

export const useWebSocket = (url: string = "http://localhost:8080/ws") => {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws", // Native WebSocket URL
      // If using SockJS (which we enabled in backend configs with .withSockJS())
      // stompjs v6+ usually prefers native WS.
      // But if we want SockJS fallback, we'd need a specific factory.
      // For this modern setup, let's try native WS first which usually works best.
      // If that fails, we can add SockJS factory locally.

      onConnect: () => {
        console.log("✅ WebSocket Connected");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("❌ WebSocket Disconnected");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      reconnectDelay: 5000,
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [url]);

  const subscribe = useCallback(
    (topic: string, callback: (message: any) => void) => {
      if (!clientRef.current || !isConnected) return null;

      return clientRef.current.subscribe(topic, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      });
    },
    [isConnected],
  );

  return { isConnected, subscribe };
};
