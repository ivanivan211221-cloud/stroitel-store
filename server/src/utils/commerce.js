const DELIVERY_FLAT = 490;
const FREE_DELIVERY_FROM = 5000;
const PROMO_CODE = "FIRST10";
const PROMO_PERCENT = 10;

const { asNumber } = require("./helpers");

function calcItemsSubtotal(items, productMap) {
  let subtotal = 0;
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Товар ${item.productId} недоступен`);
    if (product.stock < item.qty) throw new Error(`Недостаточно остатка: ${product.title}`);
    subtotal += asNumber(product.price) * item.qty;
  }
  return subtotal;
}

function calcDiscount(subtotal, promoCode, promoUsed) {
  if (!promoCode || promoUsed) return 0;
  if (String(promoCode).trim().toUpperCase() !== PROMO_CODE) return 0;
  return Math.round(subtotal * (PROMO_PERCENT / 100) * 100) / 100;
}

function calcDeliveryFee(subtotalAfterDiscount) {
  return subtotalAfterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FLAT;
}

function calcOrderTotals({ items, productMap, promoCode, promoUsed }) {
  const subtotal = calcItemsSubtotal(items, productMap);
  const discount = calcDiscount(subtotal, promoCode, promoUsed);
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = calcDeliveryFee(subtotalAfterDiscount);
  const total = Math.round((subtotalAfterDiscount + deliveryFee) * 100) / 100;
  return { subtotal, discount, deliveryFee, total, promoApplied: discount > 0 };
}

module.exports = {
  DELIVERY_FLAT,
  FREE_DELIVERY_FROM,
  PROMO_CODE,
  PROMO_PERCENT,
  calcOrderTotals,
};
