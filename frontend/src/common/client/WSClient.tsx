import { useEffect, useState } from "react";

class WsClient {
    private ws: WebSocket | null = null;

    connect(url: string, onMessage: (msg: string) => void, onOpen?: () => void, onClose?: () => void) {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => onOpen?.();
        this.ws.onmessage = (event: MessageEvent) => {
            if (typeof event.data === "string") {
                onMessage(event.data);
            }
        };
        this.ws.onclose = () => onClose?.();
    }

    send(message: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
    }

    close() {
        this.ws?.close();
    }
}

export const wsClient = new WsClient();

// -----------------------------
// React Hook für deine Komponenten
// -----------------------------
export function useCoffeeMachine() {
    const [messages, setMessages] = useState<string[]>([]);
    const [machineReady, setMachineReady] = useState(false);

    useEffect(() => {
        wsClient.connect(
            "ws://localhost:8765",
            (msg) => {
                setMessages((prev) => [...prev, msg]);
                if (msg.includes("Maschine ist betriebsbereit")) {
                    setMachineReady(true);
                }
            },
            () => {
                setMessages((prev) => [...prev, "✅ Verbunden mit Kaffeemaschine"]);
                wsClient.send("1");
            },
            () => {
                setMessages((prev) => [...prev, "❌ Verbindung geschlossen"]);
                setMachineReady(false);
            }
        );

        return () => wsClient.close();
    }, []);

    return { messages, machineReady, send: (msg: string) => wsClient.send(msg) };
}
