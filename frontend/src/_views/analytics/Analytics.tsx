import React, {useEffect, useRef, useState} from "react";
import "./Analytics.css";
import { useWebSocket } from "../../common/context/WebSocketContext";
import { useCoffeeContext } from "../../common/context/CoffeeContext";

import { GiHeatHaze, GiManualMeatGrinder } from "react-icons/gi";
import { MdCompress, MdCoffeeMaker } from "react-icons/md";
import { BsMoisture } from "react-icons/bs";
import { VscDebugRestart } from "react-icons/vsc";
import { FiPauseCircle } from "react-icons/fi";
import { RiTempColdLine } from "react-icons/ri";
import { IoSpeedometerOutline } from "react-icons/io5";
import {BiWater} from "react-icons/bi";

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
import {useLanguage} from "../../common/context/LanguageContext";

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
    const { texts, translate } = useLanguage();

    const [temperature, setTemperature] = useState<number>(0);
    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);
    const [waterFlow, setWaterFlow] = useState<number>(0);
    const [currentState, setCurrentState] = useState<string>();
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
        if (coffees.length > 0 && currentState !== texts.state.waitState) {
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
            const newState = translate(zustand.trim());

            // When state changes to waiting or cooling, reset strength
            if (
                (currentState == texts.state.waitState) ||
                (currentState == texts.state.coolingDownState) ||
                (currentState == texts.state.heatingState) ||
                (currentState == texts.state.toStartPositionState)
            ) {
                setCurrentStrength(null);
            }

            // When brewing starts (from waiting to another state)
            if (currentState === texts.state.waitState && newState !== texts.state.waitState && coffees.length > 0) {
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
                    next = 0;
                    const resetData = [{ x: 0, y: Number(temp) }];
                    setChartData(resetData);

                    localStorage.setItem("secondsCounter", "0");
                    localStorage.setItem("chartData", JSON.stringify(resetData));

                    return next;
                }

                const newData = [...chartData, { x: next, y: Number(temp) }];
                if (newData.length > 50) newData.shift();

                setChartData(newData);

                localStorage.setItem("secondsCounter", String(next));
                localStorage.setItem("chartData", JSON.stringify(newData));

                return next;
            });
        }
    }, [logs, currentState, coffees, texts]);

    const allStates = [
        texts.state.heatingState,
        texts.state.grindingState,
        texts.state.pressingState,
        texts.state.wettingState,
        texts.state.brewingState,
        texts.state.toStartPositionState,
        texts.state.waitState,
        texts.state.coolingDownState,
    ];

    // Funktion zum Abrufen des passenden Icons für jeden Zustand
    const getStateIcon = (state: string) => {
        const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
            [texts.state.heatingState]: GiHeatHaze,
            [texts.state.grindingState]: GiManualMeatGrinder,
            [texts.state.pressingState]: MdCompress,
            [texts.state.wettingState]: BsMoisture,
            [texts.state.brewingState]: MdCoffeeMaker,
            [texts.state.toStartPositionState]: VscDebugRestart,
            [texts.state.waitState]: FiPauseCircle,
            [texts.state.coolingDownState]: RiTempColdLine,
        };

        const IconComponent = iconMap[state];
        return IconComponent ? <IconComponent size={32} /> : null;
    };

    // Funktion zur Darstellung der Stärke als visuelle Balken
    const renderStrengthDisplay = () => {
        if (currentStrength === null) {
            return <p className="numbersText">{texts.pressCoffee}</p>;
        }

        return (
            <div style={{ padding: "10px" }}>
                <p className="numbersText" style={{ marginBottom: "10px" }}>
                    {texts.strengthText}: {currentStrength}/5
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
                                    ? "#162a4f"
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
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1 className="hero-title">{texts.analytics}</h1>
                    <p className="hero-subtitle">{texts.aboutAnalytics}</p>
                </div>
            </div>

            {/* Temperatur */}
            <div className="innerDiv heatDiv">
                <div className="card-header">
                    <GiHeatHaze className="iconConfig" />
                    <p className="info-title"> {texts.heatGraph}</p>
                </div>

                <div className="chartWrapper">
                    <Line
                        data={{
                            datasets: [
                                {
                                    label: texts.temperatureChart,
                                    data: chartData,
                                    borderColor: "rgba(22,42,79,1)",
                                    backgroundColor: "rgba(22,42,79,0,2)",
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
                                    title: { display: true, text: texts.secondsChart },
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

            <div className="infoGrid">
                {/* Stärke */}
                <div className="innerDiv">
                    <div className="card-header">
                        <IoSpeedometerOutline className="iconConfig" />
                        <p className="info-title"> {texts.coffeeStrength}</p>
                    </div>

                    {renderStrengthDisplay()}
                </div>

                {/* Wasserdurchfluss */}
                <div className="innerDiv">
                    <div className="card-header">
                        <BiWater className="iconConfig" />
                        <p className="info-title">{texts.machineWaterFlow}</p>
                    </div>

                    <p className="numbersText">{waterFlow} mL/s</p>
                </div>
            </div>

            {/* Zustand */}
            <div className="innerDiv state-container">
                <p className="info-title-state">{texts.currentState}</p>

                <div className="state-grid">
                    {allStates.map((state) => (
                        <div
                            key={state}
                            className={`state-card ${state === currentState ? "state-card-active" : ""}`}
                        >
                            <div className="state-card-header">
                                {getStateIcon(state)}
                            </div>
                            <div className="state-card-body">
                                <p className="state-label">{state}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="infoGrid">
                {/* Wasser */}
                <div
                    className={`hoverInfo waterAndCoffeeStatus ${
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
                    className={`hoverInfo waterAndCoffeeStatus ${
                        coffeeGroundsContainerEmpty ? "backgroundGreen" : "backgroundRed"
                    }`}
                >
                    <p className="numbersText centerText">
                        {coffeeGroundsContainerEmpty
                            ? "Kaffeesatzbehälter frei"
                            : "Bitte Kaffeesatzbehälter leeren"}
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Analytics;