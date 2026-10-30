# TokiPage.

**Live:** <https://ichiyotsu.github.io/>

一个 **Material 3 Expressive** 风格的个人网站：TokiPage 主页、软件详情页、X 式探索信息流，以及一个只用本地文本编辑的 studio。

纯静态 HTML / CSS / JS，零构建步骤。

| 主页 | 软件 |
| --- | --- |
| ![TokiPage](docs/preview-home.jpg) | ![软件页](docs/preview-software.jpg) |

| 探索 | 软件详情 |
| --- | --- |
| ![探索](docs/preview-garden.jpg) | ![TokiTodo](docs/preview-tokitodo.jpg) |

移动端：

![移动端主页](docs/preview-mobile.jpg)

---

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | **TokiPage**：欢迎语 + 三张可点击的入口卡（软件 / 探索 / 关于），底部一行短句 |
| `/software/` | **软件**：作品、Material 3 Expressive 组件试用、正在制作的项目（TokiHarness） |
| `/software/tokitodo/` | TokiTodo：待办，专注计时，手机锁与统计 |
| `/software/luma/` | Luma：悬浮胶囊浏览器 |
| `/software/tokinote/` | TokiNote：本地笔记软件，目前最完善的一个 |
| `/software/tokifonts/` | TokiFonts：基于OneUI教程的字体资源库 |
| `/garden/` | **探索**：三栏 X 式布局（导航 / 讨论流 / 数据与推荐）、站内点赞 / 浏览 / 看评论 |
| `/about/` | **关于**：安静的个人说明、或许会坚持的三件事、联系 |

顶栏顺序是 **主页 / 软件 / 探索 / 关于**。软件下有三项：作品 / 设计 / 制作中；探索下是讨论 / 发布；关于下是关于本站 / 联系。

- 页面以 1920×1080 为主要设计视口，内容最大宽度 1800px，左右留出呼吸区。
- 顶栏、页面顶部和底部都有轻量渐变磨砂；顶栏模糊随滚动从 14px 加深到 26px。
- 顶栏按钮按下会轻微回弹，并有一次边缘线条扩散动画；品牌 `TokiPage.` 悬停时出现整圆角底色。
- 底栏常驻，带磨砂与渐隐过渡；高度 54px，页面内容不会被永久遮住。
- 顶栏使用 G2 曲率连续（`corner-shape: superellipse(4)`），而不是普通圆角。

## 主页

欢迎语右侧的三张浮动卡片本身就是入口，悬停时卡片上浮，并出现跟随光标的微弱反光。原来的「三个入口」列表已删除。

底部只保留一行 **把复杂的事，做得轻一点。**

## 软件与详情页

- 作品卡片、设计说明和「正在制作的项目...」。
- 四个详情页都有左上角悬浮返回按钮，滚动时保持可见。
- TokiTodo / Luma / TokiNote 的标题左侧使用各自的原生自适应图标；TokiFonts 没有独立 app icon，因此保持纯标题。
- 详情页的基础介绍统一为：

  - TokiTodo：待办，专注计时，手机锁与统计。
  - Luma：悬浮胶囊浏览器。
  - TokiNote：本地笔记软件 / 目前最完善的一个。
  - TokiFonts：基于OneUI教程的字体资源库

- 功能卡片加入真实截图；其中 TokiTodo、Luma、TokiNote 额外的「底栏」条带直接裁切截图底栏。
- 旧的 DESIGN NOTE 标签、截图画廊和「下一个」区块已移除；底部改为 **再看看...**，放另外三个软件的入口。
- 详情页顶部提供正式版 / 测试版两个 release 按钮，链接到最新 tag；TokiTodo 和 Luma 当前只有测试版。
- 设计区新增 M3E 组件试用：Filled / Outlined 按钮、Assist / Selected chip、Switch、Linear progress、FAB 和 type scale；色块可悬停点亮，动效线会展开成 M3E 曲线。

## 探索

探索没有自己的服务器，也没有站内账号系统：

- **三栏**：左侧站点导航，中间 X 式讨论流，右侧搜索、数据、简介和推荐软件。
- **看**：帖子正文、评论、作者、点赞数、评论数都从 GitHub Discussions 同步到 JSON，在站内信息流和 dialog 里查看。
- **站内互动**：点赞和浏览计数保存在浏览器本机（`localStorage`）；卡片和详情底部都能看到「浏览 / 点赞 / 评论」。
- **详情**：点击卡片打开 dialog；底部悬浮栏提供浏览、点赞、评论、在 GitHub 查看和复制链接；点「评论」后窗口向左展开，右侧出现评论编辑框。
- **写**：发帖与评论需要 GitHub 账号，点击会打开 GitHub 完成，使用你的 GitHub 身份。
- **同步**：GitHub Actions 每 120 分钟同步一次；页面打开时也按同一节奏刷新。
- **数据**：右侧「探索数据」卡片显示讨论数、问题数、本机浏览数、回复数。
- **信息流**：不显示头像；左上角是用户名和发布时间，下面是标题、正文，支持配图，底部是浏览 / 点赞 / 评论。
- **写作**：桌面端用左栏「写点什么」，手机端用底部悬浮按钮；中间也有 X 式「有什么新鲜事？」入口。

### 首次配置

1. 仓库 **Settings → General → Features** 勾选 **Discussions**。
2. 保留 `Announcements`、`General`、`Q&A`、`Ideas`、`Show and tell` 分类。
3. 工作流需要 `contents: write` 和 `discussions: write`；`.github/workflows/garden-sync.yml` 已配置。
4. 本地手动同步：

