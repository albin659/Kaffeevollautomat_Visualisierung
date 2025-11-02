import React, { useEffect, useRef, useState } from "react";
import "./Analytics.css";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const Analytics = () => {
    const { logs } = useWebSocket();
    const { coffees } = useCoffeeContext();

    const [temperature, setTemperature] = useState<number>(0);
    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);
    const [waterFlow, setWaterFlow] = useState<number>(0);
    const [currentState, setCurrentState] = useState<string>("Warten");
    const [currentStrength, setCurrentStrength] = useState<number | null>(null);

    const [chartData, setChartData] = useState<{ x: number; y: number }[]>(() => {
        const saved = localStorage.getItem("chartData");
        return saved ? JSON.parse(saved) : [];
    });

    const [secondsCounter, setSecondsCounter] = useState<number>(() => {
        const saved = localStorage.getItem("secondsCounter");
        return saved ? Number(saved) : 0;
    });

    // Überwache Änderungen in coffees und setze die Stärke des letzten Kaffees
    useEffect(() => {
        if (coffees.length > 0 && currentState !== "Warten") {
            const latestCoffee = coffees[coffees.length - 1];
            setCurrentStrength(latestCoffee.strength);
        }
    }, [coffees, currentState]);

    useEffect(() => {
        if (logs.length === 0) return;

        const latest = logs[logs.length - 1];
        const parts = latest.split(",");

        if (parts.length >= 5) {
            const [zustand, temp, wasser, kaffeesatz, durchfluss] = parts;
            const newState = zustand.trim();

            // Wenn der Status zu "Warten" wechselt, setze die Stärke zurück
            if ((newState === "Warten" && currentState !== "Warten") || (newState === "Abkühlen" && currentState !== "Abkühlen")) {
                setCurrentStrength(null);
            }

            // Wenn ein Brühvorgang beginnt (von Warten zu einem anderen Status)
            if (currentState === "Warten" && newState !== "Warten" && coffees.length > 0) {
                const latestCoffee = coffees[coffees.length - 1];
                setCurrentStrength(latestCoffee.strength);
            }

            setCurrentState(newState);
            setTemperature(Number(temp));
            setWaterLevelIsGood(wasser.trim() === "1");
            setCoffeeGroundsContainerEmpty(kaffeesatz.trim() === "1");
            setWaterFlow(Number(durchfluss));

            setSecondsCounter((prev) => {
                let next = prev + 1;

                if (next >= 500) {
                    // Reset sauber machen
                    next = 0;
                    const resetData = [{ x: 0, y: Number(temp) }];

                    setChartData(resetData);

                    localStorage.setItem("secondsCounter", "0");
                    localStorage.setItem("chartData", JSON.stringify(resetData));

                    return next;
                }

                // normalen Schritt machen
                const newData = [...chartData, { x: next, y: Number(temp) }];
                if (newData.length > 50) newData.shift();

                setChartData(newData);

                localStorage.setItem("secondsCounter", String(next));
                localStorage.setItem("chartData", JSON.stringify(newData));

                return next;
            });
        }
    }, [logs, currentState, coffees]);

    const allStates = [
        "Aufheizen",
        "Mahlen",
        "Pressen",
        "Anfeuchten",
        "Brühen",
        "Zur Startposition",
        "Warten",
        "Abkühlen",
    ];

    // Funktion zur Darstellung der Stärke als visuelle Balken
    const renderStrengthDisplay = () => {
        if (currentStrength === null) {
            return <p className="numbersText">Drücke einen Kaffee</p>;
        }

        return (
            <div style={{ padding: "10px" }}>
                <p className="numbersText" style={{ marginBottom: "10px" }}>
                    Stärke: {currentStrength}/5
                </p>
                <div style={{
                    display: "flex",
                    gap: "3px",
                    justifyContent: "center"
                }}>
                    {[1, 2, 3, 4, 5].map((level) => (
                        <div
                            key={level}
                            style={{
                                width: "20px",
                                height: "30px",
                                backgroundColor: level <= currentStrength
                                    ? "#8884d8"
                                    : "#e0e0e0",
                                borderRadius: "3px",
                                transition: "background-color 0.3s"
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="outerDiv">
            <h1>Analytics</h1>

            {/* Temperatur */}
            <div className="innerDiv heatDiv">
                <p className="cornerText">Hitze</p>
                <div className="chartWrapper">
                    <Line
                        data={{
                            datasets: [
                                {
                                    label: "Temperatur",
                                    data: chartData,
                                    borderColor: "rgba(136,132,216,1)",
                                    backgroundColor: "rgba(136,132,216,0.2)",
                                    tension: 0.3,
                                },
                            ],
                        }}
                        options={{
                            responsive: true,
                            animation: false, // verhindert Flackern
                            scales: {
                                x: {
                                    type: "linear",
                                    min: Math.max(secondsCounter - 20, 0),
                                    max: secondsCounter,
                                    title: { display: true, text: "Sekunden" },
                                },
                                y: {
                                    min: 0,
                                    max: 120, // fixierter Bereich für Temperatur
                                    title: { display: true, text: "°C" },
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {/* Stärke */}
            <div className="innerDiv">
                <p className="cornerText">Stärke</p>
                {renderStrengthDisplay()}
            </div>

            {/* Wasserdurchfluss */}
            <div className="innerDiv">
                <p className="cornerText">Wasserdurchfluss</p>
                <p className="numbersText">{waterFlow} mL/s</p>
            </div>

            {/* Zustand */}
            <div className="innerDiv state-container">
                <p className="cornerText">Aktueller Zustand</p>

                <div className="state-grid">
                    {allStates.map((state) => (
                        <div
                            key={state}
                            className={`state-card ${state === currentState ? "state-card-active" : ""}`}
                        >
                            <div className="state-card-header">
                                <img
                                    className="state-logo"
                                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%23ccc'/%3E%3C/svg%3E"
                                    alt={state}
                                />
                            </div>
                            <div className="state-card-body">
                                <p className="state-label">{state}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wasser */}
            <div
                className={`waterAndCoffeeStatus ${
                    waterLevelIsGood ? "backgroundGreen" : "backgroundRed"
                }`}
            >
                <p className="numbersText centerText">
                    {waterLevelIsGood
                        ? "Genug Wasser vorhanden"
                        : "Bitte Wasser nachfüllen"}
                </p>
            </div>

            {/* Kaffeesatz */}
            <div
                className={`waterAndCoffeeStatus ${
                    coffeeGroundsContainerEmpty ? "backgroundGreen" : "backgroundRed"
                }`}
            >
                <p className="numbersText centerText">
                    {coffeeGroundsContainerEmpty
                        ? "Kaffeesatzbehälter frei"
                        : "Bitte Kaffeesatzbehälter leeren"}
                </p>
            </div>

            {/* Debug */}
            <div>
                <h2>Status (letzte 5 Nachrichten)</h2>
                {logs.slice(-5).map((m, i) => (
                    <div key={i}>{m}</div>
                ))}
            </div>
        </div>
    );
};

export default Analytics;