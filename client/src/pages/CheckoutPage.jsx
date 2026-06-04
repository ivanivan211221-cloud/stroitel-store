import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { calcTotals, FREE_DELIVERY_FROM, PROMO_CODE } from "../config/commerce";

export default function CheckoutPage() {
  const { cart, total, clearCart } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: user?.name || "",
    phone: "",
    address: "",
    paymentMethod: "CARD",
    promoCode: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const { discount, deliveryFee, total: grandTotal } = calcTotals(
    total,
    form.promoCode,
    user?.promoUsed
  );

  useEffect(() => {
    if (user?.name) setForm((p) => ({ ...p, customerName: user.name }));
  }, [user?.name]);

  if (!cart.length) {
    return (
      <div className="card stack">
        <h1>Оформление заказа</h1>
        <p className="muted">Корзина пуста — добавьте товары перед оформлением.</p>
        <Link className="btn btn-primary" to="/catalog">
          В каталог
        </Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: cart.map((i) => ({ productId: i.id, qty: i.qty })),
        promoCode: form.promoCode.trim() || undefined,
      };
      const { data } = await http.post("/orders", payload);
      clearCart();
      toast.success(`Заказ #${data.orderId} создан`);
      navigate("/account");
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось оформить заказ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="stack card" onSubmit={submit}>
      <h1>Оформление заказа</h1>
      <input
        required
        placeholder="Имя"
        value={form.customerName}
        onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
      />
      <input
        required
        placeholder="Телефон"
        value={form.phone}
        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
      />
      <input
        required
        placeholder="Адрес"
        value={form.address}
        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
      />
      <select
        value={form.paymentMethod}
        onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
      >
        <option value="CARD">Онлайн-оплата (демо: сразу «Оплачен»)</option>
        <option value="CASH">При получении</option>
      </select>
      <input
        placeholder={`Промокод (${PROMO_CODE})`}
        value={form.promoCode}
        onChange={(e) => setForm((p) => ({ ...p, promoCode: e.target.value }))}
        disabled={user?.promoUsed}
      />
      {user?.promoUsed && <p className="muted">Промокод на первый заказ уже использован.</p>}
      <div className="stack checkout-summary">
        <p>Товары: {total.toLocaleString("ru-RU")} ₽</p>
        {discount > 0 && <p>Скидка: −{discount.toLocaleString("ru-RU")} ₽</p>}
        <p>
          Доставка: {deliveryFee === 0 ? "бесплатно" : `${deliveryFee.toLocaleString("ru-RU")} ₽`}
          {deliveryFee > 0 && (
            <span className="muted"> (бесплатно от {FREE_DELIVERY_FROM.toLocaleString("ru-RU")} ₽)</span>
          )}
        </p>
        <strong>К оплате: {grandTotal.toLocaleString("ru-RU")} ₽</strong>
      </div>
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Оформляем…" : "Подтвердить заказ"}
      </button>
    </form>
  );
}