```powershell
$env:GITHUB_TOKEN = gh auth token
$env:GITHUB_REPOSITORY = "ichiyotsu/ichiyotsu.github.io"
node tools/garden-sync.mjs
```

## 中英切换

顶栏深色模式按钮左侧有语言图标切换。文案在 `assets/js/i18n.js` 里以中文原文映射到英文；切换状态写入 `localStorage`，页面标题和静态 UI 会同步更新。GitHub 帖子正文保持原文。

## 本地文本编辑器（studio）

工作区里有一个 **只在本地运行** 的文本编辑器：`studio/`。它不进入 Git，也不会部署到 GitHub Pages。

```powershell
.\studio\start.cmd
# http://127.0.0.1:4317/
```

- 扫描页面里带 `data-edit` 的元素，只替换这些元素的文字，不改 CSS、组件和布局。
- **保存修改** 写回 HTML；**发布到 GitHub** 执行本地 `git add / commit / push`，随后 Pages 自动更新。
- 只绑定 `127.0.0.1`，不对局域网 / 公网开放。
- `studio/` 在 `.gitignore` 中，只在当前机器上存在。

## 本地预览站点

```powershell
python -m http.server 4173
# http://127.0.0.1:4173/
```

studio 的「打开本地站点」链接默认指向这个 4173 端口。

## 改内容

| 想改什么 | 去哪里 |
| --- | --- |
| 主页欢迎语 / 三张入口卡 | `index.html` |
| 软件页 / 设计组件 / TokiHarness | `software/index.html` |
| 四个软件详情 | `software/tokitodo/`、`luma/`、`tokinote/`、`tokifonts/` |
| 探索信息流 / 写作器 | `garden/index.html`、`assets/js/garden.js` |
| 关于页与联系 | `about/index.html` |
| 顶栏 / 移动端菜单（每个页面各一份） | 各页面的 `<header>` 与 `<nav-sheet>` |
| 颜色、圆角、动效、字体 | `assets/css/tokens.css` |
| 页面样式 | `assets/css/pages.css` 等 |
| 探索数据 | `garden/data/discussions.json`（由脚本生成，不要手改） |
| 同步频率 | `.github/workflows/garden-sync.yml` |
| 可编辑字段 | 搜索 `data-edit` |
| 中英文案 | `assets/js/i18n.js` |
| 字体 | `assets/fonts/`，见 `assets/fonts/README.md` |

### 字体

中文展示字体是 **得意黑（Smiley Sans）** 的子集，当前约 80 KB。新增中文标题后如果出现字形回退：

```powershell
node tools/update-chars.mjs
python -m fontTools.subset "SmileySans-Oblique.ttf" `
  --text-file=assets\fonts\chars.txt `
  --flavor=woff2 `
  --output-file=assets\fonts\smiley-sans-subset.woff2
```

`tools/update-chars.mjs` 会扫描主页、软件页、四个详情页、探索页、关于页和 404。

## 目录

```text
.
├─ index.html                    # TokiPage
├─ software/
│  ├─ index.html                 # 软件
│  ├─ tokitodo/index.html
│  ├─ luma/index.html
│  ├─ tokinote/index.html
│  └─ tokifonts/index.html
├─ garden/
│  ├─ index.html
│  └─ data/discussions.json
├─ about/index.html
├─ 404.html
├─ .github/workflows/garden-sync.yml
├─ assets/
│  ├─ css/ tokens, base, components, sections, pages
│  ├─ js/ main, garden
│  ├─ fonts/ 得意黑子集 + Bricolage + Instrument Sans + OFL
│  ├─ img/ 截图、头像、图标、OG
│  ├─ img/projects/ 详情页图标与截图
│  └─ vendor/ marked, DOMPurify, Turndown
├─ tools/
│  ├─ garden-sync.mjs
│  └─ update-chars.mjs
├─ docs/                         # README 预览图
├─ CONTENT.md
└─ README.md
```

`studio/`、`_work/`、`_preview/` 都在 `.gitignore` 中，不进入部署。

## 验证

- 主页 / 软件 / 四个详情 / 探索 / 关于 / 404：全部 200，内部资源链接全部可达。
- axe 扫描 9 个页面状态为 0 违规；写作器和讨论弹窗打开时也为 0。
- 320 / 390 / 768 / 1440 / 1920 宽度无横向溢出。
- Explore 同步工作流手动运行成功；Release 公告逻辑本地验证过。
- 讨论数据由 GitHub Actions 提交回仓库，Pages 随后重建。

## Credits

- 字体：[Smiley Sans / 得意黑](https://github.com/atelier-anchor/smiley-sans)、[Bricolage Grotesque](https://github.com/ateliertriay/bricolage)、[Instrument Sans](https://github.com/Instrument/instrument-sans)，均为 SIL OFL 1.1。
- 图标：[IconPark](https://iconpark.oceanengine.com/) 的 `material` 图标，按本站配色重新上色。
- 编辑器：[marked](https://github.com/markedjs/marked)、[DOMPurify](https://github.com/cure53/DOMPurify)、[Turndown](https://github.com/mixmark-io/turndown)。
- 项目截图和自适应图标来自 [ichiyotsu](https://github.com/ichiyotsu) 的公开仓库。
- 讨论数据来自 [GitHub Discussions](https://github.com/ichiyotsu/ichiyotsu.github.io/discussions)。

## License

页面代码可自由参考和修改；项目截图、头像与个人内容的版权归 ichiyotsu 所有。
