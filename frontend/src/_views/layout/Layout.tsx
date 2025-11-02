import React from "react";
import { Outlet } from "react-router-dom";
import MenuBar from "./MenuBar";

const Layout = () => {
    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor:"white" }}>
            <MenuBar />
            <div className="flex-grow-1 p-3" style={{
                marginLeft: "250px",
                maxWidth: "calc(100vw - 250px)",
                boxSizing: "border-box"
            }}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;