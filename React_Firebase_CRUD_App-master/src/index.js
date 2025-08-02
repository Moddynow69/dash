import React from "react";
import ReactDOM from "react-dom";
import Client from "./Client/Client";
import Dashboard from "./Dashboard/Dashboard";
import Login from "./Login/Login";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/client" element={<Client />} />
            <Route path="/" element={<Login />} />
          </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
