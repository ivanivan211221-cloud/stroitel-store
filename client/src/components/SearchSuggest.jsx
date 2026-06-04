import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";

export default function SearchSuggest() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!q.trim()) return setItems([]);
      const { data } = await http.get(`/products/suggestions?q=${encodeURIComponent(q)}`);
      setItems(data);
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <div className="search-wrap">
      <input
        placeholder="Найти материалы, инструмент, бренд…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {items.length > 0 && (
        <div className="search-popup">
          {items.map((item) => (
            <Link key={item.id} to={`/catalog/${item.slug}`} onClick={() => setQ("")}>
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
