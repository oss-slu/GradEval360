
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/protected-route";

//log_In
function Login() {
  const handleLogin = () => {
    window.location.href =
      "http://localhost:3000/api/auth/signin/okta";
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login Page</h1>
      <button onClick={handleLogin}>
        Sign in with Okta
      </button>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard Page</h1>
      <p>You are authenticated.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      //Root route 
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      //Public route
      <Route path="/login" element={<Login />} />

      //Protected routes
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}