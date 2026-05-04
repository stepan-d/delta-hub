const isProd = process.env.NODE_ENV === 'production'

function formatContext(context: unknown): string {
  if (context instanceof Error) return ` | ${context.name}: ${context.message}`
  if (context !== undefined && context !== null && context !== '') {
    try { return ` | ${JSON.stringify(context)}` } catch { return '' }
  }
  return ''
}

export const logger = {
  error(msg: string, context?: unknown): void {
    console.error(`[ERROR] ${msg}${formatContext(context)}`)
  },
  warn(msg: string, context?: unknown): void {
    if (!isProd) console.warn(`[WARN] ${msg}${formatContext(context)}`)
  },
  info(msg: string, context?: unknown): void {
    if (!isProd) console.info(`[INFO] ${msg}${formatContext(context)}`)
  },
}
