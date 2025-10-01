import React, { useMemo } from "react";
import "./History.css";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";

const History = () => {
    const { logs } = useWebSocket();
    const { coffees } = useCoffeeContext();

    // Statistiken berechnen
    const statistics = useMemo(() => {
        const todaysCoffees = coffees.filter(coffee => {
            const coffeeDate = new Date(coffee.createdDate).toDateString();
            const today = new Date().toDateString();
            return coffeeDate === today;
        });

        const coffeeTypes = coffees.reduce((acc, coffee) => {
            acc[coffee.type] = (acc[coffee.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostPopular = Object.entries(coffeeTypes).reduce((a, b) =>
            a[1] > b[1] ? a : b, ["Kein Kaffee", 0]
        )[0];

        return {
            todayCount: todaysCoffees.length,
            totalCount: coffees.length,
            mostPopularType: mostPopular
        };
    }, [coffees]);

    // Formatierung für Datum und Zeit
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('de-DE'),
            time: date.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    return (
        <div className="history-container">
            <h2>History</h2>

            <div className="history-card">
                <h3>Kaffee-Verlauf</h3>
                {coffees.length > 0 ? (
                    <table className="history-table">
                        <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Zeit</th>
                            <th>Art</th>
                            <th>Stärke</th>
                        </tr>
                        </thead>
                        <tbody>
                        {coffees.slice().reverse().map((coffee) => {
                            const { date, time } = formatDateTime(coffee.createdDate);
                            return (
                                <tr key={coffee.id}>
                                    <td>{date}</td>
                                    <td>{time}</td>
                                    <td>{coffee.type}</td>
                                    <td>{coffee.strength}/5</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (
                    <p style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666'
                    }}>
                        Noch keine Kaffees zubereitet
                    </p>
                )}
            </div>

            <div className="history-card">
                <h3>Kaffee-Statistik</h3>
                <p>Heute gebrüht: <strong>{statistics.todayCount}</strong> Tassen</p>
                <p>Gesamt gebrüht: <strong>{statistics.totalCount}</strong> Tassen</p>
                <p>Beliebteste Sorte: <strong>{statistics.mostPopularType}</strong></p>
            </div>

            {/* Debug */}
            <div className="history-card">
                <h3>WebSocket Logs</h3>
                <div style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "#f5f5f5",
                    padding: "10px",
                    borderRadius: "5px",
                    fontFamily: "monospace",
                    fontSize: "0.9rem"
                }}>
                    {logs.length > 0 ? (
                        logs.map((log, index) => (
                            <div key={index}>{log}</div>
                        ))
                    ) : (
                        <p style={{ color: '#999', margin: 0 }}>
                            Keine Logs vorhanden
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;