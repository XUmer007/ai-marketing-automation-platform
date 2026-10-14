import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);

      await signup(name, email, password);

      navigate("/home");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError("");
      setLoading(true);

      await googleLogin();

      navigate("/home");
    } catch (err) {
      setError(err.message || "Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4 py-10">
      <div className="classic-card w-full max-w-md rounded-3xl p-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-mehroon">
            Start Your Growth
          </p>

          <h1 className="font-classic text-4xl font-bold text-mehroonDark mt-2">
            Create Account
          </h1>

          <p className="text-sm text-mehroonDark/70 mt-3">
            Sign up to start creating marketing plans and social media content
            for your business.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-mehroon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-mehroon"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-mehroon px-5 py-3 font-semibold text-beige shadow-lg transition hover:bg-mehroonDark disabled:opacity-70"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="mx-4 text-sm text-gray-500">OR</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm mt-6 text-mehroonDark/70">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-mehroon">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
