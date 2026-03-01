import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8765";
const HISTORY_RELOAD_DELAY = 1000;
const HISTORY_INITIAL_DELAY = 500;

const BREWING_STEPS = ["Grind", "Press", "Moisten", "Brew", "ToStartposition"];

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ws = useRef<WebSocket | null>(null);
    const lastBrewingState = useRef(false);

    const [isConnected, setIsConnected] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isOn, setIsOn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isBrewing, setIsBrewing] = useState(false);
    const [isResting, setIsResting] = useState(false);
    const [coffeeHistory, setCoffeeHistory] = useState<ICoffee[]>([]);
    const [statusData, setStatusData] = useState<IStatusData | null>(null);

    const send = (msg: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(msg);
        }
    };

    const reloadBrewingHistory = () => {
        if (lastBrewingState.current && !isBrewing) {
            setTimeout(() => send("History"), HISTORY_RELOAD_DELAY);
        }
        lastBrewingState.current = isBrewing;
    };

    useEffect(() => {
        reloadBrewingHistory();
    }, [isBrewing]);

    const handleStatusMessage = (status: IStatusData) => {
        setStatusData(status);

        const logEntry = `${status.current_step},${status.temperature},${status.water_ok ? "1" : "0"},${status.grounds_ok ? "1" : "0"},${status.water_flow}`;
        setLogs((prev) => [...prev, logEntry]);

        const step = status.current_step;
        setIsOn(status.powered_on);

        if (BREWING_STEPS.includes(step)) {
            setIsBrewing(true);
            setIsReady(false);
            setIsResting(false);
        } else if (step === "Waiting") {
            setIsReady(status.powered_on);
            setIsBrewing(false);
            setIsResting(false);
        } else if (step === "HeatUp") {
            setIsReady(false);
            setIsBrewing(false);
            setIsResting(false);
        } else if (step === "Rest") {
            setIsResting(true);
        } else if (step === "CoolDown") {
            setIsReady(false);
            setIsResting(false);
            setIsBrewing(false);
        }
    };

    const handleCoffeeHistoryMessage = (data: any[]) => {
        const formattedHistory: ICoffee[] = data.map((item) => ({
            id: item.id || Date.now(),
            type: item.type || "Unknown",
            strength: item.strength || 3,
            createdDate: item.createdDate || new Date().toISOString(),
        }));

        formattedHistory.sort(
            (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        );

        setCoffeeHistory(formattedHistory);
    };

    useEffect(() => {
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
            setIsConnected(true);
            setLogs((prev) => [...prev, "Connected to backend"]);
            setTimeout(() => send("History"), HISTORY_INITIAL_DELAY);
        };

        ws.current.onclose = () => {
            setIsConnected(false);
            setIsOn(false);
            setIsReady(false);
            setIsBrewing(false);
            setIsResting(false);
            setLogs((prev) => [...prev, "Connection lost"]);
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "status" && data.data) {
                    handleStatusMessage(data.data);
                    return;
                }

                if (data.type === "coffee_history" && Array.isArray(data.data)) {
                    handleCoffeeHistoryMessage(data.data);
                    return;
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        ws.current.onerror = (err) => {
            console.error("WebSocket error:", err);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    const addCoffeeToHistory = (entry: ICoffee) => {
        setCoffeeHistory((prev) => {
            const exists = prev.some((coffee) => coffee.id === entry.id);
            if (exists) return prev;
            return [...prev, entry];
        });

        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(entry));
        }
    };

    const requestHistoryUpdate = () => send("History");

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
                isResting,
                logs,
                coffeeHistory,
                statusData,
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const ctx = useContext(WebSocketContext);
    if (!ctx) {
        throw new Error("useWebSocket must be used inside WebSocketProvider!");
    }
    return ctx;
};