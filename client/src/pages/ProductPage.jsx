import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { http } from "../api/http";
import { useShop } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";

export default function ProductPage() {
  const fallbackImage =
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1400&auto=format&fit=crop";
  const { slug } = useParams();
  const { addToCart } = useShop();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [review, setReview] = useState({ rating: 5, text: "" });
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ customerName: "", phone: "", address: "" });

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    http
      .get(`/products/${slug}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error("Не удалось загрузить товар");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Нужно войти в аккаунт");
    try {
      await http.post(`/reviews/${product.id}`, { ...review, rating: Number(review.rating) });
      setReview({ rating: 5, text: "" });
      toast.success("Отзыв отправлен на модерацию");
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось отправить отзыв");
    }
  };

  const submitQuick = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Войдите в аккаунт для заказа в 1 клик");
    try {
      const { data } = await http.post("/orders/quick", {
        productId: product.id,
        ...quickForm,
        customerName: quickForm.customerName || user.name,
      });
      setQuickOpen(false);
      toast.success(`Заказ #${data.orderId} оформлен! Менеджер свяжется с вами.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось оформить заказ");
    }
  };

  if (loading) return <div className="card">Загрузка товара...</div>;
  if (notFound) {
    return (
      <div className="card stack">
        <h1>Товар не найден</h1>
        <Link className="btn btn-primary" to="/catalog">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="product-page">
      <img
        loading="lazy"
        src={product.image || fallbackImage}
        alt={product.title}
        className="product-page-img"
        onError={(e) => {
          e.currentTarget.src = fallbackImage;
        }}
      />
      <div className="stack">
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <strong className="price-big">{Number(product.price).toLocaleString("ru-RU")} ₽</strong>
        <div className="row gap-sm">
          <button type="button" className="btn btn-primary" onClick={() => addToCart(product)}>
            Добавить в корзину
          </button>
          <button type="button" className="btn" onClick={() => setQuickOpen(true)}>
            Купить в 1 клик
          </button>
        </div>

        {quickOpen && (
          <form className="card stack" onSubmit={submitQuick}>
            <h3>Заказ в 1 клик</h3>
            <input
              required
              placeholder="Имя"
              value={quickForm.customerName}
              onChange={(e) => setQuickForm((p) => ({ ...p, customerName: e.target.value }))}
            />
            <input
              required
              placeholder="Телефон"
              value={quickForm.phone}
              onChange={(e) => setQuickForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <input
              required
              placeholder="Адрес доставки"
              value={quickForm.address}
              onChange={(e) => setQuickForm((p) => ({ ...p, address: e.target.value }))}
            />
            <div className="row gap-sm">
              <button type="submit" className="btn btn-primary">
                Оформить
              </button>
              <button type="button" className="btn" onClick={() => setQuickOpen(false)}>
                Отмена
              </button>
            </div>
          </form>
        )}

        <section className="card">
          <h3>Отзывы</h3>
          {product.Reviews?.length ? (
            product.Reviews.map((r) => (
              <p key={r.id}>
                ★{r.rating} — {r.text} ({r.User?.name})
              </p>
            ))
          ) : (
            <p className="muted">Пока отзывов нет</p>
          )}
          <form className="stack" onSubmit={submitReview}>
            <select
              value={review.rating}
              onChange={(e) => setReview((p) => ({ ...p, rating: e.target.value }))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} звезд
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={review.text}
              onChange={(e) => setReview((p) => ({ ...p, text: e.target.value }))}
              placeholder="Ваш отзыв"
            />
            <button className="btn btn-primary">Отправить отзыв</button>
          </form>
        </section>
      </div>
    </div>
  );
}
