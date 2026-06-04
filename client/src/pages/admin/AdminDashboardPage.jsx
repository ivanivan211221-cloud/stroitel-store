import { useEffect, useState } from "react";
import { http } from "../../api/http";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    http.get("/admin/dashboard").then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="card">Загрузка статистики...</div>;

  return (
    <div className="stack">
      <h1>Дашборд</h1>
      <div className="grid cols-4">
        <div className="card">Заказы: <strong>{data.stats.ordersCount}</strong></div>
        <div className="card">Пользователи: <strong>{data.stats.usersCount}</strong></div>
        <div className="card">Товары: <strong>{data.stats.productsCount}</strong></div>
        <div className="card">Выручка: <strong>{Number(data.stats.totalRevenue).toLocaleString("ru-RU")} ₽</strong></div>
      </div>
      <div className="card">
        <h3>Последние заказы</h3>
        {data.latestOrders.map((o) => <p key={o.id}>#{o.id} — {o.status} — {Number(o.total).toLocaleString("ru-RU")} ₽</p>)}
      </div>
    </div>
  );
}
