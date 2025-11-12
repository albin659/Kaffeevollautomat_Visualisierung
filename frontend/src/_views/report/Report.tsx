import React from "react";
import { Button, Card } from "react-bootstrap";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import { useLanguage } from "../../common/context/LanguageContext";
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
const exportCSV = (data: any[], filenamePrefix: string, headerLabels: string[]) => {
    const header = headerLabels;
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
    const { texts } = useLanguage();

    const handleExportAll = () => {
        const headerLabels = [
            texts.csvHeaderId,
            texts.csvHeaderType,
            texts.csvHeaderStrength,
            texts.csvHeaderDate
        ];
        exportCSV(coffees, "coffee_report_all", headerLabels);
    };

    const handleExportWeek = () => {
        const weekData = getWeekData(coffees);
        const headerLabels = [
            texts.csvHeaderId,
            texts.csvHeaderType,
            texts.csvHeaderStrength,
            texts.csvHeaderDate
        ];
        exportCSV(weekData, "coffee_report_week", headerLabels);
    };

    return (
        <div className="dashboard-container">
            {/* Hero Header */}
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{texts.reportTitle}</h1>
                    <p className="hero-subtitle">{texts.reportSubtitle}</p>
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
                        <p className="status-label">{texts.totalRecords}</p>
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
                        <p className="status-label">{texts.thisWeek}</p>
                        <h3 className="status-value">{getWeekData(coffees).length}</h3>
                    </div>
                </div>
            </div>

            {/* Export Karten */}
            <div className="info-section">
                <div className="info-card-modern">
                    <div className="info-header">
                        <AnalyticsIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.completeDataExport}</h3>
                    </div>
                    <p className="info-text">
                        {texts.completeDataExportDescription}
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
                        <span className="button-text">
                            {texts.exportAllData.replace('{count}', coffees.length.toString())}
                        </span>
                    </Button>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <CalendarTodayIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.weekExport}</h3>
                    </div>
                    <p className="info-text">
                        {texts.weekExportDescription}
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
                        <span className="button-text">
                            {texts.exportWeekData.replace('{count}', getWeekData(coffees).length.toString())}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Report;