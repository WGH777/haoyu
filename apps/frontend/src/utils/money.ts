/**
 * 煜米金额格式化工具
 * 后端以"分"存储，前端以"煜米"显示
 * 1 煜米 = 1 RMB = 100 分
 */

/** 金额(分) → 煜米显示，整数不显示 .00 */
export function formatYumiFromCent(value?: number | null): string {
  const cents = Number(value || 0)
  const yumi = cents / 100
  if (!Number.isFinite(yumi)) return '0 煜米'
  return Number.isInteger(yumi)
    ? `${yumi.toFixed(0)} 煜米`
    : `${yumi.toFixed(2)} 煜米`
}

/** 金额(分) → 紧凑煜米显示（无空格） */
export function formatYumiCompactFromCent(value?: number | null): string {
  const cents = Number(value || 0)
  const yumi = cents / 100
  if (!Number.isFinite(yumi)) return '0煜米'
  return Number.isInteger(yumi)
    ? `${yumi.toFixed(0)}煜米`
    : `${yumi.toFixed(2)}煜米`
}

/** 煜米输入 → 分(提交用) */
export function yumiToCent(value: number | string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * 100)
}
