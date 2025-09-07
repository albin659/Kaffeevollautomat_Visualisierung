import React from "react";
import {useWebSocket} from "../../common/context/WebSocketContext";

const Dashboard = () => {
    const { send, isConnected, logs, isOn, setIsOn, setIsReady } = useWebSocket();

    const toggleMachine = () => {
        console.log("🖱️ Button gedrückt: ToggleMachine");
        if (!isConnected) {
            console.warn("⚠️ Maschine nicht verbunden");
            return;
        }

        if (!isOn) {
            console.log("▶️ Einschalten & Aufheizen");
            send("1");
            setIsOn(true);
            setIsReady(false);
        } else {
            console.log("⏹ Ausschalten");
            send("5");
            setIsOn(false);
            setIsReady(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold">Dashboard</h1>
                <h2 className="fs-2 text-secondary">☕ Kaffeevollautomat</h2>
            </div>

            <div className="text-center mb-4">
                <button
                    className={`btn btn-lg ${
                        !isConnected
                            ? "btn-outline-primary"
                            : isOn
                                ? "btn-success"
                                : "btn-outline-secondary"
                    }`}
                    onClick={toggleMachine}
                    disabled={!isConnected}
                >
                    {!isConnected
                        ? "Verbinden..."
                        : isOn
                            ? "Maschine läuft"
                            : "Einschalten"}
                </button>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <h5 className="card-title">📜 Status & Logs</h5>
                    <div
                        className="bg-light rounded p-3"
                        style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                        {logs.length === 0 ? (
                            <p className="text-muted">Noch keine Meldungen...</p>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="text-monospace small">
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
