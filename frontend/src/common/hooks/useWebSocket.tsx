import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
    const [messages, setMessages] = useState<string[]>([]);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => console.log("WebSocket connected");
        ws.onmessage = (event) => {
            console.log("WS message in Hook:", event.data); // <-- hier prüfen
            setMessages(prev => [...prev, event.data]);
        };
        ws.onclose = () => console.log("WebSocket disconnected");

        return () => {
            ws.close();
        };
    }, [url]);

    const sendMessage = (msg: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(msg);
        } else {
            console.log("WebSocket not open yet");
        }
    };

    return { messages, sendMessage };
}
