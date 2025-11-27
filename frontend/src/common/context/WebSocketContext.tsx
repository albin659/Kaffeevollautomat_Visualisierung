import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { CoffeeEntry } from "../models/ICoffee";



interface IWebSocketContext {
    send: (msg: string) => void;                    // Funktion zum Senden von Nachrichten ans Backend
    isConnected: boolean;
    isOn: boolean;
    isReady: boolean;
    isBrewing: boolean;
    logs: string[];
    coffeeHistory: CoffeeEntry[];
    setIsOn: (v: boolean) => void;
    setIsReady: (v: boolean) => void;
    setIsBrewing: (v: boolean) => void;
    addCoffeeToHistory: (entry: CoffeeEntry) => void;
    requestHistoryUpdate: () => void;
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const lastBrewingState = useRef(false);

    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isOn, setIsOn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isBrewing, setIsBrewing] = useState(false);
    const [coffeeHistory, setCoffeeHistory] = useState<CoffeeEntry[]>([]);


    // useEffect überwacht isBrewing und lädt History neu, wenn Brühvorgang endet
    useEffect(() => {
        if (lastBrewingState.current === true && isBrewing === false) {
            console.log("Brühvorgang beendet - lade History neu");


            setTimeout(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    console.log("Fordere Coffee History vom Backend an (nach Brühvorgang)");
                    ws.current.send("6"); // Command 6 = History abrufen
                }
            }, 1000);
        }

        // Aktuellen Zustand für den nächsten Vergleich speichern
        lastBrewingState.current = isBrewing;
    }, [isBrewing]); // Dieser Effect läuft jedes Mal, wenn sich isBrewing ändert

    useEffect(() => {
        console.log("Verbindungsaufbau...");
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            console.log("WebSocket verbunden");
            setIsConnected(true);
            setLogs(prev => [...prev, "Mit Backend verbunden"]);

            setTimeout(() => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    console.log("📥 Fordere Coffee History vom Backend an");
                    ws.current.send("6"); // Command 6 = History abrufen
                }
            }, 500);
        };

        ws.current.onclose = () => {
            console.log("❌ WebSocket getrennt");
            setIsConnected(false);

            setIsOn(false);
            setIsReady(false);
            setIsBrewing(false);
            setLogs(prev => [...prev, "Verbindung getrennt"]);
        };

        // onmessage - Wird aufgerufen, wenn Nachricht vom Backend kommt
        ws.current.onmessage = (event) => {
            const message = event.data;
            console.log("Nachricht empfangen:", message);

            // TEIL 1: JSON-Nachrichten verarbeiten (Coffee History)
            if (message.startsWith('{')) {
                try {
                    // JSON-String in JavaScript-Objekt umwandeln
                    const data = JSON.parse(message);


                    if (data.type === "coffee_history" && Array.isArray(data.data)) {
                        console.log("Coffee History vom Backend erhalten:", data.data.length, "Einträge");

                        const formattedHistory: CoffeeEntry[] = data.data.map((item: any) => ({
                            id: item.id || Date.now(),
                            type: item.type || "Unbekannt",
                            strength: item.strength || 3,
                            createdDate: item.createdDate || new Date().toISOString()
                        }));

                        formattedHistory.sort((a, b) =>
                            new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
                        );

                        setCoffeeHistory(formattedHistory);
                        console.log("Coffee History aktualisiert:", formattedHistory.length, "Einträge");

                        return;
                    }
                } catch (err) {
                    console.error("Fehler beim Parsen der JSON-Nachricht:", err);
                }
            }

            // TEIL 2: CSV-Status-Nachrichten verarbeiten
            setLogs(prev => [...prev, message]);
            const parts = message.split(",");
            const status = parts[0];

            // SPEZIALFALL 1: Maschine ausgeschaltet
            if (status.toLowerCase().includes("ausgeschaltet")) {
                setIsOn(false);
                setIsReady(false);
                setIsBrewing(false);
                return; // Funktion beenden
            }

            // SPEZIALFALL 2: Maschine kühlt ab
            if (status.toLowerCase().includes("abkühlen")) {
                setIsOn(false);
                setIsReady(false);
                setIsBrewing(false);
                return;
            }

            // STATUS-VERARBEITUNG
            setIsOn(prevIsOn => {
                // STATUS: Aufheizen
                if (status.toLowerCase().includes("aufheizen")) {
                    setIsReady(false);
                    setIsBrewing(false);
                    return true;         // Maschine ist eingeschaltet
                }

                // STATUS: Warten
                if (status.toLowerCase().includes("warten") && prevIsOn) {
                    setIsReady(true);
                    setIsBrewing(false);
                    return true;         // Maschine bleibt an
                }

                // STATUS: Brühvorgang läuft
                if (status.toLowerCase().includes("brühen") ||
                    status.toLowerCase().includes("mahlen") ||
                    status.toLowerCase().includes("pressen") ||
                    status.toLowerCase().includes("anfeuchten") ||
                    status.toLowerCase().includes("zur_startposition")) {
                    setIsBrewing(true);
                    setIsReady(false);
                    return true;         // Maschine ist an
                }

                // STATUS: Fehler (Wasser leer oder Kaffeesatz voll)
                if (status.toLowerCase().includes("wasser leer") ||
                    status.toLowerCase().includes("kaffeesatz voll")) {
                    setIsBrewing(false);
                    setIsReady(false);
                    return true;         // Maschine ist noch an
                }

                // STATUS: Wartung (Wasser aufgefüllt oder Kaffeesatz geleert)
                if (status.toLowerCase().includes("wasser aufgefüllt") ||
                    status.toLowerCase().includes("kaffeesatz geleert")) {
                    setIsReady(true);
                    setIsBrewing(false);
                    return true;         // Maschine ist an
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

    }, []); // läuft nur beim ersten Render

    const send = (msg: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("📤 Sende Nachricht:", msg);
            ws.current.send(msg); // Nachricht über WebSocket senden
        } else {
            console.warn("⚠️ Keine Verbindung – Nachricht nicht gesendet:", msg);
        }
    };

    const addCoffeeToHistory = (entry: CoffeeEntry) => {
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

        // Ans Backend senden
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const coffeeData = {
                id: entry.id,
                type: entry.type,
                strength: entry.strength,
                createdDate: entry.createdDate
            };

            // JSON.stringify() wandelt JavaScript-Objekt in JSON-String um
            ws.current.send(JSON.stringify(coffeeData));
            console.log("✅ Kaffee an Backend gesendet:", coffeeData);
        } else {
            console.warn("⚠️ Konnte Kaffee nicht an Backend senden - keine Verbindung");
        }
    };

    const requestHistoryUpdate = () => {
        console.log("🔄 History-Update vom Backend angefordert");
        send("6"); // Command 6 = "Sende mir die komplette Coffee History"
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