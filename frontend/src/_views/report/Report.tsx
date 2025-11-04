import React from "react";
import { Button, Card } from "react-bootstrap";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Report.css";

// MUI Icons importieren
import DescriptionIcon from '@mui/icons-material/Description';
import ComputerIcon from '@mui/icons-material/Computer';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DateRangeIcon from '@mui/icons-material/DateRange';

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
            </div>

            {/* Statistik Karten */}
            <div className="status-grid">
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#162a4f" }}>
                            <DescriptionIcon style={{ fontSize: 28, color: "white" }} />
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
                            <DateRangeIcon style={{ fontSize: 28, color: "white" }} />
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
                        <AnalyticsIcon style={{ fontSize: 24, color: "#1976d2" }} />
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
                            <DownloadIcon style={{ fontSize: 20 }} />
                        </span>
                        <span className="button-text">Alle Daten exportieren ({coffees.length} Datensätze)</span>
                    </Button>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <CalendarTodayIcon style={{ fontSize: 24, color: "#1976d2" }} />
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
                            <DownloadIcon style={{ fontSize: 20 }} />
                        </span>
                        <span className="button-text">Wochendaten exportieren ({getWeekData(coffees).length} Datensätze)</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Report;