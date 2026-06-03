import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve('dist')
const port = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173)

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function fileForUrl(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname)
  const candidate = resolve(root, normalize(pathname).replace(/^[/\\]+/, ''))
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return join(root, 'index.html')
  }
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate
  }
  return join(root, 'index.html')
}

createServer((request, response) => {
  const file = fileForUrl(request.url || '/')
  response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
  createReadStream(file)
    .on('error', () => {
      response.writeHead(404)
      response.end('Not found')
    })
    .pipe(response)
}).listen(port, '0.0.0.0', () => {
  console.log(`Serving frontend dist on 0.0.0.0:${port}`)
})
