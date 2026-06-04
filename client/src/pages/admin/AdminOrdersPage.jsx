import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../../api/http";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const load = () => http.get("/admin/orders").then(({ data }) => setOrders(data));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await http.patch(`/admin/orders/${id}/status`, { status });
      toast.success("Статус обновлен");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось обновить статус");
    }
  };

  return (
    <div className="stack">
      <h1>Заказы</h1>
      {orders.map((o) => (
        <div className="card row between" key={o.id}>
          <div>
            <strong>#{o.id}</strong> — {o.User?.name} — {Number(o.total).toLocaleString("ru-RU")} ₽
          </div>
          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
            {["NEW", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
