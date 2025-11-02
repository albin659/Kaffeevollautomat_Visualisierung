import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface IWebSocketContext {
    send: (msg: string) => void;
    isConnected: boolean;
    isOn: boolean;
    isReady: boolean;
    isBrewing: boolean;
    logs: string[];
    setIsOn: (v: boolean) => void;
    setIsReady: (v: boolean) => void;
    setIsBrewing: (v: boolean) => void;
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isOn, setIsOn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isBrewing, setIsBrewing] = useState(false);

    useEffect(() => {
        console.log("🔌 Verbindungsaufbau...");
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            console.log("✅ WebSocket verbunden");
            setIsConnected(true);
            setLogs(prev => [...prev, "✅ Mit Backend verbunden"]);
        };

        ws.current.onclose = () => {
            console.log("❌ WebSocket getrennt");
            setIsConnected(false);
            setIsOn(false);
            setIsReady(false);
            setIsBrewing(false);
            setLogs(prev => [...prev, "❌ Verbindung getrennt"]);
        };

        ws.current.onmessage = (event) => {
            const message = event.data;
            console.log("📩 Nachricht empfangen:", message);
            setLogs(prev => [...prev, message]);

            setIsOn(prevIsOn => {
                // Maschine ausgeschaltet
                if (message.includes("ausgeschaltet")) {
                    setIsReady(false);
                    setIsBrewing(false);
                    return false;
                }

                // Maschine eingeschaltet
                if (message.includes("eingeschaltet")) {
                    setIsReady(false);
                    return true;
                }

                // Brüht oder Mahlprozess
                if (message.includes("Brühen") || message.includes("Mahlen") || message.includes("Pressen")) {
                    setIsBrewing(true);
                    setIsReady(false);
                }

                // Brühprozess fertig
                if (message.includes("Kaffee fertig") || message.includes("Brühen abgeschlossen")) {
                    setIsBrewing(false);
                    setIsReady(prevIsOn);
                }

                // Maschine ist bereit **nur wenn eingeschaltet**
                if ((message.includes("bereit") || message.includes("Aufheizen abgeschlossen")) && prevIsOn) {
                    setIsReady(true);
                    setIsBrewing(false);
                }

                return prevIsOn;
            });
        };

        ws.current.onerror = (err) => {
            console.error("⚠️ WebSocket Fehler:", err);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const send = (msg: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("📤 Sende Nachricht:", msg);
            ws.current.send(msg);
        } else {
            console.warn("⚠️ Keine Verbindung – Nachricht nicht gesendet:", msg);
        }
    };

    return (
        <WebSocketContext.Provider
            value={{ send, isConnected, isOn, isReady, isBrewing, logs, setIsOn, setIsReady, setIsBrewing }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) throw new Error("useWebSocket muss in WebSocketProvider genutzt werden!");
    return ctx;
};
