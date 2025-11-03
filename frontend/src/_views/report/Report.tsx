import React from "react";
import { Button, Card } from "react-bootstrap";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Report.css";

// Datum im Format YYYY-MM-DD
const getDateString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

// CSV Export
const exportCSV = (data: any[], filenamePrefix: string) => {
    const header = ["ID", "Kaffee Typ", "Stärke", "Datum"];
    const rows = data.map((c) => [c.id, c.type, c.strength, c.createdDate]);
    const csvContent =
        "data:text/csv;charset=utf-8," +
        [header, ...rows].map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${filenamePrefix}_${getDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Montag–Sonntag einer Woche holen
const getWeekData = (data: any[]) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diffToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return data.filter((c) => {
        const d = new Date(c.createdDate);
        return d >= monday && d <= sunday;
    });
};

const Report: React.FC = () => {
    const { coffees } = useCoffeeContext();

    const handleExportAll = () => {
        exportCSV(coffees, "coffee_report_all");
    };

    const handleExportWeek = () => {
        const weekData = getWeekData(coffees);
        exportCSV(weekData, "coffee_report_week");
    };

    return (
        <div className="dashboard-container">
            {/* Hero Header */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Berichte & Export</h1>
                    <p className="hero-subtitle">Kaffeedaten exportieren und analysieren</p>
                </div>
                <div className="hero-decoration">
                    <div className="decoration-circle circle-1"></div>
                    <div className="decoration-circle circle-2"></div>
                    <div className="decoration-circle circle-3"></div>
                </div>
            </div>

            {/* Statistik Karten */}
            <div className="status-grid">
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#162a4f" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">GESAMTE DATENSÄTZE</p>
                        <h3 className="status-value">{coffees.length}</h3>
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#28a745" }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">DIESE WOCHE</p>
                        <h3 className="status-value">{getWeekData(coffees).length}</h3>
                    </div>
                </div>
            </div>

            {/* Export Karten */}
            <div className="info-section">
                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">📊</span>
                        <h3 className="info-title">Kompletter Datenexport</h3>
                    </div>
                    <p className="info-text">
                        Exportieren Sie alle gesammelten Kaffeedaten in einer CSV-Datei.
                        Enthält alle bisher aufgezeichneten Brühvorgänge mit Typ, Stärke und Zeitstempel.
                    </p>
                    <div className="status-card-footer" style={{marginTop: '1rem', height: '2px'}}>
                        <div className="status-indicator" style={{backgroundColor: '#162a4f', width: '100%'}}></div>
                    </div>
                    <Button
                        className="control-button-modern"
                        onClick={handleExportAll}
                        style={{marginTop: '1.5rem', width: '100%'}}
                    >
                        <span className="button-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </span>
                        <span className="button-text">Alle Daten exportieren ({coffees.length} Datensätze)</span>
                    </Button>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <span className="info-emoji">📅</span>
                        <h3 className="info-title">Wochenexport</h3>
                    </div>
                    <p className="info-text">
                        Exportieren Sie nur die Kaffeedaten der aktuellen Woche (Montag bis Sonntag).
                        Ideal für wöchentliche Auswertungen und Berichte.
                    </p>
                    <div className="status-card-footer" style={{marginTop: '1rem', height: '2px'}}>
                        <div className="status-indicator" style={{backgroundColor: '#28a745', width: '100%'}}></div>
                    </div>
                    <Button
                        className="control-button-modern active"
                        onClick={handleExportWeek}
                        style={{marginTop: '1.5rem', width: '100%'}}
                    >
                        <span className="button-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </span>
                        <span className="button-text">Wochendaten exportieren ({getWeekData(coffees).length} Datensätze)</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Report;