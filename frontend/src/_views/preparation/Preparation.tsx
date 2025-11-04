import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Preperation.css";

// MUI Imports
import { Snackbar, Alert, AlertTitle } from "@mui/material";
import CoffeeIcon from '@mui/icons-material/Coffee';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PowerIcon from '@mui/icons-material/Power';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import BoltIcon from '@mui/icons-material/Bolt';
import HistoryIcon from '@mui/icons-material/History';

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
            </div>

            <div className="preparation-grid">
                {/* Konfigurations-Karte */}
                <div className="config-card">
                    <div className="card-header">
                        <SettingsIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h2 className="card-title">Kaffee-Konfiguration</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="config-form">
                        {/* Kaffeeart */}
                        <div className="form-group">
                            <label className="form-label">
                                <LocalCafeIcon style={{ fontSize: 20, marginRight: 8 }} />
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
                                        <CoffeeIcon style={{ fontSize: 24 }} />
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
                                        <CoffeeIcon style={{ fontSize: 24 }} />
                                        <span className="radio-text">Schwarz</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Anzahl */}
                        <div className="form-group">
                            <label className="form-label">
                                <AddIcon style={{ fontSize: 20, marginRight: 8 }} />
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
                                <BoltIcon style={{ fontSize: 20, marginRight: 8 }} />
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
                                    <AutorenewIcon className="spinner" style={{ fontSize: 24 }} />
                                ) : (
                                    <PlayArrowIcon style={{ fontSize: 24 }} />
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
                        <BuildIcon style={{ fontSize: 24, color: "#1976d2" }} />
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
                                <WaterDropIcon style={{ fontSize: 24 }} />
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
                                <DeleteSweepIcon style={{ fontSize: 24 }} />
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
                            <span className={`status-dot ${isOn ? "active" : ""}`}>
                                {isOn ? <PowerIcon style={{ fontSize: 12, color: "white" }} /> : <RemoveIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">Maschine: {isOn ? "An" : "Aus"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${isReady ? "active" : ""}`}>
                                {isReady ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">Status: {isReady ? "Bereit" : "Nicht bereit"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${waterLevelIsGood ? "active" : "error"}`}>
                                {waterLevelIsGood ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">Wasser: {waterLevelIsGood ? "OK" : "Leer"}</span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${coffeeGroundsContainerEmpty ? "active" : "error"}`}>
                                {coffeeGroundsContainerEmpty ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">Kaffeesatz: {coffeeGroundsContainerEmpty ? "OK" : "Voll"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heute gebrühte Kaffees  */}
            <div className="logs-card">
                <div className="card-header">
                    <HistoryIcon style={{ fontSize: 24, color: "#1976d2" }} />
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