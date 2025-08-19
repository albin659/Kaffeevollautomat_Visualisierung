import React from "react";
import { Outlet } from "react-router-dom";
import MenuBar from "./MenuBar";

const Layout = () => {
    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor:"lightgrey" }}>
            <MenuBar />
            <div className="flex-grow-1 p-4" style={{ marginLeft: "250px" }}>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
