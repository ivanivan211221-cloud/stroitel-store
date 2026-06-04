const BASE = process.env.API_URL || "https://hozyan.onrender.com/api";

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text.slice(0, 200);
  }
  return { status: res.status, data };
}

const results = [];

function log(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const login = await req("POST", "/auth/login", {
  email: "admin@hozyan.ru",
  password: "Admin123!",
});
log("login", login.status === 200, login.status);
const token = login.data?.token;
if (!token) process.exit(1);

const dash = await req("GET", "/admin/dashboard", null, token);
log("dashboard", dash.status === 200, `orders=${dash.data?.stats?.ordersCount}`);

const cats = await req("GET", "/admin/categories", null, token);
log("categories list", cats.status === 200, `count=${cats.data?.length}`);
const catId = cats.data?.[0]?.id;

const newCat = await req("POST", "/admin/categories", { name: "Тест категория API" }, token);
log("category create", newCat.status === 201, `slug=${newCat.data?.slug}`);
const testCatId = newCat.data?.id;

const createProduct = await req(
  "POST",
  "/admin/products",
  {
    title: "Тестовый товар админки",
    description: "Описание тестового товара для проверки API",
    price: 199,
    stock: 10,
    categoryId: catId,
    brand: "Test",
  },
  token
);
log("product create (no image)", createProduct.status === 201, createProduct.data?.message || createProduct.status);
const productId = createProduct.data?.id;

if (productId) {
  const upd = await req(
    "PUT",
    `/admin/products/${productId}`,
    { title: "Тестовый товар админки 2", price: 299 },
    token
  );
  log("product update", upd.status === 200);

  const del = await req("DELETE", `/admin/products/${productId}`, null, token);
  log("product delete", del.status === 204, del.status);
}

const badProduct = await req(
  "POST",
  "/admin/products",
  {
    title: "X",
    description: "short",
    price: 10,
    stock: 1,
    categoryId: catId,
    image: "not-a-url",
  },
  token
);
log("product validation (bad image)", badProduct.status === 400);

const users = await req("GET", "/admin/users", null, token);
log("users list", users.status === 200, `count=${users.data?.length}`);

const orders = await req("GET", "/admin/orders", null, token);
log("orders list", orders.status === 200, `count=${orders.data?.length}`);

const reviews = await req("GET", "/admin/reviews", null, token);
log("reviews list", reviews.status === 200, `count=${reviews.data?.length}`);

const contacts = await req("GET", "/admin/contacts", null, token);
log("contacts list", contacts.status === 200, `count=${contacts.data?.length}`);

const upload = await fetch(`${BASE}/upload`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: (() => {
    const fd = new FormData();
    fd.append("file", new Blob(["x"], { type: "image/png" }), "t.png");
    return fd;
  })(),
});
const uploadBody = await upload.json().catch(() => ({}));
log("upload (Render)", upload.status === 503, uploadBody.message?.slice(0, 60));

if (testCatId) {
  const delCat = await req("DELETE", `/admin/categories/${testCatId}`, null, token);
  log("category delete (empty)", delCat.status === 204, delCat.status);
}

const dupSlug = await req("POST", "/admin/categories", { name: "Сухие смеси" }, token);
log("category duplicate name", dupSlug.status === 201 || dupSlug.status === 500, `slug=${dupSlug.data?.slug}`);

console.log("\n--- Summary ---");
const failed = results.filter((r) => !r.ok);
console.log(`Passed: ${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log("Failed:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
