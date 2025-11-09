import React, { useMemo } from "react";
import "./History.css";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";
import {useLanguage} from "../../common/context/LanguageContext";

const History = () => {
    const { logs } = useWebSocket();
    const { coffees } = useCoffeeContext();
    const { texts } = useLanguage();

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

    const cupLabel = useMemo(() => {
        const todayCount = statistics.todayCount;
        if (todayCount === 1) return texts.historySingleCup;
        if (todayCount === 0) return texts.cups;
        return texts.cups;
    }, [statistics.todayCount, texts]);

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
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{texts.history}</h1>
                    <p className="hero-subtitle">{texts.aboutHistory}</p>
                </div>
            </div>

            <div className="history-card">
                <div className="card-headerHistory">
                    <p className="info-titleHistory">{texts.historyHeader}</p>
                </div>


                {coffees.length > 0 ? (
                    <table className="history-table">
                        <thead>
                        <tr>
                            <th>{texts.historyDateTable}</th>
                            <th>{texts.historyTimeTable}</th>
                            <th>{texts.historyTypeTable}</th>
                            <th>{texts.historyStrengthTable}</th>
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
                <p className="info-titleHistory">{texts.historyCoffeeStatistic}</p>
                <p>{texts.historyTodayBrews}: <strong>{statistics.todayCount}</strong> {cupLabel}</p>
                <p>{texts.historyTotalBrews}: <strong>{statistics.totalCount}</strong> {cupLabel}</p>
                <p>{texts.historyFavoriteType}: <strong>{statistics.mostPopularType}</strong></p>
            </div>
        </div>
    );
};

export default History;