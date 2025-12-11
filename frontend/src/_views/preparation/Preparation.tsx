import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useLanguage } from "../../common/context/LanguageContext";
import "./Preperation.css";

import { Snackbar, Alert } from "@mui/material";
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
import RemoveIcon from '@mui/icons-material/Remove';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import BoltIcon from '@mui/icons-material/Bolt';
import HistoryIcon from '@mui/icons-material/History';

const Preparation = () => {
    const { send, statusData, isOn, isReady, isBrewing, setIsBrewing, coffeeHistory, addCoffeeToHistory } = useWebSocket();
    const { texts } = useLanguage();

    const [coffeeType, setCoffeeType] = useState<string>(texts.espresso);
    const [amount, setAmount] = useState<number>(1);
    const [strength, setStrength] = useState<number>(3);

    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("info");

    // Status aus dem statusData-Objekt extrahieren
    useEffect(() => {
        if (statusData) {
            setWaterLevelIsGood(statusData.water_ok);
            setCoffeeGroundsContainerEmpty(statusData.grounds_ok);

            const step = statusData.current_step.toLowerCase();

            if (step.includes("wasser leer")) {
                showSnackbar(texts.waterTankEmpty, "error");
            }

            if (step.includes("kaffeesatz voll")) {
                showSnackbar(texts.groundsContainerFull, "error");
            }

            if (step.includes("warten") && isBrewing) {
                showSnackbar(texts.coffeeReady.replace('{type}', coffeeType), "success");
                setIsBrewing(false);
            }
        }
    }, [statusData, isBrewing, coffeeType, setIsBrewing, texts]);

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
            showSnackbar(texts.machineOffError, "error");
            return;
        }
        if (!isReady) {
            showSnackbar(texts.machineHeating, "warning");
            return;
        }
        if (isBrewing) {
            showSnackbar(texts.alreadyBrewing, "warning");
            return;
        }
        if (!waterLevelIsGood) {
            showSnackbar(texts.waterTankEmpty, "error");
            return;
        }
        if (!coffeeGroundsContainerEmpty) {
            showSnackbar(texts.groundsContainerFull, "error");
            return;
        }

        setIsBrewing(true);
        showSnackbar(texts.brewingStarted.replace('{type}', coffeeType), "info");

        // Neues Command-Format: "Brew"
        send("Brew");

        setTimeout(() => {
            send(amount.toString());
        }, 50);

        setTimeout(() => {
            const typeCode = coffeeType === texts.espresso ? "2" : "1";
            send(typeCode);
        }, 100);

        // Kaffees zur History hinzufügen
        setTimeout(() => {
            const now = new Date().toISOString();
            for (let i = 0; i < amount; i++) {
                addCoffeeToHistory({
                    id: Date.now() + i,
                    type: coffeeType,
                    strength,
                    createdDate: now,
                });
            }
        }, 200);
    };

    const handleFillWater = () => {
        send("WaterFillUp");
        showSnackbar(texts.waterRefilled, "success");
    };

    const handleEmptyGrounds = () => {
        send("GroundClearing");
        showSnackbar(texts.groundsEmptied, "success");
    };

    const todaysCoffees = coffeeHistory.filter(coffee => {
        const coffeeDate = new Date(coffee.createdDate).toDateString();
        const today = new Date().toDateString();
        return coffeeDate === today;
    });

    return (
        <div className="preparation-container">
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

            <div className="preparation-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{texts.preparationTitle}</h1>
                    <p className="hero-subtitle">{texts.preparationSubtitle}</p>
                </div>
            </div>

            <div className="preparation-grid">
                {/* Konfigurations-Karte */}
                <div className="config-card">
                    <div className="card-header">
                        <SettingsIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h2 className="card-title">{texts.coffeeConfiguration}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="config-form">
                        {/* Kaffeeart */}
                        <div className="form-group">
                            <label className="form-label">
                                <LocalCafeIcon style={{ fontSize: 20, marginRight: 8 }} />
                                {texts.coffeeType}
                            </label>
                            <div className="radio-group">
                                <label className={`radio-card ${coffeeType === texts.espresso ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="coffeeType"
                                        value={texts.espresso}
                                        checked={coffeeType === texts.espresso}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <div className="radio-content">
                                        <CoffeeIcon style={{ fontSize: 24 }} />
                                        <span className="radio-text">{texts.espresso}</span>
                                    </div>
                                </label>
                                <label className={`radio-card ${coffeeType === texts.black ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="coffeeType"
                                        value={texts.black}
                                        checked={coffeeType === texts.black}
                                        onChange={(e) => setCoffeeType(e.target.value)}
                                    />
                                    <div className="radio-content">
                                        <CoffeeIcon style={{ fontSize: 24 }} />
                                        <span className="radio-text">{texts.black}</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Anzahl */}
                        <div className="form-group">
                            <label className="form-label">
                                {texts.amount}
                            </label>
                            <select
                                className="form-select-modern"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            >
                                <option value={1}>{texts.oneCup}</option>
                                <option value={2}>{texts.twoCups}</option>
                            </select>
                        </div>

                        {/* Stärke */}
                        <div className="form-group">
                            <label className="form-label">
                                <BoltIcon style={{ fontSize: 20, marginRight: 8 }} />
                                {texts.strength}
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
                                <p className="strength-value">
                                    {texts.strengthValue.replace('{value}', strength.toString())}
                                </p>
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
                                {isBrewing ? texts.brewingInProgress : texts.startBrewing}
                            </span>
                        </button>
                    </form>
                </div>

                {/* Wartungs-Karte */}
                <div className="maintenance-card">
                    <div className="card-header">
                        <BuildIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h2 className="card-title">{texts.maintenance}</h2>
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
                                <h3 className="maintenance-title">{texts.waterTank}</h3>
                                <p className="maintenance-text">
                                    {waterLevelIsGood ? texts.waterFilled : texts.waterEmpty}
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
                                <h3 className="maintenance-title">{texts.coffeeGrounds}</h3>
                                <p className="maintenance-text">
                                    {coffeeGroundsContainerEmpty ? texts.groundsEmpty : texts.groundsFull}
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
                            <span className="status-text">
                                {texts.machineControl}: {isOn ? texts.machineOn : texts.machineOff}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${isReady ? "active" : ""}`}>
                                {isReady ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">
                                Status: {isReady ? texts.statusReady : texts.statusNotReady}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${waterLevelIsGood ? "active" : "error"}`}>
                                {waterLevelIsGood ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">
                                {texts.waterTank}: {waterLevelIsGood ? texts.waterOK : texts.waterEmptyShort}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className={`status-dot ${coffeeGroundsContainerEmpty ? "active" : "error"}`}>
                                {coffeeGroundsContainerEmpty ? <CheckCircleIcon style={{ fontSize: 12, color: "white" }} /> : <ErrorIcon style={{ fontSize: 12, color: "white" }} />}
                            </span>
                            <span className="status-text">
                                {texts.coffeeGrounds}: {coffeeGroundsContainerEmpty ? texts.groundsOK : texts.groundsFullShort}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heute gebrühte Kaffees */}
            <div className="logs-card">
                <div className="card-header">
                    <HistoryIcon style={{ fontSize: 24, color: "#1976d2" }} />
                    <h2 className="card-title">
                        {texts.todayBrewedCoffees.replace('{count}', todaysCoffees.length.toString())}
                    </h2>
                </div>
                <div className="logs-content">
                    {todaysCoffees.length === 0 ? (
                        <p className="logs-empty">{texts.noCoffeesYet}</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-light">
                                <tr>
                                    <th scope="col">{texts.time}</th>
                                    <th scope="col">{texts.type}</th>
                                    <th scope="col">{texts.strength}</th>
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
                                            <span className={`badge ${coffee.type === texts.espresso ? 'bg-primary' : 'bg-dark'}`}>
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