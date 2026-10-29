# ichiyotsu.

**Live:** <https://ichiyotsu.github.io/>

一个 **Material 3 Expressive** 风格的个人网站，也是一个长在 GitHub Discussions 上的小花园。

纯静态 HTML / CSS / JS，零构建步骤。软件、设计、关于在三个独立页面里；花园的讨论、点赞和评论由 GitHub 提供身份。

| 软件 | 花园 |
| --- | --- |
| ![软件首页](docs/preview-desktop.jpg) | ![花园](docs/preview-garden.jpg) |

移动端：

![移动端首页](docs/preview-mobile.jpg)

---

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | **软件**：Hero、作品、Material 3 Expressive 设计说明、待定（关于我 + 随手记） |
| `/garden/` | **花园**：GitHub Discussions 同步看板、发帖引导、Markdown / 富文本编辑器 |
| `/about/` | **关于**：这个网站怎么来的、本站使用、站点地图、联系 |

顶栏的「软件 / 花园 / 关于」各有下拉小标题：

- 桌面端悬停或键盘聚焦展开。
- 手机端点击分组后，标题上移，下面滑出该组的小标题。
- 「软件」下的作品 / 设计 / 待定都是同一页的锚点。

## 花园是怎么工作的

花园没有自己的服务器，也没有站内账号系统。它是一层 **GitHub Discussions 的只读镜像**：

1. `.github/workflows/garden-sync.yml` 在讨论 / 评论变化、Release 发布、每 6 小时定时运行时，调用 GitHub GraphQL API。
2. `tools/garden-sync.mjs` 把公开讨论的标题、摘要、分类、作者头像、点赞数、评论数写入 `garden/data/discussions.json`。
3. `/garden/` 读取这个 JSON 渲染看板；点开任意一条会去 GitHub 查看完整内容、点赞或评论。
4. 发帖和评论都在 GitHub 完成：登录后使用你的 GitHub ID 和头像，不需要这个站保存任何 token。
5. `Release` 发布时，脚本会在 `Announcements` 分类自动创建一条讨论，并随下一次同步出现在「公告」里。

发布按钮会把编辑器里的 Markdown 复制到剪贴板，并打开 GitHub 的「新建讨论」页面（带 `title` / `body` 预填参数）。如果 GitHub 没有自动填入，直接粘贴即可。

### 为什么不做站内登录 / 评论框

一个纯静态站点无法安全地保存 GitHub OAuth secret，也不应该把访问令牌放进浏览器。把写入交回 GitHub 是刻意的取舍：**看板是只读的、快速的；身份和写操作留在 GitHub。**

### 花园的首次配置

1. 仓库 **Settings → General → Features** 勾选 **Discussions**。
2. 默认分类里至少保留 `Announcements`、`General`、`Q&A`、`Ideas`、`Show and tell`（脚本会优先使用 `Announcements` 发 Release）。
3. `.github/workflows/garden-sync.yml` 需要 `contents: write` 和 `discussions: write` 权限；工作流已经写好。
4. 本地手动同步：

```powershell
$env:GITHUB_TOKEN = gh auth token
$env:GITHUB_REPOSITORY = "ichiyotsu/ichiyotsu.github.io"
node tools/garden-sync.mjs
```

5. 首次同步后，`garden/data/discussions.json` 会有内容；提交它即可。

## 本地预览

```powershell
python -m http.server 4173
# http://127.0.0.1:4173/
```

> 页面使用根路径（`/assets/...`、`/garden/`），请用本地服务器打开，不要直接双击 HTML。

## 部署

```powershell
git add .
git commit -m "update site"
git push
```

GitHub Pages 会从 `main` 根目录构建。仓库里已经包含 `.nojekyll`、`sitemap.xml`、`robots.txt`、`site.webmanifest` 和自定义 `404.html`。

## 改内容

