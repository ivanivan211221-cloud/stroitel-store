import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="card">Загрузка...</div>;
  if (!user) return <Navigate to="/account" replace />;
  if (adminOnly && !["ADMIN", "MANAGER", "CONTENT_MANAGER"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
