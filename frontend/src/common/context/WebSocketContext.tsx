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

            // CSV-Format: "Status,temp,water_ok,grounds_ok,water_flow,date"
            const parts = message.split(",");
            const status = parts[0];

            // Maschine ausgeschaltet - HÖCHSTE PRIORITÄT
            if (status.toLowerCase().includes("ausgeschaltet")) {
                setIsOn(false);
                setIsReady(false);
                setIsBrewing(false);
                return;
            }

            // Kühlt ab - läuft im Hintergrund, Frontend bleibt "ausgeschaltet"
            if (status.toLowerCase().includes("abkühlen")) {
                // Status bleibt ausgeschaltet im Frontend
                setIsOn(false);
                setIsReady(false);
                setIsBrewing(false);
                return;
            }

            setIsOn(prevIsOn => {
                if (status.toLowerCase().includes("aufheizen")) {
                    setIsReady(false);
                    setIsBrewing(false);
                    return true;
                }
                if (status.toLowerCase().includes("warten") && prevIsOn) {
                    setIsReady(true);
                    setIsBrewing(false);
                    return true;
                }
                if (status.toLowerCase().includes("brühen") ||
                    status.toLowerCase().includes("mahlen") ||
                    status.toLowerCase().includes("pressen") ||
                    status.toLowerCase().includes("anfeuchten") ||
                    status.toLowerCase().includes("zur_startposition")) {
                    setIsBrewing(true);
                    setIsReady(false);
                    return true;
                }

                // Fehler
                if (status.toLowerCase().includes("wasser leer") ||
                    status.toLowerCase().includes("kaffeesatz voll")) {
                    setIsBrewing(false);
                    setIsReady(false);
                    return true;
                }
                // Wartung
                if (status.toLowerCase().includes("wasser aufgefüllt") ||
                    status.toLowerCase().includes("kaffeesatz geleert")) {
                    setIsReady(true);
                    setIsBrewing(false);
                    return true;
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