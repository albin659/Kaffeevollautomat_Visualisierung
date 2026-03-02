import React from "react";
import { Button } from "react-bootstrap";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useLanguage } from "../../common/context/LanguageContext";
import { getDateString, getWeekData } from "../../common/utils/dateUtils";
import PageHeader from "../../_views/layout/PageHeader";
import "./Report.css";

import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DateRangeIcon from '@mui/icons-material/DateRange';

const exportCSV = (data: any[], filenamePrefix: string, headerLabels: string[]) => {
    const rows = data.map((c) => [c.id, c.type, c.strength, c.createdDate]);
    const csvContent =
        "data:text/csv;charset=utf-8," +
        [headerLabels, ...rows].map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${filenamePrefix}_${getDateString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const Report: React.FC = () => {
    const { coffeeHistory } = useWebSocket();
    const { texts } = useLanguage();

    const weekData = getWeekData(coffeeHistory);
    const csvHeaders = [texts.csvHeaderId, texts.csvHeaderType, texts.csvHeaderStrength, texts.csvHeaderDate];

    const handleExportAll  = () => exportCSV(coffeeHistory, "coffee_report_all",  csvHeaders);
    const handleExportWeek = () => exportCSV(weekData,      "coffee_report_week", csvHeaders);

    return (
        <div className="dashboard-container">
            <PageHeader title={texts.reportTitle} subtitle={texts.reportSubtitle} />

            {/* Stats Cards */}
            <div className="status-grid">
                <div className="status-card status-card-primary">
                    <div className="status-card-header">
                        <div className="status-icon" style={{ backgroundColor: "#162a4f" }}>
                            <DescriptionIcon style={{ fontSize: 28, color: "white" }} />
                        </div>
                    </div>
                    <div className="status-card-body">
                        <p className="status-label">{texts.totalRecords}</p>
                        <h3 className="status-value">{coffeeHistory.length}</h3>
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
                        <h3 className="status-value">{weekData.length}</h3>
                    </div>
                </div>
            </div>

            {/* Export Cards */}
            <div className="info-section">
                <div className="info-card-modern">
                    <div className="info-header">
                        <AnalyticsIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.completeDataExport}</h3>
                    </div>
                    <p className="info-text">{texts.completeDataExportDescription}</p>
                    <div className="status-card-footer" style={{ marginTop: "1rem", height: "2px" }}>
                        <div className="status-indicator" style={{ backgroundColor: "#162a4f", width: "100%" }} />
                    </div>
                    <Button className="control-button-modern" onClick={handleExportAll} style={{ marginTop: "1.5rem", width: "100%" }}>
                        <span className="button-icon"><DownloadIcon style={{ fontSize: 20 }} /></span>
                        <span className="button-text">
                            {texts.exportAllData.replace("{count}", coffeeHistory.length.toString())}
                        </span>
                    </Button>
                </div>

                <div className="info-card-modern">
                    <div className="info-header">
                        <CalendarTodayIcon style={{ fontSize: 24, color: "#1976d2" }} />
                        <h3 className="info-title">{texts.weekExport}</h3>
                    </div>
                    <p className="info-text">{texts.weekExportDescription}</p>
                    <div className="status-card-footer" style={{ marginTop: "1rem", height: "2px" }}>
                        <div className="status-indicator" style={{ backgroundColor: "#28a745", width: "100%" }} />
                    </div>
                    <Button className="control-button-modern active" onClick={handleExportWeek} style={{ marginTop: "1.5rem", width: "100%" }}>
                        <span className="button-icon"><DownloadIcon style={{ fontSize: 20 }} /></span>
                        <span className="button-text">
                            {texts.exportWeekData.replace("{count}", weekData.length.toString())}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Report;