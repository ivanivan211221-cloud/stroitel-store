export const DELIVERY_FLAT = 490;
export const FREE_DELIVERY_FROM = 5000;
export const PROMO_CODE = "FIRST10";

export function calcDeliveryFee(subtotalAfterDiscount) {
  return subtotalAfterDiscount >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FLAT;
}

export function calcDiscount(subtotal, promoCode, promoUsed) {
  if (!promoCode || promoUsed) return 0;
  if (String(promoCode).trim().toUpperCase() !== PROMO_CODE) return 0;
  return Math.round(subtotal * 0.1 * 100) / 100;
}

export function calcTotals(subtotal, promoCode, promoUsed) {
  const discount = calcDiscount(subtotal, promoCode, promoUsed);
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = calcDeliveryFee(afterDiscount);
  const total = Math.round((afterDiscount + deliveryFee) * 100) / 100;
  return { discount, deliveryFee, total, afterDiscount };
}
