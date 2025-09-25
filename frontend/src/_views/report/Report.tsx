import React from "react";
import { Button, Card } from "react-bootstrap";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import "./Report.css";

// Hilfsfunktion für Datum im Format YYYY-MM-DD
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

// Helper: Montag–Sonntag einer Woche holen
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
        <div className="container mt-4">
            <h4 className="mb-3">Kaffee Berichte</h4>

            <Card className="mb-3 shadow-sm">
                <Card.Body>
                    <Card.Title>Alle Daten Export</Card.Title>
                    <Card.Text>Alle bisherigen Kaffeedaten als CSV herunterladen.</Card.Text>
                    <Button className="report-button" onClick={handleExportAll}>
                        Export als CSV
                    </Button>
                </Card.Body>
            </Card>

            <Card className="mb-3 shadow-sm">
                <Card.Body>
                    <Card.Title>Wöchentlicher Export</Card.Title>
                    <Card.Text>
                        Kaffeedaten der aktuellen Woche (Montag – Sonntag) herunterladen.
                    </Card.Text>
                    <Button className="report-button" onClick={handleExportWeek}>
                        Wochen-Export als CSV
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Report;
