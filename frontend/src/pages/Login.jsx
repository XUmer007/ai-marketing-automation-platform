import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      await login(email, password);

      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      await googleLogin();

      navigate("/home");
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4">
      <div className="classic-card w-full max-w-md rounded-3xl p-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-mehroon">
            Marketing AI
          </p>

          <h1 className="font-classic text-4xl font-bold text-mehroonDark mt-2">
            Welcome Back
          </h1>

          <p className="text-sm text-mehroonDark/70 mt-3">
            Login to continue creating marketing plans and social media content.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-mehroon"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-mehroon"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-mehroon px-5 py-3 font-semibold text-beige shadow-lg transition hover:bg-mehroonDark disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-mehroon/20" />
          <span className="text-xs uppercase tracking-[0.25em] text-mehroonDark/50">
            OR
          </span>
          <div className="h-px flex-1 bg-mehroon/20" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-mehroonDark shadow-lg border border-mehroon/15 transition hover:bg-beigeDark disabled:opacity-70"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm mt-6 text-mehroonDark/70">
          New user?{" "}
          <Link to="/signup" className="font-bold text-mehroon">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
