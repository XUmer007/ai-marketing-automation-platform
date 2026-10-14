import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full border-b border-mehroon/10 bg-beige/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-classic text-2xl font-bold text-mehroon">
            Marketing AI
          </h2>
          <p className="text-xs text-mehroonDark/60">
            Smart Plans. Premium Posts. Social Growth.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {user?.photo && (
            <img
              src={user.photo}
              alt={user.name}
              className="h-10 w-10 rounded-full border-2 border-mehroon/20"
            />
          )}

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-mehroonDark">
              {user?.name}
            </p>
            <p className="text-xs text-mehroonDark/60">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-mehroon/30 px-5 py-2 text-sm font-semibold text-mehroon hover:bg-mehroon hover:text-beige transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}