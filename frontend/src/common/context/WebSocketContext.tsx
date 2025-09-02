import React, { createContext, useContext } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

type WebSocketContextType = {
    messages: string[];
    sendMessage: (msg: string) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const { messages, sendMessage } = useWebSocket("ws://localhost:8765");

    return (
        <WebSocketContext.Provider value={{ messages, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWS() {
    const ctx = useContext(WebSocketContext);
    if (!ctx) {
        throw new Error("useWS must be used inside a WebSocketProvider");
    }
    return ctx;
}
