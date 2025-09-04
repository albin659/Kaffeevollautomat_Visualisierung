import React, {useEffect, useRef, useState} from 'react';
import './Analytics.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCoffeeMachine } from "../../common/client/WSClient";

const Analytics = () => {
    const { messages, machineReady, send } = useCoffeeMachine();

    const [temperature, setTemperature] = useState<number>(0);
    const [waterLevelIsGood, setWaterLevelIsGood] = useState<boolean>(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState<boolean>(true);
    const [waterFlow, setWaterFlow] = useState<number>(0);
    const [currentState, setCurrentState] = useState<string>("Warten");
    const [chartData, setChartData] = useState<{ name: string, value: number }[]>([]);

    const secondsCounter = useRef(0);

    useEffect(() => {
        if (messages.length === 0) return;

        const latest = messages[messages.length - 1];
        const parts = latest.split(",");

        if (parts.length >= 6) {
            const [zustand, temp, wasser, kaffeesatz, durchfluss] = parts;

            setCurrentState(zustand.trim());
            setTemperature(Number(temp));
            setWaterLevelIsGood(wasser.trim() === "1");
            setCoffeeGroundsContainerEmpty(kaffeesatz.trim() === "1");
            setWaterFlow(Number(durchfluss));

            secondsCounter.current += 1;
            const secondLabel = `Sek ${secondsCounter.current}`;

            setChartData(prev => {
                const newData = [...prev, { name: secondLabel, value: Number(temp) }];
                if (newData.length > 20) newData.shift();
                return newData;
            });
        }
    }, [messages]);

    const allStates = [
        "Aufheizen",
        "Mahlen",
        "Pressen",
        "Anfeuchten",
        "Brühen",
        "Warten",
        "Abkühlen"
    ];

    return (
        <div className="outerDiv">
            <h1>Analytics</h1>

            {/* Temperatur */}
            <div className="innerDiv heatDiv">
                <p className="cornerText">Hitze</p>
                <div className="chartWrapper">
                    <ResponsiveContainer width="90%" height="80%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="name"/>
                            <YAxis/>
                            <Tooltip/>
                            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="innerDiv"><p className="cornerText">Stärke</p> <p
                className="numbersText">Drücke einen Kaffee</p>
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
            <div className={`waterAndCoffeeStatus ${waterLevelIsGood ? "backgroundGreen" : "backgroundRed"}`}>
                <p className="numbersText centerText">
                    {waterLevelIsGood ? "Genug Wasser vorhanden" : "Bitte Wasser nachfüllen"}
                </p>
            </div>

            {/* Kaffeesatz */}
            <div
                className={`waterAndCoffeeStatus ${coffeeGroundsContainerEmpty ? "backgroundGreen" : "backgroundRed"}`}>
                <p className="numbersText centerText">
                    {coffeeGroundsContainerEmpty ? "Kaffeesatzbehälter frei" : "Bitte Kaffeesatzbehälter leeren"}
                </p>
            </div>

            {/* Debug */}
            <div>
                <h2>Status</h2>
                {messages.slice(-5).map((m, i) => (
                    <div key={i}>{m}</div>
                ))}
            </div>
        </div>
    );
};

export default Analytics;