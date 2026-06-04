import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../../api/http";
import { useAuth } from "../../context/AuthContext";

const empty = { title: "", description: "", price: "", stock: "", categoryId: "", image: "", brand: "" };

export default function AdminProductsPage() {
  const { user } = useAuth();
  const canCsv = ["ADMIN", "MANAGER"].includes(user?.role);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const imageInputRef = useRef(null);

  const resetProductForm = () => {
    setForm(empty);
    setEditId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      http.get("/admin/products"),
      http.get("/admin/categories"),
    ]);
    setProducts(p);
    setCategories(c);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const stock = Number(form.stock) || 0;
    const categoryId = Number(form.categoryId);

    if (title.length < 3) {
      toast.error("Название: минимум 3 символа");
      return;
    }
    if (description.length < 10) {
      toast.error("Описание: минимум 10 символов");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Укажите цену больше 0");
      return;
    }
    if (!categoryId) {
      toast.error("Выберите категорию");
      return;
    }

    const body = { title, description, price, stock, categoryId, brand: form.brand.trim() || undefined };
    const image = form.image.trim();
    if (image) {
      try {
        new URL(image);
        body.image = image;
      } catch {
        toast.error("Ссылка на фото: http:// или https:// (или оставьте поле пустым)");
        return;
      }
    } else if (editId) {
      body.image = "";
    }

    try {
      if (editId) {
        await http.put(`/admin/products/${editId}`, body);
        toast.success("Товар обновлён");
      } else {
        await http.post("/admin/products", body);
        toast.success("Товар создан");
      }
      resetProductForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Ошибка сохранения");
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      categoryId: String(p.categoryId),
      image: p.image || "",
      brand: p.brand || "",
    });
  };

  const remove = async (id) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await http.delete(`/admin/products/${id}`);
      if (editId === id) resetProductForm();
      toast.success("Товар удалён");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось удалить");
    }
  };

  const exportCsv = async () => {
    const { data } = await http.get("/admin/products/export/csv", { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const csv = await file.text();
      const { data } = await http.post("/admin/products/import/csv", { csv });
      toast.success(`Импортировано: ${data.imported}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Ошибка импорта");
    }
  };

  const uploadImage = async (e) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await http.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((p) => ({ ...p, image: data.url }));
      toast.success("Изображение загружено");
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
        return;
      }
      toast.error("Не удалось загрузить файл");
    } finally {
      input.value = "";
    }
  };

  return (
    <div className="stack">
      <h1>Управление товарами</h1>
      {canCsv && (
        <div className="row gap-sm">
          <button type="button" className="btn" onClick={exportCsv}>
            Экспорт CSV
          </button>
          <label className="btn">
            Импорт CSV
            <input type="file" accept=".csv" onChange={importCsv} style={{ display: "none" }} />
          </label>
        </div>
      )}
      <form className="card grid cols-2" onSubmit={save}>
        <h2 className="cols-2">{editId ? `Редактирование #${editId}` : "Новый товар"}</h2>
        <input
          required
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <input placeholder="Бренд" value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} />
        <textarea
          required
          minLength={10}
          className="cols-2"
          placeholder="Описание (не менее 10 символов)"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <input
          type="url"
          placeholder="https://... (необязательно)"
          value={form.image}
          onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
        />
        <label className="btn" title="На Render используйте URL изображения">
          Загрузить фото
          <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadImage} style={{ display: "none" }} />
        </label>
        <p className="muted cols-2" style={{ margin: 0, fontSize: "0.85rem" }}>
          На бесплатном хостинге загрузка файлов отключена — вставьте ссылку на картинку (Unsplash и т.п.).
        </p>
        <input
          type="number"
          required
          min="1"
          step="0.01"
          placeholder="Цена, ₽"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
        />
        <input
          type="number"
          required
          min="0"
          placeholder="Остаток на складе"
          value={form.stock}
          onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
        />
        <select required value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
          <option value="">Категория</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="row gap-sm cols-2">
          <button type="submit" className="btn btn-primary">
            {editId ? "Сохранить" : "Добавить товар"}
          </button>
          {editId && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                resetProductForm();
              }}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.title}</td>
                <td>{p.Category?.name}</td>
                <td>{Number(p.price).toLocaleString("ru-RU")} ₽</td>
                <td>{p.stock}</td>
                <td className="row gap-sm">
                  <button type="button" className="btn btn-sm" onClick={() => startEdit(p)}>
                    Изменить
                  </button>
                  {user?.role === "ADMIN" && (
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => remove(p.id)}>
                      Удалить
                    </button>
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
