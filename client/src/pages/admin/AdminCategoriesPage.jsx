import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);

  const load = () => http.get("/admin/categories").then(({ data }) => setCategories(data));
  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await http.put(`/admin/categories/${editId}`, { name });
        toast.success("Категория обновлена");
      } else {
        await http.post("/admin/categories", { name });
        toast.success("Категория создана");
      }
      setName("");
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Ошибка");
    }
  };

  const remove = async (id) => {
    if (!confirm("Удалить категорию?")) return;
    try {
      await http.delete(`/admin/categories/${id}`);
      toast.success("Удалено");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось удалить");
    }
  };

  return (
    <div className="stack">
      <h1>Категории</h1>
      <form className="card row gap-sm" onSubmit={save}>
        <input
          required
          placeholder="Название категории"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {editId ? "Сохранить" : "Добавить"}
        </button>
        {editId && (
          <button type="button" className="btn" onClick={() => { setEditId(null); setName(""); }}>
            Отмена
          </button>
        )}
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td className="row gap-sm">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setEditId(c.id);
                    setName(c.name);
                  }}
                >
                  Изменить
                </button>
                {user?.role === "ADMIN" && (
                  <button type="button" className="btn btn-sm" onClick={() => remove(c.id)}>
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
