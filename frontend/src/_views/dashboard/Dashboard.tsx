import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Dashboard.css";

const Dashboard = () => {
    const { send, isConnected, logs, isOn, setIsOn, setIsReady, isReady, isBrewing } = useWebSocket();
    const { coffees } = useCoffeeContext();
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
            // SOFORT Frontend-Status ändern
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
        return "#6c757d"; // Ausgeschaltet
    };

    const getStatusText = () => {
        if (!isConnected) return "Nicht verbunden";
        if (isBrewing) return "Brüht gerade...";
        if (isReady) return "Bereit";
        if (isOn) return "Heizt auf...";
        return "Ausgeschaltet"; // Default Zustand
    };

    return (
        <div className="dashboard-container">
            {/* Hero Header */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Dashboard</h1>
                    <p className="hero-subtitle">Kaffeevollautomat Steuerung</p>
                </div>
                <div className="hero-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                    <div className="decoration-circle circle-3"></div>
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
                        <p className="status-label">MASCHINEN-STATUS</p>
                        <h3 className="status-value" style={{ color: getStatusColor() }}>
                            {!initialized && isConnected ? "Status wird abgefragt..." : getStatusText()}
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
                        <p className="status-label">HEUTE GEBRÜHT</p>
                        <h3 className="status-value">{todaysCoffees.length} Tassen</h3>
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
                        <p className="status-label">GESAMT GEBRÜHT</p>
                        <h3 className="status-value">{coffees.length} Tassen</h3>
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
                        <p className="status-label">VERBINDUNG</p>
                        <h3 className="status-value" style={{ color: isConnected ? "#28a745" : "#dc3545" }}>
                            {isConnected ? "Verbunden" : "Getrennt"}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Steuerung - Neues Design */}
            <div className="control-panel">
                <div className="control-panel-inner">
                    <h2 className="control-title">Maschinensteuerung</h2>
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
                            {!isConnected ? "Verbinden..." : isOn ? "Maschine Ausschalten" : "Maschine Einschalten"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Info Karten - Verbessertes Design */}
            <div className="info-section">
                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">🎓</span>
                        <h3 className="info-title">Über dieses Projekt</h3>
                    </div>
                    <p className="info-text">
                        Diese Anwendung visualisiert den Zubereitungsprozess eines Kaffeevollautomaten
                        in Echtzeit. Entwickelt als Diplomarbeit 2025/26 von <strong>Albin Bajrami</strong>,
                        <strong>Lirik Dauti</strong> und <strong>David Fink</strong> an der HTBLA Kaindorf.
                    </p>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">⚙️</span>
                        <h3 className="info-title">Technologie-Stack</h3>
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
                        <h3 className="info-title">Funktionen</h3>
                    </div>
                    <ul className="feature-list-modern">
                        <li>
                            <span className="check-icon">✓</span>
                            <span>Echtzeitüberwachung der Sensordaten</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>Temperatur- und Durchflussmessung</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>Automatische Brühprozess-Steuerung</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>Statistiken und CSV-Export</span>
                        </li>
                        <li>
                            <span className="check-icon">✓</span>
                            <span>Vollständige Kaffee-Historie</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;