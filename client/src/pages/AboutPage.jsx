import { useEffect, useState } from "react";
import { Building2, Truck, Users, Award } from "lucide-react";
import { http } from "../api/http";

const VALUES = [
  { title: "Качество", text: "Только сертифицированные товары и проверенные бренды." },
  { title: "Скорость", text: "Доставка по с. Беляевка за 24 часа, по регионам — 2–4 дня." },
  { title: "Поддержка", text: "Помогаем выбрать материал и рассчитать количество." },
];

function formatCount(n) {
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return String(n);
}

export default function AboutPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    http.get("/site/stats").then(({ data }) => setStats(data));
  }, []);

  const STATS = stats
    ? [
        { icon: Building2, value: formatCount(stats.productsCount), label: "товаров в каталоге" },
        { icon: Truck, value: formatCount(stats.ordersCount), label: "оформленных заказов" },
        { icon: Users, value: formatCount(stats.usersCount), label: "клиентов" },
        { icon: Award, value: stats.avgRating ? String(stats.avgRating) : "—", label: "средний рейтинг" },
      ]
    : [];

  return (
    <div className="about-page">
      <div className="about-hero">
        <img
          className="about-logo"
          src="/logo-hozyan.png"
          alt="Хозяин — строительный магазин"
          width={280}
          height={100}
          loading="eager"
        />
        <h1 className="about-title">Строим вместе с 2010 года</h1>
        <p className="about-lead muted">
          «Хозяин» — команда профессионалов, которая помогает строителям и семьям находить
          материалы по честным ценам. Работаем напрямую с заводами, держим складской запас и
          сопровождаем заказ от подбора до доставки на объект.
        </p>
      </div>

      <ul className="about-stat-grid">
        {STATS.map(({ icon: Icon, value, label }) => (
          <li key={label} className="about-stat-card card">
            <span className="about-stat-icon" aria-hidden>
              <Icon size={22} strokeWidth={2} />
            </span>
            <strong className="about-stat-value">{value}</strong>
            <span className="about-stat-label muted">{label}</span>
          </li>
        ))}
      </ul>

      <ul className="about-values-grid">
        {VALUES.map(({ title, text }) => (
          <li key={title} className="about-value-card card">
            <h2 className="about-value-title">{title}</h2>
            <p className="muted about-value-text">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
