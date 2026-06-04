import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { http } from "../api/http";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { useSearchParams } from "react-router-dom";

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    min: "",
    max: "",
    sort: "newest",
  });

  useEffect(() => {
    http.get("/categories").then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setFilters((p) => ({
      ...p,
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
    }));
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.category) params.set("category", filters.category);
    params.set("min", String(filters.min || 0));
    params.set("max", String(filters.max || 999999));
    params.set("sort", filters.sort);
    http
      .get(`/products?${params.toString()}`)
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [filters.q, filters.category, filters.min, filters.max, filters.sort]);

  const items = useMemo(() => products, [products]);

  return (
    <div className="stack">
      <header>
        <h1>Каталог</h1>
        <p className="muted page-intro">
          Фильтры по категории и цене, сортировка по новизне и наличию — выберите позиции для заказа.
        </p>
      </header>
      <div className="catalog-layout">
        <aside className="filters glass">
          <input
            placeholder="Поиск"
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="muted">Цена от, ₽</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={filters.min}
            onChange={(e) => setFilters((p) => ({ ...p, min: e.target.value }))}
          />
          <label className="muted">Цена до, ₽</label>
          <input
            type="number"
            min="0"
            placeholder="Без ограничения"
            value={filters.max}
            onChange={(e) => setFilters((p) => ({ ...p, max: e.target.value }))}
          />
          <select value={filters.sort} onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}>
            <option value="newest">Сначала новые</option>
            <option value="priceAsc">Цена по возрастанию</option>
            <option value="priceDesc">Цена по убыванию</option>
            <option value="stockDesc">По наличию</option>
          </select>
        </aside>

        <motion.div className="grid products-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((p) => <ProductCard key={p.id} product={p} />)}
        </motion.div>
      </div>
    </div>
  );
}
