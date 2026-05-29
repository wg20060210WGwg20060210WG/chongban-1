export function resolveFileUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) return url

  // 绝对 URL：提取路径部分返回相对路径，让 Vite 代理或 nginx 处理
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      return parsed.pathname
    } catch {
      return url
    }
  }

  // 相对路径：直接返回
  return url
}

export function bustCache(url) {
  if (!url) return ''
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}
