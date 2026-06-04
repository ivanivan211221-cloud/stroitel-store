import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Trees,
  Wrench,
  PaintBucket,
  LayoutGrid,
  Zap,
  Boxes,
  Truck,
  ShieldCheck,
  Headphones,
  Star,
  ArrowRight,
} from "lucide-react";
import { http } from "../api/http";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { Link } from "react-router-dom";

function categoryIcon(name) {
  const n = String(name).toLowerCase();
  if (n.includes("цемент") || n.includes("смес") || n.includes("сух")) return Package;
  if (n.includes("лес") || n.includes("пил") || n.includes("дерев")) return Trees;
  if (n.includes("инструмент") || n.includes("креп")) return Wrench;
  if (n.includes("краск") || n.includes("лак") || n.includes("грунт")) return PaintBucket;
  if (n.includes("плитк") || n.includes("камн")) return LayoutGrid;
  if (n.includes("электр") || n.includes("свет") || n.includes("кабел")) return Zap;
  if (n.includes("изоля") || n.includes("утепл")) return Boxes;
  return Boxes;
}

function formatCount(n) {
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  return String(n);
}

export default function HomePage() {
  const heroPhoto =
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const discounted = useMemo(
    () => products.filter((p) => p.oldPrice && Number(p.oldPrice) > Number(p.price)),
    [products],
  );
  const displayProducts = useMemo(() => {
    const base = discounted.length ? discounted : products;
    return base.slice(0, 8);
  }, [discounted, products]);

  useEffect(() => {
    Promise.all([
      http.get("/products?sort=newest"),
      http.get("/categories"),
      http.get("/site/stats"),
    ])
      .then(([productsData, categoriesData, statsData]) => {
        setProducts(productsData.data);
        setCategories(categoriesData.data.slice(0, 8));
        setStats(statsData.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const productCount = products.length;

  return (
    <div className="home-page">
      <section className="hero-split" aria-labelledby="hero-heading">
        <motion.div
          className="hero-split-inner"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="hero-split-copy">
            <Link to="/catalog" className="hero-promo-badge">
              <Star className="hero-promo-badge-star" size={15} strokeWidth={2} fill="currentColor" aria-hidden />
              Скидки до 30% на цемент и смеси
            </Link>
            <h1 id="hero-heading" className="hero-split-title">
              Всё для стройки. <span className="hero-split-title-accent">По-хозяйски.</span>
            </h1>
            <p className="hero-split-desc muted">
              Тысячи позиций строительных материалов и инструментов с доставкой за 24 часа. Честные
              цены, проверенные бренды.
            </p>
            <div className="hero-split-actions">
              <Link className="btn btn-primary btn-hero-cta" to="/catalog">
                Смотреть каталог
                <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
              </Link>
              <Link className="btn btn-hero-secondary" to="/about">
                О компании
              </Link>
            </div>
            <ul className="hero-split-stats" aria-label="Ключевые показатели">
              <li>
                <strong>{loading ? "—" : formatCount(productCount)}</strong>
                <span>товаров</span>
              </li>
              <li>
                <strong>24 ч</strong>
                <span>доставка</span>
              </li>
              <li>
                <strong>{stats?.avgRating ?? "—"}</strong>
                <span>рейтинг</span>
              </li>
            </ul>
          </div>
          <div className="hero-split-visual">
            <img
              className="hero-split-photo"
              src={heroPhoto}
              width={600}
              height={720}
              alt="Строительные материалы и инструмент"
              loading="eager"
            />
            <div className="hero-float-card hero-float-card--tr">
              <span className="hero-float-icon hero-float-icon--ink" aria-hidden>
                <ShieldCheck size={22} strokeWidth={2} />
              </span>
              <p className="hero-float-text">Гарантия качества на все товары</p>
            </div>
            <div className="hero-float-card hero-float-card--bl">
              <span className="hero-float-icon hero-float-icon--yellow" aria-hidden>
                <Truck size={22} strokeWidth={2} />
              </span>
              <p className="hero-float-text">Бесплатная доставка от 5 000 ₽</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Категории</h2>
            <p className="muted section-sub">Найдите всё, что нужно для вашего проекта</p>
          </div>
          <Link to="/catalog" className="btn btn-outline">
            Все категории
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((c) => {
            const Icon = categoryIcon(c.name);
            return (
              <Link key={c.id} to={`/catalog?category=${c.id}`} className="category-card">
                <span className="category-card-icon" aria-hidden>
                  <Icon size={26} strokeWidth={1.75} />
                </span>
                <span className="category-card-name">{c.name}</span>
                <span className="category-card-cta muted">В раздел</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <h2>Хиты продаж</h2>
            <p className="muted section-sub">Что чаще всего выбирают наши клиенты</p>
          </div>
          <Link to="/catalog" className="btn btn-outline">
            В каталог
          </Link>
        </div>
        <motion.div
          className="grid products-grid"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : displayProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </motion.div>
      </section>

      <section className="promo-panel">
        <div>
          <h2 className="promo-title">Скидка 10% на первый заказ</h2>
          <p className="muted promo-text">
            Зарегистрируйтесь и используйте промокод <strong>FIRST10</strong> при оформлении первого
            заказа — скидка 10%.
          </p>
          <div className="promo-actions">
            <Link className="btn btn-primary" to="/account">
              Зарегистрироваться
            </Link>
            <Link className="btn btn-ghost" to="/catalog">
              В каталог
            </Link>
          </div>
        </div>
      </section>

      <section className="features-row">
        <article className="feature-card">
          <h3>Доставка за 24 часа</h3>
          <p className="muted">По с. Беляевка и району; в регионы — от 2 до 4 дней.</p>
        </article>
        <article className="feature-card">
          <h3>Гарантия качества</h3>
          <p className="muted">Работаем только с проверенными поставщиками и брендами.</p>
        </article>
        <article className="feature-card">
          <h3>Поддержка 24/7</h3>
          <p className="muted">Поможем подобрать материалы и оформить заказ.</p>
        </article>
      </section>

      <section className="section-block muted-banner">
        <div className="support-inline">
          <Headphones className="support-inline-icon" strokeWidth={2} aria-hidden />
          <p>
            Нужна консультация по объекту?{" "}
            <Link to="/contacts" className="link-accent">
              Напишите нам
            </Link>{" "}
            или позвоните — подскажем по смете и наличию.
          </p>
        </div>
      </section>
    </div>
  );
}
