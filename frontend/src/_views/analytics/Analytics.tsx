import React, {useEffect, useState} from 'react';
import './Analytics.css';
import {ICoffee} from "../../common/models/ICoffee";
import {ICoffeMachine} from "../../common/models/ICoffeMachine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const Analytics = () => {
    const demoCoffee: ICoffee = {
        id: 1,
        type: 'Espresso',
        strength: 5,
        createdDate: "19.08.2025"
    };

    const [waterLevelIsGood, setWaterLevelIsGood] = useState(true);
    const [coffeeGroundsContainerEmpty, setCoffeeGroundsContainerEmpty] = useState(true);

    const demoMachine: ICoffeMachine = {
        isOn: true,
        hasEnoughWater: true,
        binIsNotFull: true,
        temperature: 90,
        waterFlow: 12.1,
        currentState: 'Kaffeebohnen malen'
    };

    const tempArray: number[] = [
        7, 24, 28, 45, 66, 78, 80, 99, 101, 110, 119, 125
    ];

    const allStates:String[] = [
        "Wasser erhitzen",
        "Kaffeebohnen malen",
        "Kaffeebohnen pressen",
        "Kaffeepulver anfeuchten",
        "Brühen",
        "Kaffee fertig",
    ];

    const [seconds, setSeconds] = useState(0);
    const [chartData, setChartData] = useState<{ name: string, value: number }[]>([]);

    useEffect(() => {
        let counter = 0; // zählt die echten Sekunden
        const interval = setInterval(() => {
            if (counter >= 12) {
                clearInterval(interval);
                return;
            }
            counter++;

            setSeconds(counter);

            setChartData(prev => {
                const tempValue = tempArray[(counter - 1) % tempArray.length]; // zyklisch aus tempArray
                const newData = [...prev, { name: `Sek ${counter}`, value: tempValue }];
                if (newData.length > 10) newData.shift(); // nur die letzten 10 Einträge
                return newData;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);




    return (
        <div className="outerDiv">
            <h1>Analytics</h1>

            <div className="innerDiv heatDiv">
                <p className="cornerText">Hitze</p>

                <ResponsiveContainer width="80%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis domain={[0, 1]}/>
                        <Tooltip/>
                        <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false}/>
                    </LineChart>
                </ResponsiveContainer>


            </div>

            <div className="innerDiv">
                <p className="cornerText">Stärke</p>

                <p className="numbersText">{demoCoffee.strength}</p>
            </div>

            <div className="innerDiv">
                <p className="cornerText">Wasserdurchfluss</p>

                <p className="numbersText">{demoMachine.waterFlow} mL/s</p>
            </div>

            <div className="innerDiv">
                <p className="cornerText">Aktueller Zustand</p>

                <ol className="numbersText">
                    {allStates.map((state, idx) => (
                        <li
                            key={idx}
                            className={state === demoMachine.currentState ? "current-state" : ""}
                        >
                            {state}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="innerDiv">
                <p className="cornerText">Kaffeetyp</p>

                <p className="numbersText">{demoCoffee.type}</p>
            </div>

            <div className={`waterAndCoffeeStatus ${waterLevelIsGood ? "backgroundGreen" : "backgroundRed"}`}>
                <p className="numbersText centerText">
                    {waterLevelIsGood ? "Genug Wasser vorhanden" : "Bitte Wasser nachfüllen"}
                </p>
            </div>

            <div className={`waterAndCoffeeStatus ${coffeeGroundsContainerEmpty ? "backgroundGreen" : "backgroundRed"}`}>
                <p className="numbersText centerText">
                    {coffeeGroundsContainerEmpty ? "Kaffee sub ist nicht voll" : "Bitte Kaffeesatzbehälter leeren"}
                </p>
            </div>

        </div>
    );
};

export default Analytics;