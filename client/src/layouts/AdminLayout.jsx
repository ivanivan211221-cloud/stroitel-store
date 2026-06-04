import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Boxes, ClipboardList, Users, MessageSquare, Tags, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const canUsers = user?.role === "ADMIN";

  return (
    <div className="admin-grid">
      <aside className="admin-sidebar glass">
        <h3>Панель управления</h3>
        <NavLink to="/admin">
          <BarChart3 size={16} /> Дашборд
        </NavLink>
        <NavLink to="/admin/products">
          <Boxes size={16} /> Товары
        </NavLink>
        <NavLink to="/admin/categories">
          <Tags size={16} /> Категории
        </NavLink>
        <NavLink to="/admin/orders">
          <ClipboardList size={16} /> Заказы
        </NavLink>
        {canUsers && (
          <NavLink to="/admin/users">
            <Users size={16} /> Пользователи
          </NavLink>
        )}
        <NavLink to="/admin/reviews">
          <MessageSquare size={16} /> Отзывы
        </NavLink>
        <NavLink to="/admin/contacts">
          <Mail size={16} /> Обращения
        </NavLink>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
