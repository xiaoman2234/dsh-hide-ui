/**
 * dsh-hide-ui — host half.
 *
 * Registers slash commands and injects client.js via webserver/index-inject
 * (desktop) + tapIndex (web). The real hide/show work lives in client.js.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT_PATH = '/dsh-hide-ui/client.js'
const STATE_PATH = '/dsh-hide-ui/state'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Inline script row for the official desktop shell (index-inject). */
const DESKTOP_ROW_TEXT =
  '(function(){try{var d=document.body||document.head||document.documentElement;if(!d)return;' +
  'var s=document.createElement("script");s.src="' + CLIENT_PATH + '";' +
  's.onerror=function(){};d.appendChild(s)}catch(e){}})()'

/** In-process hide flag so /hideui can report status. */
let hostHidden = false

function readClientJs() {
  const candidates = [join(HERE, 'client.js'), join(HERE, 'lib', 'client.js')]
  for (const p of candidates) {
    try {
      return readFileSync(p, 'utf8')
    } catch {}
  }
  return 'console.warn("[dsh-hide-ui] client.js not found")'
}

function resultHide() {
  hostHidden = true
  return {
    kind: 'success',
    text:
      '已请求隐藏界面。若页面未立刻响应，请按 Ctrl+Shift+H。\n' +
      '恢复：Ctrl+Shift+H 或 Esc。',
  }
}

export const name = 'dsh-hide-ui'
// Intentionally empty: apply() must run immediately so the desktop
// `webserver/index-inject` row is registered before host-start collection.
// Commands / webServer are waited for via root.inject() below.
export const inject = []

export function apply(root) {
  const rowDisposers = []
  root.effect(() => () => {
    for (const d of rowDisposers) {
      try { d() } catch {}
    }
  })

  // Desktop shell collects index-inject rows once at host start — register ASAP.
  rowDisposers.push(
    root.on('webserver/index-inject', (table) => {
      try {
        if (!Array.isArray(table)) return
        for (const row of table) {
          if (!row) continue
          if (row.kind === 'script-src' && row.src === CLIENT_PATH) return
          if (
            row.kind === 'script' &&
            typeof row.text === 'string' &&
            row.text.indexOf(CLIENT_PATH) >= 0
          ) {
            return
          }
        }
        table.push({ kind: 'script', placement: 'body', text: DESKTOP_ROW_TEXT })
      } catch {}
    }),
  )

  root.inject(['commands', 'webServer'], (ctx) => {
    try {
      if (ctx.webServer && typeof ctx.webServer.tapIndex === 'function') {
        rowDisposers.push(
          ctx.webServer.tapIndex((html) => {
            if (html.indexOf(CLIENT_PATH) !== -1) return html
            const tag = '<script defer src="' + CLIENT_PATH + '"></script>'
            if (html.indexOf('</body>') !== -1) return html.replace('</body>', tag + '</body>')
            return html + tag
          }),
        )
      }
    } catch {}

    try {
      if (ctx.webServer && typeof ctx.webServer.register === 'function') {
        rowDisposers.push(
          ctx.webServer.register({
            kind: 'exact',
            path: CLIENT_PATH,
            handler: (req, res) => {
              res.writeHead(200, {
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-store',
              })
              res.end(readClientJs())
            },
          }),
        )
        rowDisposers.push(
          ctx.webServer.register({
            kind: 'exact',
            path: STATE_PATH,
            handler: (req, res) => {
              const method = String((req && req.method) || 'GET').toUpperCase()
              if (method === 'POST' || method === 'PUT') {
                try {
                  let body = ''
                  req.on('data', (c) => {
                    body += c
                  })
                  req.on('end', () => {
                    try {
                      const j = JSON.parse(body || '{}')
                      if (typeof j.hidden === 'boolean') hostHidden = j.hidden
                    } catch {}
                    res.writeHead(200, {
                      'Content-Type': 'application/json; charset=utf-8',
                      'Cache-Control': 'no-store',
                    })
                    res.end(JSON.stringify({ hidden: hostHidden }))
                  })
                  return
                } catch {}
              }
              res.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
              })
              res.end(JSON.stringify({ hidden: hostHidden }))
            },
          }),
        )
      }
    } catch {}

    if (ctx.commands && typeof ctx.commands.register === 'function') {
      // Only /hideui: once the UI is hidden there is no composer to type into,
      // so restore is Ctrl+Shift+H / Esc — not a slash command.
      ctx.commands.register({
        name: 'hideui',
        description: '隐藏 DSH 全部界面，只留壁纸（恢复用 Ctrl+Shift+H / Esc）',
        input: { hint: '' },
        handler: () => resultHide(),
      })
    }
  })
}

export default { name, inject, apply }
