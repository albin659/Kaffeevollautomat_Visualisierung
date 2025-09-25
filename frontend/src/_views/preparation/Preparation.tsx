import React, { useState } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";

const Preparation = () => {
    const { send, logs, isOn, isReady, isBrewing, setIsBrewing } = useWebSocket();
    const { addCoffee } = useCoffeeContext();

    const [coffeeType, setCoffeeType] = useState<string>("Espresso");
    const [amount, setAmount] = useState<number>(1);
    const [strength, setStrength] = useState<number>(3);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("🖱️ Zubereitung gestartet:", { coffeeType, amount, strength });

        if (!isOn) {
            alert("❌ Maschine ist ausgeschaltet!");
            return;
        }
        if (!isReady) {
            alert("⏳ Maschine heizt noch auf – bitte warten!");
            return;
        }
        if (isBrewing) {
            alert("⏳ Die Maschine ist gerade am Brühen!");
            return;
        }

        setIsBrewing(true);

        send("2"); // Zubereitung starten

        setTimeout(() => {
            send(amount.toString());
        }, 50);

        setTimeout(() => {
            const typeCode = coffeeType === "Espresso" ? "2" : "1";
            send(typeCode);
        }, 100);

        // Kaffees im Context speichern
        setTimeout(() => {
            const now = new Date().toISOString();
            for (let i = 0; i < amount; i++) {
                addCoffee({
                    id: Date.now() + i,
                    type: coffeeType,
                    strength,
                    createdDate: now,
                });
            }
        }, 200);
    };

    const handleFillWater = () => {
        send("3");
    };

    const handleEmptyGrounds = () => {
        send("4");
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
                            disabled={isBrewing}
                        >
                            {isBrewing ? "Bereitet zu..." : "Zubereiten"}
                        </button>
                    </form>

                    {/* Wasser & Kaffeesatz */}
                    <div className="d-flex gap-2 mb-3 mt-3">
                        <button
                            type="button"
                            className="btn btn-primary flex-grow-1"
                            disabled={isBrewing}
                            onClick={handleFillWater}
                        >
                            Wassertank befüllen
                        </button>

                        <button
                            type="button"
                            className="btn btn-warning flex-grow-1"
                            disabled={isBrewing}
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
                        {logs.map((msg, idx) => (
                            <div key={idx}>{msg}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preparation;
