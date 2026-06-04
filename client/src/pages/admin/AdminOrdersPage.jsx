import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock3, CreditCard, PackageCheck, PackageSearch, Truck, XCircle } from "lucide-react";
import { http } from "../../api/http";

const STATUSES = [
  { value: "", label: "Все", short: "Все" },
  { value: "NEW", label: "Новые", short: "Новый", tone: "new" },
  { value: "PAID", label: "Оплаченные", short: "Оплачен", tone: "paid" },
  { value: "PROCESSING", label: "В работе", short: "В работе", tone: "processing" },
  { value: "SHIPPED", label: "Отправленные", short: "Отправлен", tone: "shipped" },
  { value: "DELIVERED", label: "Завершенные", short: "Завершен", tone: "delivered" },
  { value: "CANCELLED", label: "Отмененные", short: "Отменен", tone: "cancelled" },
];

const STATUS_META = Object.fromEntries(STATUSES.filter((s) => s.value).map((s) => [s.value, s]));

const PAYMENT_LABELS = {
  CARD: "Карта",
  CASH: "Наличные",
};

const getQuickActions = (status) => {
  if (status === "NEW") {
    return [
      { status: "PROCESSING", label: "Принять", icon: CheckCircle2, variant: "primary" },
      { status: "PAID", label: "Подтвердить оплату", icon: CreditCard },
      { status: "CANCELLED", label: "Отменить", icon: XCircle, variant: "danger" },
    ];
  }
  if (status === "PAID") {
    return [
      { status: "PROCESSING", label: "В работу", icon: PackageSearch, variant: "primary" },
      { status: "CANCELLED", label: "Отменить", icon: XCircle, variant: "danger" },
    ];
  }
  if (status === "PROCESSING") {
    return [
      { status: "SHIPPED", label: "Отправить", icon: Truck, variant: "primary" },
      { status: "DELIVERED", label: "Завершить", icon: PackageCheck },
    ];
  }
  if (status === "SHIPPED") {
    return [{ status: "DELIVERED", label: "Завершить", icon: PackageCheck, variant: "primary" }];
  }
  return [];
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
const formatDate = (value) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await http.get("/admin/orders");
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const result = { all: orders.length };
    for (const status of Object.keys(STATUS_META)) {
      result[status] = orders.filter((order) => order.status === status).length;
    }
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (!filter) return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await http.patch(`/admin/orders/${id}/status`, { status });
      toast.success(`Заказ #${id}: ${STATUS_META[status]?.short || status}`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось обновить статус");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-orders-page stack">
      <header className="admin-page-head">
        <div>
          <h1>Заказы</h1>
          <p className="muted page-intro">Принимайте новые заявки, подтверждайте оплату и ведите заказ до завершения.</p>
        </div>
      </header>

      <div className="admin-order-tabs" role="tablist" aria-label="Фильтр заказов">
        {STATUSES.map((status) => (
          <button
            key={status.value || "all"}
            type="button"
            className={`admin-order-tab ${filter === status.value ? "active" : ""}`}
            onClick={() => setFilter(status.value)}
          >
            {status.label}
            <span>{status.value ? counts[status.value] || 0 : counts.all}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">Загрузка заказов...</div>
      ) : visibleOrders.length === 0 ? (
        <div className="card admin-orders-empty">
          <Clock3 size={24} />
          <strong>Заказов в этом статусе нет</strong>
          <p className="muted">Когда появятся новые заказы, они будут здесь.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {visibleOrders.map((order) => {
            const meta = STATUS_META[order.status] || { short: order.status, tone: "new" };
            const actions = getQuickActions(order.status);
            const isOpen = openId === order.id;
            const items = order.OrderItems || [];

            return (
              <article className="card admin-order-card" key={order.id}>
                <div className="admin-order-main">
                  <div className="admin-order-title">
                    <span className={`status-badge status-${meta.tone}`}>{meta.short}</span>
                    <div>
                      <h2>Заказ #{order.id}</h2>
                      <p className="muted">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="admin-order-total">
                    <span>Итого</span>
                    <strong>{formatMoney(order.total)}</strong>
                  </div>
                </div>

                <div className="admin-order-details">
                  <div>
                    <span>Клиент</span>
                    <strong>{order.customerName || order.User?.name || "Не указан"}</strong>
                    <p>{order.phone}</p>
                  </div>
                  <div>
                    <span>Доставка</span>
                    <strong>{order.address}</strong>
                    {order.note && <p>{order.note}</p>}
                  </div>
                  <div>
                    <span>Оплата</span>
                    <strong>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</strong>
                    <p>{order.isPaid ? "Оплата подтверждена" : "Ожидает оплаты"}</p>
                  </div>
                </div>

                <div className="admin-order-actions">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.status}
                        type="button"
                        className={`btn btn-sm ${
                          action.variant === "primary" ? "btn-primary" : action.variant === "danger" ? "btn-danger" : "btn-ghost"
                        }`}
                        disabled={updatingId === order.id}
                        onClick={() => updateStatus(order.id, action.status)}
                      >
                        <Icon size={15} />
                        {action.label}
                      </button>
                    );
                  })}
                  <select
                    className="admin-order-select"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    aria-label={`Статус заказа ${order.id}`}
                  >
                    {STATUSES.filter((status) => status.value).map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.short}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => setOpenId(isOpen ? null : order.id)}>
                    {isOpen ? "Скрыть состав" : `Состав (${items.length})`}
                  </button>
                </div>

                {isOpen && (
                  <div className="admin-order-items">
                    {items.map((item) => (
                      <div className="admin-order-item" key={item.id}>
                        <span>{item.Product?.title || "Товар удален"}</span>
                        <strong>
                          {item.qty} x {formatMoney(item.price)}
                        </strong>
                      </div>
                    ))}
                    <div className="admin-order-summary">
                      <span>Товары: {formatMoney(order.subtotal)}</span>
                      {!!Number(order.discount) && <span>Скидка: {formatMoney(order.discount)}</span>}
                      {!!Number(order.deliveryFee) && <span>Доставка: {formatMoney(order.deliveryFee)}</span>}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
