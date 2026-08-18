// 零依赖静态文件服务器：用于本地预览 VitePress 构建产物（.vitepress/dist）
// 支持 clean URL 回退：/世界设定/ → /世界设定/index.html；/人物设定/神机 → /人物设定/神机.html
// 用法：node _工具/serve-static.mjs <站点目录> [端口]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? '.')
const port = Number(process.argv[3] ?? 4173)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
}

async function resolveFile(pathname) {
  let file = normalize(join(root, pathname))
  if (!file.startsWith(normalize(root))) return null
  const candidates = [file, file + '.html', join(file, 'index.html')]
  for (const c of candidates) {
    try {
      const body = await readFile(c)
      return { body, type: types[extname(c)] ?? 'application/octet-stream' }
    } catch {
      /* try next candidate */
    }
  }
  return null
}

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    const hit = await resolveFile(pathname === '/' ? '/index.html' : pathname)
    if (!hit) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
      return
    }
    res.writeHead(200, { 'content-type': hit.type })
    res.end(hit.body)
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(String(e))
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}/`)
})
