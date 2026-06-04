import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../../api/http";

export default function AdminContactsPage() {
  const [messages, setMessages] = useState([]);

  const load = () => http.get("/admin/contacts").then(({ data }) => setMessages(data));
  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await http.patch(`/admin/contacts/${id}/read`);
    toast.success("Отмечено прочитанным");
    load();
  };

  return (
    <div className="stack">
      <h1>Сообщения с сайта</h1>
      {!messages.length && <p className="muted">Пока нет обращений</p>}
      {messages.map((m) => (
        <article key={m.id} className={`card stack ${m.isRead ? "muted" : ""}`}>
          <strong>
            {m.name} — {m.email}
          </strong>
          <p>{m.message}</p>
          <p className="muted">{new Date(m.createdAt).toLocaleString("ru-RU")}</p>
          {!m.isRead && (
            <button type="button" className="btn btn-sm" onClick={() => markRead(m.id)}>
              Прочитано
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
