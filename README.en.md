# dsh-hide-ui

[简体中文](./README.md) | **English**

Hide every DSH UI surface, wallpaper only.

Works well with wallpaper plugins such as `dsh-plugin-wallpaper-engine`: sidebars, composer, navbar, title bar, chat transcript, dialogs and floating widgets all disappear, and the wallpaper goes full-bleed.

## Features

- **Hides all UI chrome** — left/right sidebars, composer, navbar, title bar, chat flow, settings dialogs, Wallpaper Engine rope/mascot, whale widget, etc.
- **Keeps the wallpaper layer** — `.we-layer` / `.we-scrim` / `.we-fx` stay on screen; the scrim is also dropped while hidden for a cleaner picture
- **Simple restore** — `Ctrl+Shift+H` or `Esc`
- **Remembers preference** — survives a page refresh

## Hotkeys

| Key | Action |
| --- | --- |
| `Ctrl+Shift+H` (macOS: `Cmd+Shift+H`) | Toggle hide / show |
| `Esc` (while hidden) | Restore UI |

## Slash commands

Type `/` in the composer:

| Command | Action |
| --- | --- |
| `/hideui` | Hide the UI, wallpaper only |

## Install

> **Preferred: install from a local path via the desktop UI.** Keep the whole `dsh-hide-ui` folder anywhere on disk and point DSH at that directory.

### Option 1 — Local folder install (recommended / preferred)

1. Fully quit DSH (tray → Quit, not just close the window)
2. Open DSH → **Settings → Plugins → Install plugin** (or “Add plugin / Install from local”)
3. **Browse** to this plugin directory (the folder that contains `package.json` with `dsh.bundle`), for example:

   ```text
   E:\AI-space\dsh插件\dsh-hide-ui
   ```

   or wherever you cloned it, e.g. `D:\plugins\dsh-hide-ui`

4. **Fully quit and restart DSH** (especially after code changes)

Notes:

- You **must** restart the whole process or the plugin will not activate

### Option 2 — CLI local path (fallback)

If your environment has the `dsh plugin` subcommand, run from the **parent** of the plugin folder:

```powershell
dsh plugin --profile desktop add .\dsh-hide-ui
```

Or with an absolute path (forward slashes recommended):

```powershell
dsh plugin --profile desktop add E:/AI-space/dsh插件/dsh-hide-ui/纯净版
```

Restart DSH afterwards. If the CLI is missing or errors out, use **Option 1**.

### Uninstall

- **Desktop UI**: remove / disable `dsh-hide-ui` in the plugin list
- **CLI** (if available):

```powershell
dsh plugin --profile desktop remove dsh-hide-ui
```

## Usage

1. Pick a wallpaper with your wallpaper plugin first
2. Press `Ctrl+Shift+H` (or run `/hideui`) to enter pure-wallpaper mode
3. Press `Esc` or `Ctrl+Shift+H` to restore

## Layout

| File | Role |
| --- | --- |
| `package.json` | `dsh.bundle` activates the plugin layer; `dsh.client` loads the browser half |
| `cordis.patch.yml` | Inserts the host half into the config tree |
| `cordis.yml` | Optional local-dev `--patch` overlay |
| `index.js` | Registers `/hideui`; injects / serves `client.js` |
| `client.js` | Injects hide CSS and hotkeys; optional `commandUi` actions |

Hide strategy: set `data-dsh-hide-ui` on `body`, hide almost all direct `body` children (except wallpaper layers) with CSS, and also target known DSH anchors (`#root`, `.dshDesktopFrame`, `[data-slot=…]`, …) as a belt-and-suspenders pass.

## Local development

```sh
# Load without packaging (edit the path inside cordis.yml first)
dsh web --patch ./cordis.yml
```

Hard-refresh the browser after changing `client.js`; restart DSH after changing `index.js`.

## Known limitations

- If the desktop-shell title bar lives outside `#root`, it is still covered by the “hide body children” rule. If your build still shows a bar, open an issue with a screenshot.
- Wallpaper mouse interaction (parallax / clicks) while hidden depends on the wallpaper plugin; this plugin does not change wallpaper-layer `pointer-events`.
- Compatible with `dsh-plugin-wallpaper-engine` rope/mascot: they hide with the rest and come back on restore.

## License

MIT
