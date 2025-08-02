import { useState } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";


const Login = () => {
    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("userId:", userId);
        console.log("Password:", password);
        if (userId === "P0103" && password === "pass@123") {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userId", userId);
            navigate("/client"); // Redirect to dashboard
        }
        if (userId === "Admin" && password === "pass@Admin123") {
            localStorage.setItem("isLoggedInAdmin", "true");
            localStorage.setItem("userId", userId);
            navigate("/dashboard"); // Redirect to dashboard
        }
    };

    const containerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f2f2f2",
    };

    const formStyle = {
        backgroundColor: "#fff",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        width: "300px",
    };

    const inputStyle = {
        width: "100%",
        padding: "10px",
        marginBottom: "15px",
        borderRadius: "4px",
        border: "1px solid #ccc",
    };

    const buttonStyle = {
        width: "100%",
        padding: "10px",
        backgroundColor: "#007BFF",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    };

    const headingStyle = {
        textAlign: "center",
        marginBottom: "20px",
    };

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={headingStyle}>Login</h2>
                <label>User Id:</label>
                <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={inputStyle}
                    required
                />
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    required
                />
                <button type="submit" style={buttonStyle}>
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;