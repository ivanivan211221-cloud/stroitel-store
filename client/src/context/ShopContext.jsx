import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../api/http";
import { useAuth } from "./AuthContext";

const ShopContext = createContext(null);

const fromStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(fromStorage("hozyan_cart", []));
  const [favorites, setFavorites] = useState(fromStorage("hozyan_favorites", []));

  const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  const syncFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await http.get("/favorites");
      setFavorites(data);
      persist("hozyan_favorites", data);
    } catch {
      /* Favorites are optional for guests. */
    }
  }, [user]);

  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  const addToCart = (product, qty = 1) => {
    setCart((current) => {
      const exists = current.some((item) => item.id === product.id);
      const next = exists
        ? current.map((item) => (item.id === product.id ? { ...item, qty: item.qty + qty } : item))
        : [...current, { ...product, qty }];
      persist("hozyan_cart", next);
      return next;
    });
    toast.success("Товар добавлен в корзину");
  };

  const setQty = (id, qty) => {
    setCart((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
      persist("hozyan_cart", next);
      return next;
    });
  };

  const removeFromCart = (id) => {
    setCart((current) => {
      const next = current.filter((item) => item.id !== id);
      persist("hozyan_cart", next);
      return next;
    });
  };

  const toggleFavorite = async (product) => {
    const exists = favorites.some((f) => f.id === product.id);
    if (user) {
      try {
        if (exists) {
          await http.delete(`/favorites/${product.id}`);
          const next = favorites.filter((f) => f.id !== product.id);
          setFavorites(next);
          persist("hozyan_favorites", next);
          toast.success("Удалено из избранного");
        } else {
          await http.post(`/favorites/${product.id}`);
          const next = [...favorites, product];
          setFavorites(next);
          persist("hozyan_favorites", next);
          toast.success("Добавлено в избранное");
        }
        return;
      } catch {
        toast.error("Не удалось обновить избранное");
        return;
      }
    }
    const next = exists ? favorites.filter((f) => f.id !== product.id) : [...favorites, product];
    setFavorites(next);
    persist("hozyan_favorites", next);
    toast.success(exists ? "Удалено из избранного" : "Добавлено в избранное");
  };

  const clearCart = () => {
    setCart([]);
    persist("hozyan_cart", []);
  };

  const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 0), 0);
  const value = useMemo(
    () => ({ cart, cartCount, favorites, addToCart, setQty, removeFromCart, toggleFavorite, total, clearCart, syncFavorites }),
    [cart, cartCount, favorites, total, syncFavorites]
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
