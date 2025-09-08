import React, { useEffect, useRef, useState } from "react";
import "./Analytics.css";
import {useWebSocket} from "../../common/context/WebSocketContext";

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

    const [temperature, setTemperature] = useState<number>(0);
    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);
    const [waterFlow, setWaterFlow] = useState<number>(0);
    const [currentState, setCurrentState] = useState<string>("Warten");


    const [chartData, setChartData] = useState<{ x: number; y: number }[]>(() => {
        const saved = localStorage.getItem("chartData");
        return saved ? JSON.parse(saved) : [];
    });

    const [secondsCounter, setSecondsCounter] = useState<number>(() => {
        const saved = localStorage.getItem("secondsCounter");
        return saved ? Number(saved) : 0;
    });


    useEffect(() => {
        if (logs.length === 0) return;

        const latest = logs[logs.length - 1];
        const parts = latest.split(",");

        if (parts.length >= 5) {
            const [zustand, temp, wasser, kaffeesatz, durchfluss] = parts;

            setCurrentState(zustand.trim());
            setTemperature(Number(temp));
            setWaterLevelIsGood(wasser.trim() === "1");
            setCoffeeGroundsContainerEmpty(kaffeesatz.trim() === "1");
            setWaterFlow(Number(durchfluss));

            setSecondsCounter((prev) => {
                let next = prev + 1;

                if (next >= 200) {
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
    }, [logs]);



    const allStates = [
        "Aufheizen",
        "Mahlen",
        "Pressen",
        "Anfeuchten",
        "Brühen",
        "Warten",
        "Abkühlen",
    ];

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
                                    title: {display: true, text: "Sekunden"},
                                },
                                y: {
                                    min: 0,
                                    max: 120, // fixierter Bereich für Temperatur
                                    title: {display: true, text: "°C"},
                                },
                            },
                        }}
                    />
                </div>
            </div>

            <div className="innerDiv">
                <p className="cornerText">Stärke</p>
                <p className="numbersText">Drücke einen Kaffee</p>
            </div>

            {/* Wasserdurchfluss */}
            <div className="innerDiv">
                <p className="cornerText">Wasserdurchfluss</p>
                <p className="numbersText">{waterFlow} mL/s</p>
            </div>

            {/* Zustand */}
            <div className="innerDiv">
                <p className="cornerText">Aktueller Zustand</p>
                <ol className="numbersText">
                    {allStates.map((state, idx) => (
                        <li
                            key={idx}
                            className={state === currentState ? "current-state" : ""}
                        >
                            {state}
                        </li>
                    ))}
                </ol>
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
