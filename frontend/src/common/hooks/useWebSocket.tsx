import { useEffect, useState } from "react";

export function useWebSocket(url: string) {
    const [messages, setMessages] = useState<string[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(url);
        setSocket(ws);

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            console.log("Message from server:", event.data);
            setMessages((prev) => [...prev, event.data]);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
        };

        return () => {
            ws.close();
        };
    }, [url]);

    const sendMessage = (msg: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(msg);
        }
    };

    return { messages, sendMessage };
}
