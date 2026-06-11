/**
 * Local dev server — mirrors the Vercel serverless routes.
 * Run with: node server.js
 * Vite proxies /api/* to this on port 3001.
 */

import 'dotenv/config'
import http from 'http'

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve({}) }
    })
  })
}

function createShim(req, res) {
  const headers = {}
  return {
    status(code) { res.statusCode = code; return this },
    setHeader(k, v) { headers[k] = v; return this },
    json(data) {
      res.setHeader('Content-Type', 'application/json')
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
      res.end(JSON.stringify(data))
    }
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }

  const url = req.url.split('?')[0]
  const body = await parseBody(req)
  req.body = body

  const shimRes = createShim(req, res)

  try {
    if (url === '/api/icp-challenge') {
      const { default: handler } = await import('./api/icp-challenge.js')
      await handler(req, shimRes)
    } else if (url === '/api/icp-result') {
      const { default: handler } = await import('./api/icp-result.js')
      await handler(req, shimRes)
    } else {
      shimRes.status(404).json({ error: 'Not found' })
    }
  } catch (err) {
    console.error(err)
    shimRes.status(500).json({ error: err.message })
  }
})

server.listen(3001, () => {
  console.log('API server running on http://localhost:3001')
})
