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
        console.log("🔌 Starte Verbindung zum Backend...");
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            console.log("✅ WebSocket verbunden");
            setIsConnected(true);
            setLogs(prev => [...prev, "✅ Mit Backend verbunden"]);
        };

        ws.current.onclose = () => {
            console.log("❌ WebSocket getrennt");
            setIsConnected(false);
            setLogs(prev => [...prev, "❌ Verbindung getrennt"]);
        };

        ws.current.onmessage = (event) => {
            console.log("📩 Nachricht empfangen:", event.data);
            setLogs(prev => [...prev, event.data]);

            const message = event.data;

            if (message.includes("bereit") || message.includes("Aufheizen abgeschlossen")) {
                setIsReady(true);
                setIsBrewing(false);
            }
            if (message.includes("heizt") || message.includes("aufheizen") || message.includes("Aufheizen")) {
                setIsReady(false);
            }
            if (message.includes("ausgeschaltet")) {
                setIsOn(false);
                setIsReady(false);
                setIsBrewing(false);
            }
            if (message.includes("eingeschaltet")) {
                setIsOn(true);
                setIsReady(false);
            }
            if (message.includes("Kaffee fertig") || message.includes("Brühen abgeschlossen")) {
                setIsBrewing(false);
                setIsReady(true);
            }
            if (message.includes("Warten")) {
                setIsReady(true);
                setIsBrewing(false);
            }
            if (message.includes("Brühen") || message.includes("Mahlen") || message.includes("Pressen")) {
                setIsBrewing(true);
                setIsReady(false);
            }
        };

        ws.current.onerror = (err) => {
            console.error("⚠️ WebSocket Fehler:", err);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const send = (msg: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("📤 Sende Nachricht:", msg);
            ws.current.send(msg);
        } else {
            console.warn("⚠️ Nachricht konnte nicht gesendet werden (keine Verbindung):", msg);
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
    if (!ctx) throw new Error("useWebSocket muss innerhalb von WebSocketProvider genutzt werden!");
    return ctx;
};