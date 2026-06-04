import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  CreditCard,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Percent,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { http } from "../api/http";
import { PROMO_CODE } from "../config/commerce";

const STATUS_META = {
  NEW: { label: "Новый", tone: "new", icon: Clock3 },
  PAID: { label: "Оплачен", tone: "paid", icon: CreditCard },
  PROCESSING: { label: "В работе", tone: "processing", icon: ShoppingBag },
  SHIPPED: { label: "Отправлен", tone: "shipped", icon: Truck },
  DELIVERED: { label: "Завершен", tone: "delivered", icon: PackageCheck },
  CANCELLED: { label: "Отменен", tone: "cancelled", icon: XCircle },
};

const PAYMENT_LABELS = {
  CARD: "Карта",
  CASH: "Наличные при получении",
};

const ROLE_LABELS = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  CONTENT_MANAGER: "Контент-менеджер",
  CUSTOMER: "Покупатель",
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
const formatDate = (value) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

export default function AccountPage() {
  const { user, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    http
      .get("/orders/my")
      .then(({ data }) => setOrders(data))
      .catch((err) => toast.error(err.response?.data?.message || "Не удалось загрузить заказы"))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const activeStatuses = new Set(["NEW", "PAID", "PROCESSING", "SHIPPED"]);
    return {
      totalOrders: orders.length,
      activeOrders: orders.filter((order) => activeStatuses.has(order.status)).length,
      totalSpend: orders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((sum, order) => sum + Number(order.total || 0), 0),
    };
  }, [orders]);

  const displayName = user?.name?.trim() || "Покупатель";
  const avatarLetter = displayName[0]?.toUpperCase();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(form);
        toast.success(`Аккаунт создан. Промокод: ${PROMO_CODE}`);
      } else {
        await login({ email: form.email, password: form.password });
        toast.success("Добро пожаловать");
      }
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Ошибка входа");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <section className="account-auth-page">
        <div className="account-auth-copy">
          <span className="account-kicker">
            <Sparkles size={16} />
            Кабинет покупателя
          </span>
          <h1>Заказы, скидки и покупки в одном месте</h1>
          <p className="muted">
            Войдите, чтобы видеть историю заказов, пользоваться промокодом и быстрее оформлять новые покупки.
          </p>
        </div>

        <div className="account-auth-grid">
          <form className="card account-auth-card" onSubmit={submit}>
            <div className="account-auth-tabs" aria-label="Вход или регистрация">
              <button type="button" className={!isRegister ? "active" : ""} onClick={() => setIsRegister(false)}>
                Вход
              </button>
              <button type="button" className={isRegister ? "active" : ""} onClick={() => setIsRegister(true)}>
                Регистрация
              </button>
            </div>

            <div>
              <h2>{isRegister ? "Создать аккаунт" : "Войти в кабинет"}</h2>
              <p className="muted">{isRegister ? "Первый заказ будет со скидкой 10%." : "Введите email и пароль."}</p>
            </div>

            {isRegister && (
              <label className="account-field">
                <span>Имя</span>
                <input
                  required
                  placeholder="Как к вам обращаться"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
            )}
            <label className="account-field">
              <span>Email</span>
              <input
                required
                type="email"
                placeholder="mail@example.ru"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </label>
            <label className="account-field">
              <span>Пароль</span>
              <input
                required
                type="password"
                minLength={6}
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </label>

            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? "Проверяем..." : isRegister ? "Создать аккаунт" : "Войти"}
            </button>
          </form>

          <aside className="account-benefits">
            <div className="account-benefit-card">
              <Percent size={22} />
              <div>
                <strong>{PROMO_CODE}</strong>
                <p>Скидка 10% на первый заказ после регистрации.</p>
              </div>
            </div>
            <div className="account-benefit-card">
              <Receipt size={22} />
              <div>
                <strong>История заказов</strong>
                <p>Статусы, состав и суммы всегда под рукой.</p>
              </div>
            </div>
            <div className="account-benefit-card">
              <ShieldCheck size={22} />
              <div>
                <strong>Данные защищены</strong>
                <p>Доступ к заказам только после входа.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page">
      <div className="account-hero card">
        <div className="account-user">
          <div className="account-avatar" aria-hidden>
            {avatarLetter || <UserRound size={28} />}
          </div>
          <div>
            <span className="account-kicker">Личный кабинет</span>
            <h1>{displayName}</h1>
            <p className="muted">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
        </div>
        <div className="account-user-actions">
          <a className="btn btn-ghost" href={`mailto:${user.email}`}>
            <Mail size={16} />
            {user.email}
          </a>
          <button type="button" className="btn btn-outline" onClick={logout}>
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </div>

      <div className="account-stat-grid">
        <div className="account-stat-card card">
          <ShoppingBag size={20} />
          <span>Всего заказов</span>
          <strong>{stats.totalOrders}</strong>
        </div>
        <div className="account-stat-card card">
          <Clock3 size={20} />
          <span>Активные</span>
          <strong>{stats.activeOrders}</strong>
        </div>
        <div className="account-stat-card card">
          <Receipt size={20} />
          <span>Покупки</span>
          <strong>{formatMoney(stats.totalSpend)}</strong>
        </div>
        <div className="account-stat-card card">
          <Percent size={20} />
          <span>Промокод</span>
          <strong>{user.promoUsed ? "Использован" : PROMO_CODE}</strong>
        </div>
      </div>

      {!user.promoUsed && (
        <div className="account-promo card">
          <div>
            <span className="account-kicker">Ваша скидка</span>
            <h2>{PROMO_CODE}</h2>
            <p className="muted">Введите промокод в корзине и получите 10% на первый заказ.</p>
          </div>
          <Link className="btn btn-primary" to="/catalog">
            К покупкам
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <section className="account-orders-section">
        <div className="section-head">
          <div>
            <h2>История заказов</h2>
            <p className="muted section-sub">Следите за статусами и составом своих покупок.</p>
          </div>
          <Link className="btn btn-outline" to="/catalog">
            В каталог
          </Link>
        </div>

        {ordersLoading ? (
          <div className="card">Загружаем заказы...</div>
        ) : orders.length ? (
          <div className="account-orders-list">
            {orders.map((order) => {
              const meta = STATUS_META[order.status] || { label: order.status, tone: "new", icon: Clock3 };
              const StatusIcon = meta.icon;
              const items = order.OrderItems || [];

              return (
                <article className="card account-order-card" key={order.id}>
                  <div className="account-order-head">
                    <div>
                      <span className={`status-badge status-${meta.tone}`}>
                        <StatusIcon size={14} />
                        {meta.label}
                      </span>
                      <h3>Заказ #{order.id}</h3>
                      <p className="muted">{formatDate(order.createdAt)}</p>
                    </div>
                    <strong>{formatMoney(order.total)}</strong>
                  </div>

                  <div className="account-order-meta">
                    <span>
                      <MapPin size={15} />
                      {order.address}
                    </span>
                    <span>
                      <CreditCard size={15} />
                      {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                    </span>
                    {!!Number(order.discount) && (
                      <span>
                        <Percent size={15} />
                        Скидка {formatMoney(order.discount)}
                      </span>
                    )}
                  </div>

                  <div className="account-order-items">
                    {items.map((item) => (
                      <div className="account-order-item" key={item.id}>
                        <span>{item.Product?.title || "Товар удален"}</span>
                        <strong>
                          {item.qty} x {formatMoney(item.price)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card account-empty-orders">
            <ShoppingBag size={26} />
            <h3>Заказов пока нет</h3>
            <p className="muted">Выберите товары в каталоге, а история покупок появится здесь.</p>
            <Link className="btn btn-primary" to="/catalog">
              Перейти в каталог
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
