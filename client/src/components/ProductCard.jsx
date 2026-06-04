import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export default function ProductCard({ product }) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200&auto=format&fit=crop";
  const { addToCart, favorites, toggleFavorite } = useShop();
  const isFav = favorites.some((f) => f.id === product.id);

  return (
    <motion.article
      className="card product-card"
      whileHover={{ y: -8, boxShadow: "0 20px 36px rgba(28, 25, 23, 0.12)" }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/catalog/${product.slug}`}>
        <img
          loading="lazy"
          src={product.image || fallbackImage}
          alt={product.title}
          className="product-img"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
      </Link>
      {!!product.oldPrice && <span className="discount-badge">Акция</span>}
      <div className="product-body">
        <p className="muted">{product.Category?.name || "Категория"}</p>
        <Link to={`/catalog/${product.slug}`} className="product-title">
          {product.title}
        </Link>
        <div className="row between">
          <strong>{Number(product.price).toLocaleString("ru-RU")} ₽</strong>
          {product.oldPrice && <span className="old-price">{Number(product.oldPrice).toLocaleString("ru-RU")} ₽</span>}
        </div>
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" onClick={() => addToCart(product)}>
          <ShoppingCart size={16} /> В корзину
        </button>
        <button className={`icon-btn ${isFav ? "active" : ""}`} onClick={() => toggleFavorite(product)}>
          <Heart size={16} />
        </button>
      </div>
    </motion.article>
  );
}
