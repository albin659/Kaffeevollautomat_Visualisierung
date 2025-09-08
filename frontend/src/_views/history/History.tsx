import React, { useState } from "react";
import "./History.css";
import { useWebSocket } from "../../common/context/WebSocketContext"; // WebSocketContext statt WSClient

interface HistoryEntry {
    time: string;
    temperature: string;
    strength: number;
    type: string;
}

const History = () => {
    const { logs } = useWebSocket(); // Verwende useWebSocket statt useCoffeeMachine
    const [coffeeCount, setCoffeeCount] = useState(0)
    const [mostPopularCoffee, setMostPopularCoffee] = useState("Demo Coffee")

    // Temporäre Demo-Daten
    const [historyData, setHistoryData] = useState<HistoryEntry[]>([
        { time: "08:00", temperature: "82°C", strength: 0.5, type: "Espresso" },
        { time: "09:15", temperature: "85°C", strength: 0.7, type: "Schwarz" },
    ]);

    return (
        <div className="history-container">
            <h2>History</h2>

            <div className="history-card">
                <h3>Daten-Verlauf</h3>
                <table className="history-table">
                    <thead>
                    <tr>
                        <th>Zeit</th>
                        <th>Temperatur</th>
                        <th>Stärke</th>
                        <th>Art</th>
                    </tr>
                    </thead>
                    <tbody>
                    {historyData.map((entry, idx) => (
                        <tr key={idx}>
                            <td>{entry.time}</td>
                            <td>{entry.temperature}</td>
                            <td>{entry.strength}</td>
                            <td>{entry.type}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="history-card">
                <h3>Kaffee-Statistik</h3>
                <p>Heute gebrüht: {coffeeCount} Tassen</p>
                <p>Beliebtestes Sortiment: {mostPopularCoffee}</p>
            </div>

            {/* Optional: WebSocket Logs anzeigen */}
            <div className="history-card">
                <h3>WebSocket Logs</h3>
                <div style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "5px",
                    fontFamily: "monospace"
                }}>
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default History;