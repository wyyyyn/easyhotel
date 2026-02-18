/** 格式化价格为人民币显示 */
export function formatPrice(price: number): string {
  return `¥${price.toFixed(0)}`;
}

/** 计算折扣价 */
export function calcDiscountPrice(originalPrice: number, discountRate: number): number {
  return Math.round(originalPrice * discountRate * 100) / 100;
}

/** 计算满减后价格 */
export function calcReductionPrice(
  originalPrice: number,
  minAmount: number,
  reduceAmount: number,
): number {
  if (originalPrice >= minAmount) {
    return originalPrice - reduceAmount;
  }
  return originalPrice;
}
