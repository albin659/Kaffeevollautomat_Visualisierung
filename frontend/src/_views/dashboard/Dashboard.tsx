import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import { useLanguage } from "../../common/context/LanguageContext";
import "./Dashboard.css";

const Dashboard = () => {
    const { send, isConnected, logs, isOn, setIsOn, setIsReady, isReady, isBrewing } = useWebSocket();
    const { coffees } = useCoffeeContext();
    const { texts } = useLanguage();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (isConnected && !initialized) {
            send("status");
            setInitialized(true);
        }
    }, [isConnected, initialized, send]);

    const toggleMachine = () => {
        console.log("🖱️ Button gedrückt: ToggleMachine");
        if (!isConnected) {
            console.warn("⚠️ Maschine nicht verbunden");
            return;
        }

        if (!isOn) {
            console.log("▶️ Einschalten & Aufheizen");
            send("1");
            setIsOn(true);
            setIsReady(false);
        } else {
            console.log("⏹ Ausschalten - Abkühlen läuft im Hintergrund");
            send("5");
            setIsOn(false);
            setIsReady(false);
        }
    };

    const todaysCoffees = coffees.filter(coffee => {
        const coffeeDate = new Date(coffee.createdDate).toDateString();
        const today = new Date().toDateString();
        return coffeeDate === today;
    });

    const getStatusColor = () => {
        if (!isConnected) return "#6c757d";
        if (isBrewing) return "#ffc107";
        if (isReady) return "#28a745";
        if (isOn) return "#17a2b8";
        return "#6c757d";
    };

    const getStatusText = () => {
        if (!isConnected) return texts.notConnected;
        if (isBrewing) return texts.brewing;
        if (isReady) return texts.ready;
        if (isOn) return texts.heating;
        return texts.turnedOff;
    };

    const getButtonText = () => {
        if (!isConnected) return texts.connecting;
        if (isOn) return texts.turnMachineOff;
        return texts.turnMachineOn;
    };

    return (
        <div className="dashboard-container">
            {/* Hero Header */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{texts.dashboard}</h1>
                    <p className="hero-subtitle">{texts.coffeeMachineControl}</p>
                </div>

            </div>

            {/* Status Karten Grid */}
            <div className="status-grid">
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: getStatusColor() }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.machineStatus}</p>
                        <h3 className="status-value" style={{ color: getStatusColor() }}>
                            {!initialized && isConnected ? texts.statusChecking : getStatusText()}
                        </h3>
                    </div>
                    <div className="status-card-footer">
                        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}></div>
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#162a4f" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.brewedToday}</p>
                        <h3 className="status-value">{todaysCoffees.length} {texts.cups}</h3>
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#5a6268" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.totalBrewed}</p>
                        <h3 className="status-value">{coffees.length} {texts.cups}</h3>
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: isConnected ? "#28a745" : "#dc3545" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                                <line x1="12" y1="20" x2="12.01" y2="20" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.connection}</p>
                        <h3 className="status-value" style={{ color: isConnected ? "#28a745" : "#dc3545" }}>
                            {isConnected ? texts.connected : texts.disconnected}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Steuerung */}
            <div className="control-panel">
                <div className="control-panel-inner">
                    <h2 className="control-title">{texts.machineControl}</h2>
                    <button
                        className={`control-button-modern ${!isConnected ? "disabled" : isOn ? "active" : ""}`}
                        onClick={toggleMachine}
                        disabled={!isConnected}
                    >
                        <span className="button-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                {isOn ? (
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                ) : (
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                )}
                            </svg>
                        </span>
                        <span className="button-text">
                            {getButtonText()}
                        </span>
                    </button>
                </div>
            </div>

            {/* Info Karten */}
            <div className="info-section">
                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">🎓</span>
                        <h3 className="info-title">{texts.aboutProject}</h3>
                    </div>
                    <p className="info-text">
                        {texts.projectDescription} <strong>Albin Bajrami</strong>,{" "}
                        <strong>Lirik Dauti</strong> {texts.and} <strong>David Fink</strong> {texts.at} HTBLA Kaindorf.
                    </p>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">⚙️</span>
                        <h3 className="info-title">{texts.technologyStack}</h3>
                    </div>
                    <div className="tech-grid">
                        <span className="tech-badge">React + TypeScript</span>
                        <span className="tech-badge">WebSocket</span>
                        <span className="tech-badge">Raspberry Pi</span>
                        <span className="tech-badge">Python Flask</span>
                        <span className="tech-badge">Chart.js</span>
                    </div>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">📊</span>
                        <h3 className="info-title">{texts.features}</h3>
                    </div>
                    <ul className="feature-list-modern">
                        <li>
                            <span className="check-icon">✓</span>
                            <span>{texts.realtimeMonitoring}</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>{texts.temperatureFlow}</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>{texts.brewingProcess}</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>{texts.statisticsExport}</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>{texts.coffeeHistory}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;