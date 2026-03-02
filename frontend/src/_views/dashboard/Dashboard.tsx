import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useLanguage } from "../../common/context/LanguageContext";
import { isToday } from "../../common/utils/dateUtils";
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
import PageHeader from "../layout/PageHeader";

const FEATURES = [
    "realtimeMonitoring",
    "temperatureFlow",
    "brewingProcess",
    "statisticsExport",
    "coffeeHistory",
] as const;

const Dashboard = () => {
    const { send, isConnected, isOn, setIsOn, setIsReady, isReady, isBrewing, coffeeHistory, isResting } = useWebSocket();
    const { texts } = useLanguage();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (isConnected && !initialized) {
            send("History");
            setInitialized(true);
        }
    }, [isConnected, initialized, send]);

    const toggleMachine = () => {
        if (!isConnected) return;

        if (!isOn) {
            send("HeatUp");
            setIsOn(true);
            setIsReady(false);
        } else {
            send("CoolDown");
            setIsOn(false);
            setIsReady(false);
        }
    };

    const todaysCoffees = coffeeHistory.filter((coffee) => isToday(coffee.createdDate));

    const getStatusColor = () => {
        if (!isConnected) return "#6c757d";
        if (isBrewing)    return "#ffc107";
        if (isReady)      return "#28a745";
        if (isOn)         return "#17a2b8";
        return "#6c757d";
    };

    const getStatusText = () => {
        if (!isConnected) return texts.notConnected;
        if (isBrewing)    return texts.brewing;
        if (isResting)    return texts.resting;
        if (isReady)      return texts.ready;
        if (isOn)         return texts.heating;
        return texts.turnedOff;
    };

    const getButtonText = () => {
        if (!isConnected) return texts.connecting;
        if (isOn)         return texts.turnMachineOff;
        return texts.turnMachineOn;
    };

    const statusColor = getStatusColor();

    return (
        <div className="dashboard-container">
            <PageHeader title={texts.dashboard} subtitle={texts.coffeeMachineControl} />

            {/* Status Cards */}
            <div className="status-grid">
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: statusColor }}>
                            <CoffeeIcon style={{ fontSize: 28, color: "white" }} />
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.machineStatus}</p>
                        <h3 className="status-value" style={{ color: statusColor }}>
                            {!initialized && isConnected ? texts.statusChecking : getStatusText()}
                        </h3>
                    </div>
                    <div className="status-card-footer">
                        <div className="status-indicator" style={{ backgroundColor: statusColor }} />
                    </div>
                </div>

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

            {/* Machine Control */}
            <div className="control-panel">
                <div className="control-panel-inner">
                    <h2 className="control-title">{texts.machineControl}</h2>
                    <button
                        className={`control-button-modern ${!isConnected ? "disabled" : isOn ? "active" : ""}`}
                        onClick={toggleMachine}
                        disabled={!isConnected}
                    >
                        <span className="button-icon">
                            {isOn ? <StopIcon style={{ fontSize: 24 }} /> : <PlayArrowIcon style={{ fontSize: 24 }} />}
                        </span>
                        <span className="button-text">{getButtonText()}</span>
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="info-section">
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

                <div className="info-card-modern">
                    <div className="info-header">
                        <BuildIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.technologyStack}</h3>
                    </div>
                    <div className="tech-grid">
                        {["React + TypeScript", "WebSocket", "Raspberry Pi", "Python + MongoDB", "Chart.js"].map((tech) => (
                            <span key={tech} className="tech-badge">{tech}</span>
                        ))}
                    </div>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <AnalyticsIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.features}</h3>
                    </div>
                    <ul className="feature-list-modern">
                        {FEATURES.map((key) => (
                            <li key={key}>
                                <span className="check-icon">✓</span>
                                <span>{texts[key]}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;