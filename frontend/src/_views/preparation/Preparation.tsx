import React, { useEffect, useRef, useState } from "react";
import {ICoffee} from "../../common/models/ICoffee";

const Preparation = () => {
    const [coffeeType, setCoffeeType] = useState<string>("Espresso");
    const [amount, setAmount] = useState<number>(1);
    const [strength, setStrength] = useState<number>(3);
    const [messages, setMessages] = useState<string[]>([]);
    const [machineReady, setMachineReady] = useState<boolean>(false);

    const ws = useRef<WebSocket | null>(null);

    // WebSocket verbinden
    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            setMessages((prev) => [...prev, "✅ Verbunden mit Kaffeemaschine"]);
            // Maschine einschalten (1 = aufheizen)
            ws.current?.send("1");
        };

        ws.current.onmessage = (event) => {
            const msg = event.data;
            setMessages((prev) => [...prev, msg]);

            if (msg.includes("Maschine ist betriebsbereit")) {
                setMachineReady(true);
            }
        };

        ws.current.onclose = () => {
            setMessages((prev) => [...prev, "❌ Verbindung geschlossen"]);
            setMachineReady(false);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    // Kaffee bestellen
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newCoffee: ICoffee = {
            id: Date.now(),
            type: coffeeType,
            strength: strength,
            createdDate: new Date().toISOString(),
        };

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("2"); // Kaffee-Auswahl-Modus
            ws.current.send(coffeeType === "Espresso" ? "2" : "1"); // Typ senden
        }

        setMessages((prev) => [
            ...prev,
            `☕ Bestellung: ${amount}x ${coffeeType} (Stärke ${strength})`,
        ]);
    };

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-body">
                    <h4 className="card-title mb-3">Zubereitung</h4>
                    <form onSubmit={handleSubmit}>
                        {/* Kaffeeart */}
                        <div className="mb-3">
                            <label className="form-label">Welche Art von Kaffee wollen Sie?</label>
                            <div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        id="espresso"
                                        name="coffeeType"
                                        value="Espresso"
                                        className="form-check-input"
                                        checked={coffeeType === "Espresso"}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <label htmlFor="espresso" className="form-check-label">
                                        Espresso
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        id="black"
                                        name="coffeeType"
                                        value="Schwarz"
                                        className="form-check-input"
                                        checked={coffeeType === "Schwarz"}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <label htmlFor="black" className="form-check-label">
                                        Schwarz
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Anzahl */}
                        <div className="mb-3">
                            <label className="form-label">Wieviel Stück wollen Sie?</label>
                            <select
                                className="form-select"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>

                        {/* Stärke */}
                        <div className="mb-3">
                            <label className="form-label">
                                Wie stark wollen Sie den Kaffee? (Stärkeregler)
                            </label>
                            <input
                                type="range"
                                className="form-range"
                                min="1"
                                max="5"
                                value={strength}
                                onChange={(e) => setStrength(Number(e.target.value))}
                            />
                            <div>Stärke: {strength}</div>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            className="btn btn-success w-100"
                            disabled={!machineReady}
                        >
                            {machineReady ? "Zubereiten" : "Maschine heizt auf..."}
                        </button>
                    </form>
                </div>
            </div>

            {/* Statusanzeige */}
            <div className="card mt-3">
                <div className="card-body">
                    <h5>Status</h5>
                    <div
                        style={{
                            maxHeight: "250px",
                            overflowY: "auto",
                            background: "#f8f9fa",
                            padding: "10px",
                            borderRadius: "5px",
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                        }}
                    >
                        {messages.map((msg, idx) => (
                            <div key={idx}>{msg}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preparation;
