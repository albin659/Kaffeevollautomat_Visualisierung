import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import './Menubar.css';

const MenuBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path ? "active-link" : "";

    return (
        <div className="menu-bar d-flex flex-column align-items-center bg-white vh-100 shadow">
            {/* Logo */}
            <div className="text-center mb-4">
                <img
                    src="/kaffeemaschine_logo.png"
                    alt="Logo"
                    onClick={() => navigate("/dashboard")}
                    className="img-fluid logo"
                />
                <div className="logo-text">Kaffeevollautomaten Visualisierung</div>
                <div className="logo-separator"></div>
            </div>

            {/* Navigation */}
            <ul className="nav flex-column w-100">
                <li className="nav-item">
                    <Link className={`nav-link ${isActive("/dashboard")}`} to="/dashboard">Dashboard</Link>
                    <Link className={`nav-link ${isActive("/preparation")}`} to="/preparation">Preparation</Link>
                    <Link className={`nav-link ${isActive("/analytic")}`} to="/analytic">Analytics</Link>
                    <Link className={`nav-link ${isActive("/history")}`} to="/history">History</Link>
                    <Link className={`nav-link ${isActive("/report")}`} to="/report">Report</Link>
                </li>
            </ul>

            {/* Footer */}
            <div className="mt-auto text-center small text-muted mb-3">
                <div className="footer-separator"></div>
                Diplomarbeit 2025<br/>Sensor Monitoring
            </div>
        </div>
    );
};

export default MenuBar;
