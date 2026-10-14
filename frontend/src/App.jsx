import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige">
        <div className="classic-card rounded-3xl px-8 py-6 text-center">
          <h2 className="font-classic text-3xl font-bold text-mehroon">
            Loading...
          </h2>
          <p className="text-sm text-mehroonDark/70 mt-2">
            Checking your account.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige">
        <div className="classic-card rounded-3xl px-8 py-6 text-center">
          <h2 className="font-classic text-3xl font-bold text-mehroon">
            Marketing AI
          </h2>
          <p className="text-sm text-mehroonDark/70 mt-2">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/home" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={user ? <Navigate to="/home" replace /> : <Login />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/home" replace /> : <Signup />}
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}