# ichiyotsu.

**Live:** <https://ichiyotsu.github.io/>

一个 **Material 3 Expressive** 风格的个人网站：TokiPage 主页、软件详情页、一座长在 GitHub Discussions 上的花园，以及一个只用本地文本编辑的 studio。

纯静态 HTML / CSS / JS，零构建步骤。

| 主页 | 软件 |
| --- | --- |
| ![TokiPage](docs/preview-home.jpg) | ![软件页](docs/preview-software.jpg) |

| 花园 | 软件详情 |
| --- | --- |
| ![花园](docs/preview-garden.jpg) | ![TokiTodo](docs/preview-tokitodo.jpg) |

移动端：

![移动端主页](docs/preview-mobile.jpg)

---

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | **TokiPage**：欢迎页，软件 / 花园 / 关于三个入口 |
| `/software/` | **软件**：作品、Material 3 Expressive 设计说明、待定（关于我 + 随手记） |
| `/software/tokitodo/` | TokiTodo 详情：待办、专注、锁机、统计 |
| `/software/luma/` | Luma 详情：悬浮地址栏、多标签、双端一致 |
| `/software/tokinote/` | TokiNote 详情：笔记、相册、专注、本地数据 |
| `/software/tokifonts/` | TokiFonts 详情：字体资源、Pro / CE、教程 |
| `/garden/` | **花园**：站内查看讨论、GitHub Discussions 同步、FAB 写作器 |
| `/about/` | **关于**：本站故事、使用说明、站点地图、联系 |

顶栏顺序是 **主页 / 软件 / 花园 / 关于**：

- 软件、花园、关于都有下拉小标题；主页是直接入口。
- 桌面端悬停或键盘聚焦展开，移动端点击分组后标题上移、下面滑出小标题。
- 顶栏使用滚动响应的实时 `backdrop-filter` 模糊：从 14px 逐渐加深到 26px。

## 花园

花园没有自己的服务器，也没有站内账号系统。它是 **GitHub Discussions 的只读镜像 + 原生写入**：

1. `.github/workflows/garden-sync.yml` 在讨论、评论、Release、定时任务时调用 GitHub API。
2. `tools/garden-sync.mjs` 同步标题、正文、分类、作者头像、点赞、评论和评论正文到 `garden/data/discussions.json`。
3. `/garden/` 读取 JSON，在站内用 dialog 展示帖子正文和评论；想看完整内容、点赞或回复时，再点「在 GitHub 查看 / 回复」。
4. 发帖用右下角 / 手机底部中间的 **+** FAB 打开写作器：支持 Markdown / 富文本切换、预览、复制、带标题正文打开 GitHub 新建讨论。
5. Release 发布时，脚本会在 `Announcements` 自动创建一条讨论，并随同步出现在「公告」里。

写入为什么不在站内完成：静态站点无法安全保存 GitHub OAuth secret，也不应该把 token 放进浏览器。看板保持只读、快速；身份和写操作留在 GitHub。

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

## 本地文本编辑器（studio）

工作区里有一个 **只在本地运行** 的文本编辑器：`studio/`。它不进入 Git，也不会部署到 GitHub Pages。

```powershell
.\studio\start.cmd
# http://127.0.0.1:4317/
```

- 它扫描页面里带 `data-edit` 的元素，只替换这些元素的文字，不改 CSS、组件和布局。
- **保存修改** 写回 HTML；**发布到 GitHub** 执行本地 `git add / commit / push`，随后 Pages 自动更新。
- 只绑定 `127.0.0.1`，不对局域网/公网开放。
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
| 主页欢迎语 / 三个入口 | `index.html` |
| 软件页 / 设计 / 待定 | `software/index.html` |
| 四个软件详情 | `software/tokitodo/`、`luma/`、`tokinote/`、`tokifonts/` |
| 花园页 / 写作器 | `garden/index.html`、`assets/js/garden.js` |
| 关于页与联系 | `about/index.html` |
| 顶栏 / 移动端菜单（每个页面各一份） | 各页面的 `<header>` 与 `<nav-sheet>` |
| 颜色、圆角、动效、字体 | `assets/css/tokens.css` |
| 页面样式 | `assets/css/pages.css` 等 |
| 花园数据 | `garden/data/discussions.json`（由脚本生成，不要手改） |
| Release 公告 | `tools/garden-sync.mjs`、`.github/workflows/garden-sync.yml` |
| 可编辑字段 | 搜索 `data-edit` |
| 字体 | `assets/fonts/`，见 `assets/fonts/README.md` |

### 字体

中文展示字体是 **得意黑（Smiley Sans）** 的子集，当前约 90 KB。新增中文标题后如果出现字形回退：

```powershell
node tools/update-chars.mjs
python -m fontTools.subset "SmileySans-Oblique.ttf" `
  --text-file=assets\fonts\chars.txt `
  --flavor=woff2 `
  --output-file=assets\fonts\smiley-sans-subset.woff2
```

`tools/update-chars.mjs` 会扫描主页、软件页、四个详情页、花园页、关于页和 404。

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
│  ├─ img/projects/ 详情页截图
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

- 主页 / 软件 / 四个详情 / 花园 / 关于 / 404：全部 200，内部资源链接全部可达。
- axe 扫描 9 个页面状态为 0 违规；写作器和讨论弹窗打开时也为 0。
- 320 / 360 / 390 / 768 / 1024 / 1440 宽度无横向溢出。
- Garden 同步工作流手动运行成功；Release 公告逻辑本地验证过。
- 讨论数据由 GitHub Actions 提交回仓库，Pages 随后重建。

## Credits

- 字体：[Smiley Sans / 得意黑](https://github.com/atelier-anchor/smiley-sans)、[Bricolage Grotesque](https://github.com/ateliertriay/bricolage)、[Instrument Sans](https://github.com/Instrument/instrument-sans)，均为 SIL OFL 1.1。
- 图标：[IconPark](https://iconpark.oceanengine.com/) 的 `material` 图标，按本站配色重新上色。
- 编辑器：[marked](https://github.com/markedjs/marked)、[DOMPurify](https://github.com/cure53/DOMPurify)、[Turndown](https://github.com/mixmark-io/turndown)。
- 项目截图来自 [ichiyotsu](https://github.com/ichiyotsu) 的公开仓库。
- 讨论数据来自 [GitHub Discussions](https://github.com/ichiyotsu/ichiyotsu.github.io/discussions)。

## License

页面代码可自由参考和修改；项目截图、头像与个人内容的版权归 ichiyotsu 所有。
