# dsh-hide-ui

[简体中文](./README.md) | [English](./README.en.md)

一键隐藏 DSH 全部界面，只留背景壁纸。

适合配合 `dsh-plugin-wallpaper-engine` 等壁纸插件使用：侧栏、输入框、导航、标题栏、对话内容、弹窗、挂件全部收起，壁纸全屏铺开。

## 功能

- **隐藏全部 UI**：左/右侧栏、输入区、导航、标题栏、对话流、设置弹窗、壁纸引擎拉绳/吉祥物、鲸鱼挂件等
- **保留壁纸层**：`.we-layer` / `.we-scrim` / `.we-fx` 继续显示；隐藏时顺带撤掉遮罩，画面更干净
- **恢复简单**：`Ctrl+Shift+H` 或 `Esc`
- **状态记忆**：刷新后保持上次的显示/隐藏偏好

## 快捷键

| 按键                                  | 作用        |
| ----------------------------------- | --------- |
| `Ctrl+Shift+H`（macOS：`Cmd+Shift+H`） | 显示 / 隐藏切换 |
| `Esc`（隐藏时）                          | 恢复界面      |

## 斜杠命令

在输入框输入 `/` 可看到：

| 命令        | 作用        |
| --------- | --------- |
| `/hideui` | 隐藏界面，只留壁纸 |

## 安装

> **首选：本地路径安装（桌面 UI）**。把整个 `dsh-hide-ui` 文件夹放在本机任意路径，再在 DSH 里选中该目录即可。

### 方式一：本地目录安装（推荐 / 首选）

1. 完全退出 DSH（托盘退出，不是只关窗口）
2. 打开 DSH → **设置 → 插件 → 安装插件**（或「插件管理」里的「从本地安装 / 添加插件」）
3. **浏览选择**本插件目录（包含 `package.json` 且带 `dsh.bundle` 的文件夹），例如：
   ```text
   E:\AI-space\dsh插件\dsh-hide-ui
   ```
   或你克隆到的任意路径，例如 `D:\plugins\dsh-hide-ui`
4. **完全退出并重启 DSH**（改代码后尤其如此）

注意：

- 装完必须**整进程重启**，否则不生效

### 方式二：CLI 本地路径安装（备用）

若你的环境支持 `dsh plugin` 子命令，可在**插件目录的上一级**执行：

```powershell
dsh plugin --profile desktop add .\dsh-hide-ui
```

或写绝对路径（推荐正斜杠）：

```powershell
dsh plugin --profile desktop add E:/AI-space/dsh插件/dsh-hide-ui/纯净版
```

装完同样需要重启 DSH。若 CLI 报错或不存在，请直接用上面的**方式一**。

### 卸载

- **桌面 UI**：插件列表里移除 / 禁用 `dsh-hide-ui`
- **CLI**（若可用）：

```powershell
dsh plugin --profile desktop remove dsh-hide-ui
```

## 使用

1. 先用壁纸插件选好壁纸
2. 按 `Ctrl+Shift+H`（或输入 `/hideui`）进入纯壁纸模式
3. 按 `Esc` 或 `Ctrl+Shift+H` 恢复

## 实现说明

| 文件                 | 职责                                      |
| ------------------ | --------------------------------------- |
| `package.json`     | `dsh.bundle` 激活插件层；`dsh.client` 加载浏览器半区 |
| `cordis.patch.yml` | 把宿主半区 insert 进配置树                       |
| `cordis.yml`       | 本地开发 `--patch` 加载（可选）                   |
| `index.js`         | 注册 `/hideui`；向页面注入 / 下发 `client.js`     |
| `client.js`        | 注入隐藏 CSS、快捷键；可选注册 `commandUi` 动作        |

隐藏策略：给 `body` 打上 `data-dsh-hide-ui`，用 CSS 隐藏几乎所有 `body` 直接子节点（保留壁纸层），并对已知 DSH 锚点（`#root`、`.dshDesktopFrame`、`[data-slot=...]` 等）再兜一层。

## 本地开发

```sh
# 不打包，直接 patch 加载（先把 cordis.yml 里的路径改成你的目录）
dsh web --patch ./cordis.yml
```

改 `client.js` 后硬刷新浏览器即可；改 `index.js` 需重启 DSH。

## 已知限制

- 桌面壳标题栏若在 `#root` 之外，也会被「隐藏 body 子节点」规则盖住；若你的版本标题栏仍露出，欢迎提 issue 附截图。
- 隐藏期间壁纸的鼠标交互（视差 / 点击）取决于壁纸插件自身是否吃事件；本插件不改动壁纸层的 `pointer-events`。
- 与 `dsh-plugin-wallpaper-engine` 的拉绳/吉祥物兼容：隐藏时一并收起，恢复后原样回来。

## License

MIT
