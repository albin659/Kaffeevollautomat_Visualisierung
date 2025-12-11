import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useLanguage } from "../../common/context/LanguageContext";
import "./Dashboard.css";

import CoffeeIcon from '@mui/icons-material/Coffee';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WifiIcon from '@mui/icons-material/Wifi';
import SchoolIcon from '@mui/icons-material/School';
import BuildIcon from '@mui/icons-material/Build';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

const Dashboard = () => {
    const { send, isConnected, isOn, setIsOn, setIsReady, isReady, isBrewing, coffeeHistory } = useWebSocket();
    const { texts } = useLanguage();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (isConnected && !initialized) {
            // Fordere initialen Status an (beliebiger Command triggert Status-Broadcast)
            send("History");
            setInitialized(true);
        }
    }, [isConnected, initialized, send]);

    const toggleMachine = () => {
        console.log("Button gedrückt: ToggleMachine");
        if (!isConnected) {
            console.warn("Maschine nicht verbunden");
            return;
        }

        if (!isOn) {
            console.log("Einschalten & Aufheizen");
            send("HeatUp");
            setIsOn(true);
            setIsReady(false);
        } else {
            console.log("Ausschalten - Abkühlen läuft im Hintergrund");
            send("CoolDown");
            setIsOn(false);
            setIsReady(false);
        }
    };

    const todaysCoffees = coffeeHistory.filter(coffee => {
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
                {/* Maschinen-Status */}
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: getStatusColor() }}>
                            <CoffeeIcon style={{ fontSize: 28, color: "white" }} />
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

                {/* Heute Gebrüht */}
                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#162a4f" }}>
                            <EmojiEventsIcon style={{ fontSize: 28, color: "white" }} />
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.brewedToday}</p>
                        <h3 className="status-value">{todaysCoffees.length} {texts.cups}</h3>
                    </div>
                </div>

                {/* Gesamt Gebrüht */}
                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#5a6268" }}>
                            <TrendingUpIcon style={{ fontSize: 28, color: "white" }} />
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.totalBrewed}</p>
                        <h3 className="status-value">{coffeeHistory.length} {texts.cups}</h3>
                    </div>
                </div>

                {/* Verbindung */}
                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: isConnected ? "#28a745" : "#dc3545" }}>
                            <WifiIcon style={{ fontSize: 28, color: "white" }} />
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
                            {isOn ? (
                                <StopIcon style={{ fontSize: 24 }} />
                            ) : (
                                <PlayArrowIcon style={{ fontSize: 24 }} />
                            )}
                        </span>
                        <span className="button-text">
                            {getButtonText()}
                        </span>
                    </button>
                </div>
            </div>

            {/* Info Karten */}
            <div className="info-section">
                {/* Über dieses Projekt */}
                <div className="info-card-modern">
                    <div className="info-header">
                        <SchoolIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.aboutProject}</h3>
                    </div>
                    <p className="info-text">
                        {texts.projectDescription} <strong>Albin Bajrami</strong>,{" "}
                        <strong>Lirik Dauti</strong> {texts.and} <strong>David Fink</strong> {texts.at} HTBLA Kaindorf.
                    </p>
                </div>

                {/* Technologie-Stack */}
                <div className="info-card-modern">
                    <div className="info-header">
                        <BuildIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.technologyStack}</h3>
                    </div>
                    <div className="tech-grid">
                        <span className="tech-badge">React + TypeScript</span>
                        <span className="tech-badge">WebSocket</span>
                        <span className="tech-badge">Raspberry Pi</span>
                        <span className="tech-badge">Python + MongoDB</span>
                        <span className="tech-badge">Chart.js</span>
                    </div>
                </div>

                {/* Funktionen */}
                <div className="info-card-modern">
                    <div className="info-header">
                        <AnalyticsIcon style={{ fontSize: 24, color: "#1976d2" }} />
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