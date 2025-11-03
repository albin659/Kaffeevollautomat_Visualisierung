import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Preperation.css";

// MUI Imports
import { Snackbar, Alert, AlertTitle } from "@mui/material";

const Preparation = () => {
    const { send, logs, isOn, isReady, isBrewing, setIsBrewing } = useWebSocket();
    const { addCoffee, coffees } = useCoffeeContext();

    const [coffeeType, setCoffeeType] = useState<string>("Espresso");
    const [amount, setAmount] = useState<number>(1);
    const [strength, setStrength] = useState<number>(3);

    // Status aus Logs extrahieren
    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);

    // Snackbar States
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("info");

    useEffect(() => {
        if (logs.length === 0) return;

        const latest = logs[logs.length - 1];
        const parts = latest.split(",");

        if (parts.length >= 5) {
            const [zustand, temp, wasser, kaffeesatz, durchfluss] = parts;
            setWaterLevelIsGood(wasser.trim() === "1");
            setCoffeeGroundsContainerEmpty(kaffeesatz.trim() === "1");

            if (zustand.toLowerCase().includes("wasser leer")) {
                showSnackbar("Wassertank ist leer! Bitte nachfüllen.", "error");
            }

            if (zustand.toLowerCase().includes("kaffeesatz voll")) {
                showSnackbar("Kaffeesatzbehälter ist voll! Bitte leeren.", "error");
            }

            if (zustand.toLowerCase().includes("warten") && isBrewing) {
                showSnackbar(`Ihr ${coffeeType} wird zubereitet! ☕ Genießen Sie!`, "success");
                setIsBrewing(false);
            }
        }
    }, [logs, isBrewing, coffeeType, setIsBrewing]);

    const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("🖱️ Zubereitung gestartet:", { coffeeType, amount, strength });

        if (!isOn) {
            showSnackbar("Maschine ist ausgeschaltet! Bitte einschalten.", "error");
            return;
        }
        if (!isReady) {
            showSnackbar("Maschine heizt noch auf – bitte warten!", "warning");
            return;
        }
        if (isBrewing) {
            showSnackbar("Die Maschine ist gerade am Brühen!", "warning");
            return;
        }
        if (!waterLevelIsGood) {
            showSnackbar("Wassertank ist leer! Bitte nachfüllen.", "error");
            return;
        }
        if (!coffeeGroundsContainerEmpty) {
            showSnackbar("Kaffeesatzbehälter ist voll! Bitte leeren.", "error");
            return;
        }

        setIsBrewing(true);
        showSnackbar(`Ihr ${coffeeType} wird zubereitet... ☕`, "info");

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
        showSnackbar("Wassertank wurde aufgefüllt! 💧", "success");
    };

    const handleEmptyGrounds = () => {
        send("4");
        showSnackbar("Kaffeesatzbehälter wurde geleert! 🗑️", "success");
    };

    // Heute gebrühte Kaffees
    const todaysCoffees = coffees.filter(coffee => {
        const coffeeDate = new Date(coffee.createdDate).toDateString();
        const today = new Date().toDateString();
        return coffeeDate === today;
    });

    return (
        <div className="preparation-container">
            {/* MUI Snackbar für Benachrichtigungen */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Hero Header */}
            <div className="preparation-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Zubereitung</h1>
                    <p className="hero-subtitle"> Konfigurieren Sie Ihren perfekten Kaffee</p>
                </div>
                <div className="hero-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                </div>
            </div>

            <div className="preparation-grid">
                {/* Konfigurations-Karte */}
                <div className="config-card">
                    <div className="card-header">
                        <span className="card-icon">⚙️</span>
                        <h2 className="card-title">Kaffee-Konfiguration</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="config-form">
                        {/* Kaffeeart */}
                        <div className="form-group">
                            <label className="form-label">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                </svg>
                                Kaffeeart
                            </label>
                            <div className="radio-group">
                                <label className={`radio-card ${coffeeType === "Espresso" ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="coffeeType"
                                        value="Espresso"
                                        checked={coffeeType === "Espresso"}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <div className="radio-content">
                                        <span className="radio-emoji">☕</span>
                                        <span className="radio-text">Espresso</span>
                                    </div>
                                </label>
                                <label className={`radio-card ${coffeeType === "Schwarz" ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="coffeeType"
                                        value="Schwarz"
                                        checked={coffeeType === "Schwarz"}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <div className="radio-content">
                                        <span className="radio-emoji">☕</span>
                                        <span className="radio-text">Schwarz</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Anzahl */}
                        <div className="form-group">
                            <label className="form-label">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Anzahl
                            </label>
                            <select
                                className="form-select-modern"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            >
                                <option value={1}>1 Tasse</option>
                                <option value={2}>2 Tassen</option>
                            </select>
                        </div>

                        {/* Stärke */}
                        <div className="form-group">
                            <label className="form-label">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                </svg>
                                Stärke
                            </label>
                            <div className="strength-selector">
                                <input
                                    type="range"
                                    className="strength-slider"
                                    min="1"
                                    max="5"
                                    value={strength}
                                    onChange={(e) => setStrength(Number(e.target.value))}
                                />
                                <div className="strength-display">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={`strength-bar ${level <= strength ? "active" : ""}`}
                                        />
                                    ))}
                                </div>
                                <p className="strength-value">Stärke: {strength}/5</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`brew-button ${isBrewing ? "brewing" : ""}`}
                            disabled={isBrewing || !isOn || !isReady}
                        >
                            <span className="button-icon">
                                {isBrewing ? (
                                    <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="2" x2="12" y2="6"></line>
                                        <line x1="12" y1="18" x2="12" y2="22"></line>
                                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                        <line x1="2" y1="12" x2="6" y2="12"></line>
                                        <line x1="18" y1="12" x2="22" y2="12"></line>
                                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                )}
                            </span>
                            <span className="button-text">
                                {isBrewing ? "Bereitet zu..." : "Zubereitung starten"}
                            </span>
                        </button>
                    </form>
                </div>

                {/* Wartungs-Karte */}
                <div className="maintenance-card">
                    <div className="card-header">
                        <span className="card-icon">🔧</span>
                        <h2 className="card-title">Wartung</h2>
                    </div>

                    <div className="maintenance-buttons">
                        <button
                            type="button"
                            className="maintenance-button water"
                            disabled={isBrewing}
                            onClick={handleFillWater}
                        >
                            <div className="maintenance-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                </svg>
                            </div>
                            <div className="maintenance-content">
                                <h3 className="maintenance-title">Wassertank</h3>
                                <p className="maintenance-text">
                                    {waterLevelIsGood ? "✓ Gefüllt" : "⚠️ Leer - Befüllen!"}
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="maintenance-button grounds"
                            disabled={isBrewing}
                            onClick={handleEmptyGrounds}
                        >
                            <div className="maintenance-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </div>
                            <div className="maintenance-content">
                                <h3 className="maintenance-title">Kaffeesatz</h3>
                                <p className="maintenance-text">
                                    {coffeeGroundsContainerEmpty ? "✓ Leer" : "⚠️ Voll - Leeren!"}
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Status Info */}
                    <div className="status-info">
                        <div className="status-item">
                            <span className={`status-dot ${isOn ? "active" : ""}`}></span>
                            <span className="status-text">Maschine: {isOn ? "An" : "Aus"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${isReady ? "active" : ""}`}></span>
                            <span className="status-text">Status: {isReady ? "Bereit" : "Nicht bereit"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${waterLevelIsGood ? "active" : "error"}`}></span>
                            <span className="status-text">Wasser: {waterLevelIsGood ? "OK" : "Leer"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${coffeeGroundsContainerEmpty ? "active" : "error"}`}></span>
                            <span className="status-text">Kaffeesatz: {coffeeGroundsContainerEmpty ? "OK" : "Voll"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heute gebrühte Kaffees  */}
            <div className="logs-card">
                <div className="card-header">
                    <span className="card-icon">☕</span>
                    <h2 className="card-title">Heute gebrühte Kaffees ({todaysCoffees.length})</h2>
                </div>
                <div className="logs-content">
                    {todaysCoffees.length === 0 ? (
                        <p className="logs-empty">Noch keine Kaffees heute gebrüht...</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-light">
                                <tr>
                                    <th scope="col">Zeit</th>
                                    <th scope="col">Typ</th>
                                    <th scope="col">Stärke</th>
                                </tr>
                                </thead>
                                <tbody>
                                {todaysCoffees.slice().reverse().map((coffee) => (
                                    <tr key={coffee.id}>
                                        <td>
                                            {new Date(coffee.createdDate).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                                <span className={`badge ${coffee.type === 'Espresso' ? 'bg-primary' : 'bg-dark'}`}>
                                                    {coffee.type}
                                                </span>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="strength-indicator me-2">
                                                    {[1, 2, 3, 4, 5].map(level => (
                                                        <div
                                                            key={level}
                                                            className={`strength-dot ${level <= coffee.strength ? 'active' : ''}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span>{coffee.strength}/5</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Preparation;