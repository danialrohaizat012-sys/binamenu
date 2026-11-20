export function formatPrice(price: number) {
  return `RM ${Number(price).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
