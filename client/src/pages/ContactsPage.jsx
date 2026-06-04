import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { http } from "../api/http";

export default function ContactsPage() {
  const [site, setSite] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    http.get("/site/config").then(({ data }) => setSite(data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await http.post("/contacts", form);
      toast.success("Спасибо! Мы свяжемся с вами в ближайшее время.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  const CONTACT_BLOCKS = site
    ? [
        { icon: Phone, label: "Телефон", main: site.phone, sub: "Бесплатно по России", href: `tel:${site.phoneTel}` },
        { icon: Mail, label: "Email", main: site.email, sub: "Ответим в течение часа", href: `mailto:${site.email}` },
        { icon: MapPin, label: "Адрес", main: site.address, sub: "Склад и пункт выдачи", href: null },
        { icon: Clock, label: "График работы", main: site.workHours, sub: "Приём заказов онлайн 24/7", href: null },
      ]
    : [];

  return (
    <section className="contacts-page">
      <header className="contacts-header">
        <h1>Контакты</h1>
        <p className="muted contacts-sub">Мы на связи — звоните, пишите, приезжайте.</p>
      </header>

      <div className="contacts-grid">
        {CONTACT_BLOCKS.map(({ icon: Icon, label, main, sub, href }) => (
          <article key={label} className="contact-card glass">
            <Icon size={22} aria-hidden />
            <p className="contact-label">{label}</p>
            {href ? (
              <a href={href} className="contact-main">
                {main}
              </a>
            ) : (
              <p className="contact-main">{main}</p>
            )}
            <p className="muted contact-sub">{sub}</p>
          </article>
        ))}
      </div>

      <form className="card stack contacts-form" onSubmit={submit}>
        <h2>Напишите нам</h2>
        <input
          required
          placeholder="Имя"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <textarea
          required
          rows={5}
          placeholder="Сообщение"
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
        />
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? "Отправка…" : "Отправить"}
        </button>
      </form>
    </section>
  );
}
