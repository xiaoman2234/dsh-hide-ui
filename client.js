/**
 * dsh-hide-ui — browser half.
 *
 * Hides the whole DSH chrome so a wallpaper (e.g. dsh-plugin-wallpaper-engine)
 * can be enjoyed full-bleed. Restore with Ctrl+Shift+H / Esc only
 * (no corner pill — the top-right is the window caption buttons).
 *
 * Loaded two ways (both supported):
 *   1. dsh.client module  — window.__ModuleLoader__.load + apply(ctx)
 *   2. plain <script>     — self-init immediately (whale-widget style fallback)
 */
;(function () {
  'use strict'

  // Guard: dsh.client module load + index-inject <script> may both run this file.
  if (typeof window !== 'undefined' && window.__dshHideUiLoaded) return
  if (typeof window !== 'undefined') window.__dshHideUiLoaded = true

  var STYLE_ID = 'dsh-hide-ui-style'
  var ATTR = 'data-dsh-hide-ui'
  var STORAGE_KEY = 'dsh-hide-ui:enabled'
  var TOGGLE_KEY = 'KeyH'

  var hidden = false
  var bootstrapped = false
  var syncTimer = null

  var STATE_URL = '/dsh-hide-ui/state'

  function pushState() {
    if (typeof fetch !== 'function') return
    try {
      fetch(STATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: hidden }),
        keepalive: true,
      }).catch(function () {})
    } catch (e) {}
  }

  function pullState() {
    if (typeof fetch !== 'function') return
    try {
      fetch(STATE_URL, { cache: 'no-store' })
        .then(function (r) {
          return r.ok ? r.json() : null
        })
        .then(function (j) {
          if (!j || typeof j.hidden !== 'boolean') return
          if (j.hidden !== hidden) setHidden(j.hidden, { fromHost: true })
        })
        .catch(function () {})
    } catch (e) {}
  }

  function storageGet() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch (e) {
      return false
    }
  }

  function storageSet(on) {
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
    } catch (e) {}
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return
    var style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = [
      /* Hide every body child except wallpaper layers. */
      'body[' + ATTR + '] > *:not(.we-layer):not(.we-scrim):not(.we-fx):not(script):not(style):not(link):not(noscript) {',
      '  visibility: hidden !important;',
      '  opacity: 0 !important;',
      '  pointer-events: none !important;',
      '  transition: none !important;',
      '}',

      /* Belt-and-suspenders: known DSH chrome anchors (in case they are nested). */
      'body[' + ATTR + '] #root,',
      'body[' + ATTR + '] .dshDesktopFrame,',
      'body[' + ATTR + '] .dshDesktopFrameTitlebar,',
      'body[' + ATTR + '] .dshDesktopSidebarSurface,',
      'body[' + ATTR + '] .dshDesktopConversationSurface,',
      'body[' + ATTR + '] [data-slot="sidebar"],',
      'body[' + ATTR + '] [data-sidebar-right-panel],',
      'body[' + ATTR + '] [data-composer-seat],',
      'body[' + ATTR + '] [data-composer-card],',
      'body[' + ATTR + '] [data-conversation-region],',
      'body[' + ATTR + '] [data-conversation-scroll],',
      'body[' + ATTR + '] [data-chat-flow],',
      'body[' + ATTR + '] [data-dsh-navbar],',
      'body[' + ATTR + '] [data-dsh-better-sidebar],',
      'body[' + ATTR + '] [role="dialog"],',
      'body[' + ATTR + '] .we-picker,',
      'body[' + ATTR + '] .we-rope,',
      'body[' + ATTR + '] .we-dock,',
      'body[' + ATTR + '] .we-mascot,',
      'body[' + ATTR + '] .we-notice {',
      '  visibility: hidden !important;',
      '  opacity: 0 !important;',
      '  pointer-events: none !important;',
      '}',

      /* Wallpaper layers stay on screen and keep their own pointer-events. */
      'body[' + ATTR + '] .we-layer,',
      'body[' + ATTR + '] .we-scrim,',
      'body[' + ATTR + '] .we-fx {',
      '  visibility: visible !important;',
      '}',

      /* Drop the scrim so the raw wallpaper is fully visible. */
      'body[' + ATTR + '].dsh-hide-ui-no-scrim .we-scrim {',
      '  opacity: 0 !important;',
      '  visibility: hidden !important;',
      '}',

      /* Keep the page from painting a solid chrome colour over the wallpaper. */
      'body[' + ATTR + '] {',
      '  background: transparent !important;',
      '}',
    ].join('\n')
    ;(document.head || document.documentElement).appendChild(style)
  }

  function setHidden(next, opts) {
    hidden = !!next
    ensureStyle()
    var body = document.body
    if (!body) return

    if (hidden) {
      body.setAttribute(ATTR, 'on')
      // Pure wallpaper: hide the scrim too.
      body.classList.add('dsh-hide-ui-no-scrim')
    } else {
      body.removeAttribute(ATTR)
      body.classList.remove('dsh-hide-ui-no-scrim')
    }
    storageSet(hidden)
    if (!opts || !opts.fromHost) pushState()
    try {
      window.dispatchEvent(
        new CustomEvent('dsh-hide-ui', { detail: { hidden: hidden } }),
      )
    } catch (e) {}
  }

  function toggle() {
    setHidden(!hidden)
  }

  function isEditableTarget(t) {
    if (!t || !t.tagName) return false
    var tag = String(t.tagName).toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (t.isContentEditable) return true
    return false
  }

  function onKeyDown(ev) {
    // Ctrl+Shift+H (Cmd+Shift+H on macOS) toggles.
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === TOGGLE_KEY) {
      ev.preventDefault()
      ev.stopPropagation()
      toggle()
      return
    }
    // Esc restores while hidden (unless the user is typing somewhere).
    if (hidden && ev.key === 'Escape' && !isEditableTarget(ev.target)) {
      ev.preventDefault()
      ev.stopPropagation()
      setHidden(false)
    }
  }

  function bindGlobal() {
    if (bootstrapped) return
    bootstrapped = true
    ensureStyle()
    document.addEventListener('keydown', onKeyDown, true)
    // Restore previous preference once the DOM is ready.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        if (storageGet()) setHidden(true)
      })
    } else if (storageGet()) {
      setHidden(true)
    }
    // Two-way sync with host /hideui (page → host on toggle, host → page on poll).
    syncTimer = window.setInterval(pullState, 2000)
  }

  /** Cordis client-plugin entry (dsh.client path). */
  function apply(ctx) {
    bindGlobal()

    // Optional: slash-menu action when ui-commands is present.
    // Only /hideui — after hiding there is no composer; restore is Ctrl+Shift+H / Esc.
    try {
      if (ctx && ctx.commandUi && typeof ctx.commandUi.register === 'function') {
        ctx.commandUi.register({
          name: 'hideui',
          label: function () {
            return '隐藏界面'
          },
          description: function () {
            return '隐藏 DSH 全部界面，只留壁纸欣赏（恢复：Ctrl+Shift+H / Esc）'
          },
          available: function () {
            return true
          },
          ui: {
            kind: 'action',
            run: function () {
              setHidden(true)
            },
          },
        })
      }
    } catch (e) {}

    return function teardown() {
      try {
        setHidden(false)
        document.removeEventListener('keydown', onKeyDown, true)
        if (syncTimer) {
          window.clearInterval(syncTimer)
          syncTimer = null
        }
        bootstrapped = false
      } catch (e) {}
    }
  }

  // ── dual boot ──────────────────────────────────────────────────────────
  var exportsObj = { inject: ['commandUi'], apply: apply }

  if (typeof window !== 'undefined' && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === 'function') {
    try {
      window.__ModuleLoader__.load({
        id: 'dsh-hide-ui',
        factory: function () {
          var module = { exports: exportsObj }
          return module.exports
        },
      })
    } catch (e) {}
  }

  // Plain-script / fallback path: run immediately.
  if (typeof document !== 'undefined') {
    bindGlobal()
  }

  // Expose a tiny API for debugging / other scripts.
  if (typeof window !== 'undefined') {
    window.__dshHideUi = {
      hide: function () {
        setHidden(true)
      },
      show: function () {
        setHidden(false)
      },
      toggle: toggle,
      isHidden: function () {
        return hidden
      },
    }
  }
})()
