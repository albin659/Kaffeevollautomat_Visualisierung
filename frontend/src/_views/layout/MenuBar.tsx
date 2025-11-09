import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Switch } from '@mui/material';
import './Menubar.css';
import HomeIcon from '@mui/icons-material/Home';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import {useLanguage} from "../../common/context/LanguageContext";

const MenuBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, setLanguage, texts } = useLanguage();

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
                <div className="logo-text">{texts.menuBarLogoText}</div>

                {/* Language Switch mit Flaggen */}
                <div className="language-switch mt-3 d-flex align-items-center justify-content-center gap-2">
                    <span style={{
                        opacity: language === 'de' ? 1 : 0.5,
                        transform: language === 'de' ? 'scale(1.1)' : 'scale(0.9)',
                        transition: 'all 0.3s ease'
                    }}>
                        <img
                            src="/de.JPG"
                            alt="Deutsch"
                            style={{
                                width: '24px',
                                height: '16px',
                                objectFit: 'cover',
                                borderRadius: '2px',
                                border: '1px solid #e0e0e0'
                            }}
                        />
                    </span>
                    <Switch
                        checked={language === 'en'}
                        onChange={(e) => setLanguage(e.target.checked ? 'en' : 'de')}
                        color="primary"
                        size="small"
                    />
                    <span style={{
                        opacity: language === 'en' ? 1 : 0.5,
                        transform: language === 'en' ? 'scale(1.1)' : 'scale(0.9)',
                        transition: 'all 0.3s ease'
                    }}>
                        <img
                            src="/en.JPG"
                            alt="English"
                            style={{
                                width: '24px',
                                height: '16px',
                                objectFit: 'cover',
                                borderRadius: '2px',
                                border: '1px solid #e0e0e0'
                            }}
                        />
                    </span>
                </div>

                <div className="logo-separator"></div>
            </div>

            {/* Navigation */}
            <ul className="nav flex-column w-100">
                <li className="nav-item">
                    <Link className={`nav-link ${isActive("/dashboard")}`} to="/dashboard">
                        <HomeIcon/> {texts.dashboard}
                    </Link>
                    <Link className={`nav-link ${isActive("/preparation")}`} to="/preparation">
                        <LocalCafeIcon/> {texts.preparation}
                    </Link>
                    <Link className={`nav-link ${isActive("/analytic")}`} to="/analytic">
                        <AnalyticsIcon/> {texts.analytics}
                    </Link>
                    <Link className={`nav-link ${isActive("/history")}`} to="/history">
                        <HistoryIcon/> {texts.history}
                    </Link>
                    <Link className={`nav-link ${isActive("/report")}`} to="/report">
                        <DescriptionIcon/> {texts.report}
                    </Link>
                </li>
            </ul>

            <div className="mt-auto text-center small text-muted mb-3">
                <div className="footer-separator"></div>
                Diplomarbeit 2025<br/>Sensor Monitoring
            </div>
        </div>
    );
};

export default MenuBar;