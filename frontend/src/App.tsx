import React from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Layout from "./_views/layout/Layout";
import "bootstrap/dist/css/bootstrap.min.css";
import Dashboard from "./_views/dashboard/Dashboard";
import Preparation from "./_views/preparation/Preparation";
import Analytics from "./_views/analytics/Analytics";
import History from "./_views/history/History";
import Report from "./_views/report/Report";

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout/>}>
              <Route path="/dashboard" element={<Dashboard/>}/>
              <Route path="/preparation" element={<Preparation/>}/>
              <Route path="/analytic" element={<Analytics/>}/>
              <Route path="/history" element={<History/>}/>
              <Route path="/report" element={<Report/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export default App;