| 想改什么 | 去哪里 |
| --- | --- |
| 首页 Hero / 作品 / 设计 / 待定 | `index.html` |
| 花园页、编辑器、分类选项 | `garden/index.html`、`assets/js/garden.js` |
| 关于页与联系 | `about/index.html` |
| 顶栏、移动端菜单（三个页面各一份） | 每个页面的 `<header>` 与 `<nav-sheet>` |
| 颜色、圆角、动效、字体 | `assets/css/tokens.css` |
| 页面与组件样式 | `assets/css/*.css` |
| 花园数据 | `garden/data/discussions.json`（由脚本生成，不要手改） |
| 发帖同步 / Release 公告 | `tools/garden-sync.mjs`、`.github/workflows/garden-sync.yml` |
| 下载量 | `index.html` 里的 `project__downloads`（当前来自 GitHub Releases 1 / 2 次） |
| 头像 / 截图 / OG | `assets/img/` |

### 字体

中文展示字体是 **得意黑（Smiley Sans）** 的子集，当前约 72 KB。新增中文标题后，如果出现字形回退：

```powershell
node tools/update-chars.mjs
python -m fontTools.subset "SmileySans-Oblique.ttf" `
  --text-file=assets\fonts\chars.txt `
  --flavor=woff2 `
  --output-file=assets\fonts\smiley-sans-subset.woff2
```

`tools/update-chars.mjs` 会扫描 `index.html`、`garden/index.html`、`about/index.html` 和 `404.html`。详细说明在 [`assets/fonts/README.md`](assets/fonts/README.md)。

### 设计页

`#design` 是纯 CSS / 少量 JS 的 M3E 小实验：色调角色、可切换的形状、弹簧球。没有引入动效库。

## 目录

```text
.
├─ index.html                  # 软件
├─ garden/
│  ├─ index.html               # 花园
│  └─ data/discussions.json    # 同步后的讨论数据
├─ about/index.html            # 关于
├─ 404.html
├─ .github/workflows/garden-sync.yml
├─ assets/
│  ├─ css/ tokens, base, components, sections, pages
│  ├─ js/ main, garden
│  ├─ fonts/ 得意黑子集 + Bricolage + Instrument Sans + OFL
│  ├─ img/ 截图、头像、图标、OG
│  └─ vendor/ marked, DOMPurify, Turndown
├─ tools/
│  ├─ garden-sync.mjs
│  └─ update-chars.mjs
├─ docs/                       # README 预览图
├─ CONTENT.md                  # 内容规划与写作建议
└─ README.md
```

## 技术细节

- **零构建**：页面和脚本都是直接可部署的静态文件。
- **主题**：浅色 / 深色，跟随系统；手动切换会写入 `localStorage`，并支持 View Transition 圆形揭开。
- **无障碍**：跳转链接、可见焦点、`aria-expanded` / `aria-controls`、移动端 dialog 焦点管理、`prefers-reduced-motion`；axe 扫描 8 个页面状态为 0 违规。
- **响应式**：320 / 360 / 390 / 768 / 1024 / 1440 宽度检查过，无横向溢出。
- **第三方资源**：字体、图片、marked、DOMPurify、Turndown 都本地托管；只有花园卡片里的 GitHub 头像会从 `avatars.githubusercontent.com` 加载。
- **Markdown 编辑器**：`marked` 渲染、`DOMPurify` 消毒、`Turndown` 把富文本转回 Markdown；发布时复制正文并打开 GitHub。

## Credits

- 字体：[Smiley Sans / 得意黑](https://github.com/atelier-anchor/smiley-sans)、[Bricolage Grotesque](https://github.com/ateliertriay/bricolage)、[Instrument Sans](https://github.com/Instrument/instrument-sans)，均为 SIL OFL 1.1，授权文件在 `assets/fonts/`。
- 图标：[IconPark](https://iconpark.oceanengine.com/) 的 `material` 图标，按本站配色重新上色。
- 编辑器：[marked](https://github.com/markedjs/marked)（MIT）、[DOMPurify](https://github.com/cure53/DOMPurify)（Apache-2.0 / MPL-2.0）、[Turndown](https://github.com/mixmark-io/turndown)（MIT）。
- 项目截图来自 [ichiyotsu](https://github.com/ichiyotsu) 的公开仓库。
- 讨论数据来自 [GitHub Discussions](https://github.com/ichiyotsu/ichiyotsu.github.io/discussions)。

## License

页面代码可自由参考和修改；项目截图、头像与个人内容的版权归 ichiyotsu 所有。若要把这个模板公开为开源项目，建议补一个 MIT / CC BY 许可证。
