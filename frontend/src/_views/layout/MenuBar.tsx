import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";

const MenuBar = () => {

    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="bg-white text-dark vh-100 p-3 shadow d-flex flex-column align-items-center"
             style={{ width: "250px", position: "fixed", left: 0, top: 0 }}>

            <div className="text-center mb-3">
                <img
                    src="/logo_kaffeevollautomat.png"
                    alt="Logo"
                    onClick={() => navigate("/dashboard")}
                    className="img-fluid"
                    style={{ maxWidth: "180px", height: "auto" }}
                />
            </div>

            <ul className="nav flex-column w-100 text-center flex-grow-1">
                <li className="nav-item">
                    <Link className={`nav-link text-dark fs-5 ${location.pathname === "/dashboard" ? "fw-bold" : ""}`} to="/dashboard">
                        Dashboard
                    </Link>
                    <Link className={`nav-link text-dark fs-5 ${location.pathname === "/preparation" ? "fw-bold" : ""}`} to="/preparation">
                        Preparation
                    </Link>
                    <Link className={`nav-link text-dark fs-5 ${location.pathname === "/analytic" ? "fw-bold" : ""}`} to="/analytic">
                        Analytics
                    </Link>
                    <Link className={`nav-link text-dark fs-5 ${location.pathname === "/history" ? "fw-bold" : ""}`} to="/history">
                        History
                    </Link>
                    <Link className={`nav-link text-dark fs-5 ${location.pathname === "/report" ? "fw-bold" : ""}`} to="/report">
                        Report
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default MenuBar;