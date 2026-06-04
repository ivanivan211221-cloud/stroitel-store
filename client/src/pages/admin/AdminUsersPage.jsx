import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const isAdmin = me?.role === "ADMIN";

  const load = () => http.get("/admin/users").then(({ data }) => setUsers(data));
  useEffect(() => {
    load();
  }, []);

  const patchUser = async (id, body) => {
    try {
      await http.patch(`/admin/users/${id}`, body);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Недостаточно прав");
    }
  };

  return (
    <div className="stack">
      <h1>Пользователи</h1>
      {!isAdmin && (
        <p className="muted card">Просмотр доступен всем менеджерам. Изменять роли может только ADMIN.</p>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Блок</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {isAdmin ? (
                    <select value={u.role} onChange={(e) => patchUser(u.id, { role: e.target.value })}>
                      {["ADMIN", "MANAGER", "CONTENT_MANAGER", "CUSTOMER"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    u.role
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <input
                      type="checkbox"
                      checked={u.isBlocked}
                      onChange={(e) => patchUser(u.id, { isBlocked: e.target.checked })}
                    />
                  ) : (
                    u.isBlocked ? "да" : "нет"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
