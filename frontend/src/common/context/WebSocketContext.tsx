import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const lastBrewingState = useRef(false);

    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isOn, setIsOn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isBrewing, setIsBrewing] = useState(false);
    const [coffeeHistory, setCoffeeHistory] = useState<ICoffee[]>([]);
    const [statusData, setStatusData] = useState<IStatusData | null>(null);

    // History nach Brühvorgang neu laden
    const reloadBrewing=()=>{
        if (lastBrewingState.current === true && isBrewing === false) {
            console.log("Brühvorgang beendet - lade History neu");
            setTimeout(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send("History");
                }
            }, 1000);
        }
        lastBrewingState.current = isBrewing;
    }

    useEffect(() => {
        reloadBrewing();
    }, [isBrewing]);

    useEffect(() => {
        console.log("Verbindungsaufbau zu WebSocket...");
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            console.log("WebSocket verbunden");
            setIsConnected(true);
            setLogs(prev => [...prev, "Mit Backend verbunden"]);

            // History initial anfordern
            setTimeout(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    console.log("Fordere Coffee History an");
                    ws.current.send("History");
                }
            }, 500);
        };

        ws.current.onclose = () => {
            console.log("WebSocket getrennt");
            setIsConnected(false);
            setIsOn(false);
            setIsReady(false);
            setIsBrewing(false);
            setLogs(prev => [...prev, "Verbindung getrennt"]);
        };

        ws.current.onmessage = (event) => {
            const message = event.data;
            console.log("Nachricht empfangen:", message);

            try {
                const data = JSON.parse(message);

                // Status-Update verarbeiten
                if (data.type === "status" && data.data) {
                    const status: IStatusData = data.data;
                    setStatusData(status);

                    // Log für Analytics erstellen (CSV-Format für Kompatibilität)
                    const logEntry = `${status.current_step},${status.temperature},${status.water_ok ? '1' : '0'},${status.grounds_ok ? '1' : '0'},${status.water_flow}`;
                    setLogs(prev => [...prev, logEntry]);

                    // Maschinen-Status aktualisieren
                    const step = status.current_step.toLowerCase();
                    setIsOn(status.powered_on);

                    // Brühvorgang erkennen
                    if (step.includes("mahlen") || step.includes("pressen") ||
                        step.includes("anfeuchten") || step.includes("brühen") ||
                        step.includes("zur startposition")) {
                        setIsBrewing(true);
                        setIsReady(false);
                    }
                    // Bereit-Status
                    else if (step.includes("warten") && status.powered_on) {
                        setIsReady(true);
                        setIsBrewing(false);
                    }
                    // Aufheizen
                    else if (step.includes("aufheizen")) {
                        setIsReady(false);
                        setIsBrewing(false);
                    }
                    // Abkühlen oder Fehler
                    else {
                        setIsReady(false);
                        if (step.includes("abkühlen")) {
                            setIsBrewing(false);
                        }
                    }

                    console.log(`Status: ${status.current_step} | An: ${status.powered_on} | Bereit: ${step.includes("warten") && status.powered_on} | Brüht: ${step.includes("brühen")}`);
                    return;
                }

                // Coffee History verarbeiten
                if (data.type === "coffee_history" && Array.isArray(data.data)) {
                    console.log("Coffee History erhalten:", data.data.length, "Einträge");

                    const formattedHistory: ICoffee[] = data.data.map((item: any) => ({
                        id: item.id || Date.now(),
                        type: item.type || "Unbekannt",
                        strength: item.strength || 3,
                        createdDate: item.createdDate || new Date().toISOString()
                    }));

                    formattedHistory.sort((a, b) =>
                        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
                    );

                    setCoffeeHistory(formattedHistory);
                    return;
                }

            } catch (err) {
                console.error("Fehler beim Parsen der JSON-Nachricht:", err);
            }
        };

        ws.current.onerror = (err) => {
            console.error("WebSocket Fehler:", err);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const send = (msg: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("Sende Nachricht:", msg);
            ws.current.send(msg);
        } else {
            console.warn("Keine Verbindung – Nachricht nicht gesendet:", msg);
        }
    };

    const addCoffeeToHistory = (entry: ICoffee) => {
        console.log("Neuer Kaffee wird zum Backend gesendet:", entry);

        setCoffeeHistory(prev => {
            const exists = prev.some(coffee => coffee.id === entry.id);
            if (exists) {
                console.log("Kaffee bereits vorhanden, überspringe");
                return prev;
            }

            const updated = [...prev, entry];
            console.log("Kaffee lokal hinzugefügt. Neue Anzahl:", updated.length);
            return updated;
        });

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const coffeeData = {
                id: entry.id,
                type: entry.type,
                strength: entry.strength,
                createdDate: entry.createdDate
            };

            ws.current.send(JSON.stringify(coffeeData));
            console.log("Kaffee an Backend gesendet:", coffeeData);
        } else {
            console.warn("Konnte Kaffee nicht an Backend senden - keine Verbindung");
        }
    };

    const requestHistoryUpdate = () => {
        console.log("History-Update vom Backend angefordert");
        send("History");
    };

    return (
        <WebSocketContext.Provider
            value={{
                send,
                addCoffeeToHistory,
                requestHistoryUpdate,
                setIsOn,
                setIsReady,
                setIsBrewing,
                isConnected,
                isOn,
                isReady,
                isBrewing,
                logs,
                coffeeHistory,
                statusData,
            }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) {
        throw new Error("useWebSocket muss in WebSocketProvider genutzt werden!");
    }
    return ctx;
};