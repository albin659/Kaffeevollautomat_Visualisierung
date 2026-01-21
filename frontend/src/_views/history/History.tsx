import React, { useMemo } from "react";
import "./History.css";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useLanguage } from "../../common/context/LanguageContext";

const History = () => {
    const { coffeeHistory } = useWebSocket();
    const { texts } = useLanguage();

    // Statistiken berechnen
    const statistics = useMemo(() => {
        const today = new Date().toDateString();

        let todayCount = 0;
        // Record für Anzahl der Kaffees mit "Name": Anzahl
        const coffeeTypes: Record<string, number> = {};

        // durch useState coffeeHistory iterieren
        for (const coffee of coffeeHistory) {
            const coffeeDate = new Date(coffee.createdDate).toDateString();

            if (coffeeDate === today) {
                todayCount++;
            }

            if (coffeeTypes[coffee.type])
                coffeeTypes[coffee.type]++;
            else
                coffeeTypes[coffee.type] = 1;


        }

        const mostPopularType =
            Object.entries(coffeeTypes).length > 0
                ? Object.entries(coffeeTypes).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                )[0]
                : texts.historyNoCoffeMadeYet;

        return {
            todayCount,
            totalCount: coffeeHistory.length,
            mostPopularType,
        };
    }, [coffeeHistory, texts.historyNoCoffeMadeYet]);

    const cupLabel =
        statistics.todayCount === 1
            ? texts.historySingleCup
            : texts.cups;

    const reversedHistory = useMemo(
        () => coffeeHistory.slice().reverse(),
        [coffeeHistory]
    );

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

                {reversedHistory.length > 0 ? (
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
                        {reversedHistory.map((coffee) => {
                            const { date, time } = formatDateTime(
                                coffee.createdDate
                            );
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
                    <p
                        style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#666",
                        }}
                    >{texts.historyNoCoffeMadeYet}</p>
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
