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

const sameId = (a, b) => Number(a) === Number(b);

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
      const exists = current.some((item) => sameId(item.id, product.id));
      const next = exists
        ? current.map((item) => (sameId(item.id, product.id) ? { ...item, qty: Number(item.qty || 0) + qty } : item))
        : [...current, { ...product, qty }];
      persist("hozyan_cart", next);
      return next;
    });
    toast.success("Товар добавлен в корзину");
  };

  const setQty = (id, qty) => {
    setCart((current) => {
      const next = current.map((item) => (sameId(item.id, id) ? { ...item, qty: Math.max(1, qty) } : item));
      persist("hozyan_cart", next);
      return next;
    });
  };

  const removeFromCart = (id) => {
    setCart((current) => {
      const next = current.filter((item) => !sameId(item.id, id));
      persist("hozyan_cart", next);
      return next;
    });
  };

  const isFavorite = (productId) => favorites.some((item) => sameId(item.id, productId));

  const removeFavorite = async (productOrId) => {
    const productId = typeof productOrId === "object" ? productOrId.id : productOrId;
    if (!productId) return;

    if (user) {
      try {
        await http.delete(`/favorites/${productId}`);
        setFavorites((current) => {
          const next = current.filter((item) => !sameId(item.id, productId));
          persist("hozyan_favorites", next);
          return next;
        });
        toast.success("Удалено из избранного");
      } catch {
        toast.error("Не удалось удалить из избранного");
      }
      return;
    }

    setFavorites((current) => {
      const next = current.filter((item) => !sameId(item.id, productId));
      persist("hozyan_favorites", next);
      return next;
    });
    toast.success("Удалено из избранного");
  };

  const toggleFavorite = async (product) => {
    if (isFavorite(product.id)) {
      await removeFavorite(product.id);
      return;
    }

    if (user) {
      try {
        await http.post(`/favorites/${product.id}`);
        setFavorites((current) => {
          const next = current.some((item) => sameId(item.id, product.id)) ? current : [...current, product];
          persist("hozyan_favorites", next);
          return next;
        });
        toast.success("Добавлено в избранное");
      } catch {
        toast.error("Не удалось обновить избранное");
      }
      return;
    }

    setFavorites((current) => {
      const next = current.some((item) => sameId(item.id, product.id)) ? current : [...current, product];
      persist("hozyan_favorites", next);
      return next;
    });
    toast.success("Добавлено в избранное");
  };

  const clearCart = () => {
    setCart([]);
    persist("hozyan_cart", []);
  };

  const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.qty || 0), 0);

  const value = useMemo(
    () => ({
      cart,
      cartCount,
      favorites,
      addToCart,
      setQty,
      removeFromCart,
      isFavorite,
      removeFavorite,
      toggleFavorite,
      total,
      clearCart,
      syncFavorites,
    }),
    [cart, cartCount, favorites, total, syncFavorites]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
