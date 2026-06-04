import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { useShop } from "../context/ShopContext";

import { calcTotals, FREE_DELIVERY_FROM } from "../config/commerce";

function itemsWord(n) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return "товаров";
  if (m10 === 1) return "товар";
  if (m10 >= 2 && m10 <= 4) return "товара";
  return "товаров";
}

export default function CartPage() {
  const fallbackImage =
    "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop";
  const { cart, total, setQty, removeFromCart, clearCart } = useShop();

  const itemsCount = cart.reduce((s, i) => s + i.qty, 0);
  const { deliveryFee: delivery, total: grandTotal } = calcTotals(total, "", false);

  const bumpQty = (id, delta) => {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const next = item.qty + delta;
    if (next < 1) removeFromCart(id);
    else setQty(id, next);
  };

  if (!cart.length) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon-wrap" aria-hidden>
          <ShoppingBag size={40} strokeWidth={1.75} />
        </div>
        <h1 className="cart-empty-title">Корзина пуста</h1>
        <p className="cart-empty-text muted">
          Добавьте товары из каталога — мы доставим всё к вам.
        </p>
        <Link className="btn btn-primary cart-empty-cta" to="/catalog">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-main-col">
        <header className="cart-page-head">
          <h1 className="cart-page-title">Корзина</h1>
          <p className="muted cart-page-sub">
            {itemsCount} {itemsWord(itemsCount)}
          </p>
        </header>

        <ul className="cart-lines">
          {cart.map((item) => {
            const line = Number(item.price) * item.qty;
            const brand = item.Category?.name || "Каталог";
            return (
              <li key={item.id} className="cart-line card">
                <button
                  type="button"
                  className="cart-line-remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Удалить ${item.title}`}
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
                <img
                  loading="lazy"
                  src={item.image || fallbackImage}
                  alt=""
                  className="cart-line-img"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage;
                  }}
                />
                <div className="cart-line-info">
                  <strong className="cart-line-title">{item.title}</strong>
                  <p className="muted cart-line-meta">
                    {brand} · за единицу
                  </p>
                  <div className="cart-line-bottom">
                    <div className="cart-qty-pill">
                      <button type="button" className="cart-qty-btn" onClick={() => bumpQty(item.id, -1)} aria-label="Меньше">
                        <Minus size={16} strokeWidth={2.5} />
                      </button>
                      <span className="cart-qty-value">{item.qty}</span>
                      <button type="button" className="cart-qty-btn" onClick={() => bumpQty(item.id, 1)} aria-label="Больше">
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="cart-line-price">
                  <strong>{line.toLocaleString("ru-RU")} ₽</strong>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="cart-clear-wrap">
          <button type="button" className="cart-clear-link muted" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>
      </div>

      <aside className="cart-summary card">
        <h2 className="cart-summary-title">Ваш заказ</h2>
        <dl className="cart-summary-rows">
          <div className="cart-summary-row">
            <dt>Товары</dt>
            <dd>{total.toLocaleString("ru-RU")} ₽</dd>
          </div>
          <div className="cart-summary-row">
            <dt>Доставка</dt>
            <dd>
              {delivery === 0 ? (
                <span className="cart-summary-free">Бесплатно</span>
              ) : (
                `${delivery.toLocaleString("ru-RU")} ₽`
              )}
            </dd>
          </div>
        </dl>
        <div className="cart-summary-total">
          <span>Итого</span>
          <strong>{grandTotal.toLocaleString("ru-RU")} ₽</strong>
        </div>
        <p className="muted cart-summary-hint">
          {delivery > 0
            ? `Бесплатная доставка от ${FREE_DELIVERY_FROM.toLocaleString("ru-RU")} ₽ по товарам.`
            : "Доставка по акции включена в сумму."}
        </p>
        <Link className="btn btn-primary cart-summary-btn" to="/checkout">
          Оформить заказ
        </Link>
        <p className="cart-summary-legal muted">
          Нажимая, вы соглашаетесь с условиями оферты
        </p>
      </aside>
    </div>
  );
}
