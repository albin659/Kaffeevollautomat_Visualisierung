import React, { useEffect, useRef, useState } from "react";

const Preparation = () => {
    const [coffeeType, setCoffeeType] = useState<string>("Espresso");
    const [amount, setAmount] = useState<number>(1);
    const [strength, setStrength] = useState<number>(3);
    const [messages, setMessages] = useState<string[]>([]);
    const [machineReady, setMachineReady] = useState<boolean>(false);
    const [isBrewing, setIsBrewing] = useState<boolean>(false);

    const ws = useRef<WebSocket | null>(null);

    // WebSocket verbinden
    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8765");

        ws.current.onopen = () => {
            setMessages((prev) => [...prev, " Verbunden mit Kaffeemaschine"]);
            ws.current?.send("1");
        };

        ws.current.onmessage = (event) => {
            const msg = event.data;
            setMessages((prev) => [...prev, msg]);

            if (msg.includes("Maschine ist betriebsbereit")) {
                setMachineReady(true);
            }

            // Wenn die Zubereitung abgebrochen wird, isBrewing zurücksetzen
            if (msg.includes("Kaffeezubereitung abgebrochen") ||
                msg.includes("Kaffee ist fertig") ||
                msg.includes("Kaffeesatzbehälter voll") ||
                msg.includes("Nicht genug Wasser")) {
                setIsBrewing(false);
            }
        };

        ws.current.onclose = () => {
            setMessages((prev) => [...prev, " Verbindung geschlossen"]);
            setMachineReady(false);
            setIsBrewing(false);
        };

        return () => {
            ws.current?.close();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!machineReady || isBrewing) return;

        setIsBrewing(true);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            // Sende zuerst die Anzahl, dann den Kaffeetyp
            ws.current.send("2");
            setTimeout(() => {
                ws.current?.send(amount.toString()); // Anzahl senden
            }, 50);
            setTimeout(() => {
                ws.current?.send(coffeeType === "Espresso" ? "2" : "1"); // Typ senden
            }, 100);
        }

        setMessages((prev) => [
            ...prev,
            `☕ Bestellung: ${amount}x ${coffeeType} (Stärke ${strength})`,
        ]);

        const onMessage = (event: MessageEvent) => {
            const msg = event.data;
            // Setze isBrewing auf false bei Fertigstellung oder Abbruch
            if (msg.includes("Kaffee ist fertig!") ||
                msg.includes("Kaffeezubereitung abgebrochen") ||
                msg.includes("Kaffeesatzbehälter voll") ||
                msg.includes("Nicht genug Wasser")) {
                setIsBrewing(false);
                ws.current?.removeEventListener("message", onMessage);
            }
        };

        ws.current?.addEventListener("message", onMessage);
    };

    const handleFillWater = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("3");
            setMessages((prev) => [...prev, "💧 Wassertank wird befüllt..."]);
        }
    };

    const handleEmptyGrounds = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("4");
            setMessages((prev) => [...prev, "🗑️ Kaffeesatz wird geleert..."]);
        }
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

                        <button
                            type="submit"
                            className="btn btn-success w-100"
                            disabled={!machineReady || isBrewing}
                        >
                            {machineReady ? (isBrewing ? "Bereitet zu..." : "Zubereiten") : "Maschine heizt auf..."}
                        </button>
                    </form>

                    {/* Die Buttons für Wasser und Kaffeesatz außerhalb des Formulars */}
                    <div className="d-flex gap-2 mb-3 mt-3">
                        <button
                            type="button"
                            className="btn btn-primary flex-grow-1"
                            disabled={isBrewing} // Nur während des Brühens deaktivieren
                            onClick={handleFillWater}
                        >
                            Wassertank befüllen
                        </button>

                        <button
                            type="button"
                            className="btn btn-warning flex-grow-1"
                            disabled={isBrewing} // Nur während des Brühens deaktivieren
                            onClick={handleEmptyGrounds}
                        >
                            Kaffeesatz leeren
                        </button>
                    </div>
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