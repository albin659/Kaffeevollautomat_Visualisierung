import React, { useState, useRef } from "react";

const Dashboard = () => {
    const [isOn, setIsOn] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    const connectToBackend = () => {
        try {
            ws.current = new WebSocket('ws://localhost:8765');

            ws.current.onopen = () => {
                setIsConnected(true);
                console.log('Mit Backend verbunden');
            };

            ws.current.onclose = () => {
                setIsConnected(false);
                setIsOn(false);
                console.log('Verbindung getrennt');
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket Fehler:', error);
                setIsConnected(false);
            };
        } catch (error) {
            console.error('Verbindungsfehler:', error);
        }
    };

    const toggleMachine = () => {
        if (!isConnected) {
            connectToBackend();
            return;
        }

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            if (!isOn) {
                // Maschine einschalten (Aufheizen)
                ws.current.send("1");
                setIsOn(true);
            } else {
                // Maschine ausschalten
                ws.current.send("5");
                setIsOn(false);
            }
        }
    };

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold">Dashboard</h1>
                <h2 className="fs-2 text-secondary">☕ Kaffeevollautomat</h2>
            </div>

            {/* Intro / Beschreibung */}
            <div className="row justify-content-center mb-5">
                <div className="col-md-8">
                    <p className="text-muted fs-5 text-center">
                        Willkommen zu unserem Diplomarbeitsprojekt! <br />
                        Wir haben einen modernen Kaffeevollautomaten digital visualisiert,
                        bei dem verschiedene Funktionen simuliert werden können. <br />
                        Über dieses Dashboard können Sie Informationen zur Maschine abrufen
                        und interaktiv steuern.
                    </p>
                </div>
            </div>

            {/* Features Section */}
            <div className="row justify-content-center mb-5">
                <div className="col-md-10">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title mb-3">Features der Maschine</h3>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">Wasserfüllstand & Temperaturanzeige</li>
                                <li className="list-group-item">Bohnenbehälter-Status</li>
                                <li className="list-group-item">Einfache Steuerung per Klick</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Button */}
            <div className="text-center">
                <button
                    className={`btn btn-lg ${
                        !isConnected ? "btn-outline-primary" :
                            isOn ? "btn-success" : "btn-outline-secondary"
                    }`}
                    onClick={toggleMachine}
                >
                    {!isConnected ? "Mit Backend verbinden" :
                        isOn ? "Maschine läuft" : "Einschalten"}
                </button>
            </div>

            {/* Optional Bild */}
            <div className="text-center mt-5">
                <img
                    src="https://images.unsplash.com/photo-1586201375761-83865001dcd2?auto=format&fit=crop&w=800&q=80"
                    alt="Kaffeevollautomat"
                    className="img-fluid rounded shadow"
                    style={{ maxHeight: "400px" }}
                />
            </div>
        </div>
    );
};

export default Dashboard;