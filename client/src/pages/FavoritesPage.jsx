import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useShop();

  if (!favorites.length) {
    return (
      <div className="stack">
        <h1>Избранное</h1>
        <p className="muted">Добавляйте товары сердечком в каталоге.</p>
        <Link className="btn btn-primary" to="/catalog">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <h1>
        <Heart size={28} aria-hidden /> Избранное
      </h1>
      <div className="grid products-grid">
        {favorites.map((p) => (
          <div className="favorite-card-wrap" key={p.id}>
            <ProductCard product={p} />
            <button type="button" className="btn btn-outline favorite-remove-btn" onClick={() => removeFavorite(p.id)}>
              <Trash2 size={16} />
              Убрать из избранного
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
