(() => {
  'use strict';

  const DICT = {
    '主页': 'Home',
    '软件': 'Software',
    '作品': 'Work',
    '设计': 'Design',
    '探索': 'Explore',
    '讨论': 'Discussion',
    '发布': 'Publish',
    '关于': 'About',
    '联系': 'Contact',
    '返回': 'Back',
    '制作中': 'In progress',
    '欢迎来到': 'Welcome to',
    '欢迎来到 TokiPage': 'Welcome to TokiPage',
    '这里是': 'This is',
    '的小站。一个放软件、设计和想法的地方，也是一座慢慢长的花园。': '’s small site for software, design and ideas.',
    '的小站。一个放软件、设计和想法的地方。': '’s small site for software, design and ideas.',
    '进入软件': 'Enter software',
    '去探索': 'Explore',
    '看看作品': 'See work',
    '把复杂的事，': 'Make things',
    '做得': 'feel',
    '轻': 'lighter',
    '一点。': '.',
    '。': '.',
    'ichiyotsu · 没有追踪。': 'ichiyotsu · no tracking.',
    '· 没有追踪。': '· no tracking.',
    '作品 · 设计 · 制作中': 'Work · Design · In progress',
    '作品 / 设计 / 制作中': 'Work / Design / In progress',
    '讨论 · 更新': 'Discussion · Updates',
    '本站 · 联系': 'Site · Contact',
    '关于本站': 'About this site',
    '制作中': 'In progress',
    'TokiHarness / 二创': 'TokiHarness / Fan project',
    'App 与小工具': 'Apps & tools',
    '来自 GitHub Discussions': 'From GitHub Discussions',
    '写点什么': 'Write something',
    '写点什么。': 'Write something.',
    '进入软件首页': 'Go to software',
    '进入花园': 'Go to explore',
    '进入探索': 'Go to explore',
    '进入关于页': 'Go to about',
    '关于本站 / 联系': 'About / Contact',
    '讨论 / 发布': 'Discussion / Publish',
    'GitHub': 'GitHub',
    '本地优先': 'Local-first',
    '材料': 'Material',
    'M3 Expressive': 'M3 Expressive',
    '2026': '2026',
    'MENU': 'MENU',
    '跳到主要内容': 'Skip to content',
    '回到顶部 ↑': 'Back to top ↑',
    '这里是 ichiyotsu 的小站。一个放软件、设计和想法的地方，也是一座慢慢长的花园。': 'This is ichiyotsu’s small site for software, design and ideas.',

    /* Software */
    '哈喽呀我是ichiyotsu ! 目前在做一些有趣的 wibe-coding 软件喔 !': 'Hi, I’m ichiyotsu! I’m making some fun vibe-coded software.',
    '一些做给自己，': 'Things made for myself,',
    '也用得上的东西。': 'and useful to others.',
    '目前尝试了笔记，专注和浏览器...都在不断优化中 !!': 'Notes, focus and browsing… all still being refined.',
    '待办，专注计时，手机锁与统计。': 'To-dos, focus timer, phone lock and stats.',
    '悬浮胶囊浏览器。': 'A floating capsule browser.',
    '本地笔记软件': 'Local-first notes',
    '目前最完善的一个。': 'The most complete one so far.',
    '基于OneUI教程的字体资源库': 'A font library built around OneUI guides',
    '基于OneUI教程的字体资源库。': 'A font library built around OneUI guides.',
    '把复杂的事，做得轻一点。': 'Make complicated things feel lighter.',
    '正式版 未发布': 'Stable — not released',
    '测试版 v0.1.0-beta.1': 'Beta v0.1.0-beta.1',
    '正式版 v0.3.5': 'Stable v0.3.5',
    '测试版 v0.3.7-beta.2': 'Beta v0.3.7-beta.2',
    'Material 3 Expressive，': 'Material 3 Expressive,',
    '不只是圆角。': 'not just rounded corners.',
    '我把 M3E 当成一套「如何让界面有情绪」的方法：颜色有主次，形状会呼吸，动效在关键处才说话。': 'I treat M3E as a way to give interfaces emotion: colour with hierarchy, shapes that breathe, motion only when it matters.',
    '颜色先有角色，再有偏好。': 'Colour roles come before taste.',
    'primary 负责行动，container 负责承载，tertiary 留给意外。深色不是简单反色，而是另一套关系。': 'Primary acts, container holds, tertiary surprises. Dark mode is another set of relationships, not an inversion.',
    '形状可以表达情绪。': 'Shape can carry emotion.',
    '从 12 到 48 的圆角刻度不是随手调的数值。它决定一个界面是工具、玩具，还是两者之间。': 'The 12–48 radius scale is not arbitrary. It decides whether an interface feels like a tool, a toy, or both.',
    '动效是标点。': 'Motion is punctuation.',
    '弹簧只用在能被「按」的地方。它应该让动作更清楚，而不是让等待变得更长。': 'Springs belong where people press. Motion should clarify, not lengthen the wait.',
    '官方组件，在真实页面里试用。': 'Official components, used on a real page.',
    '按钮、chip、开关、进度与排版都来自同一套 M3E 角色和形状。它们不是示意图，而是这个页面正在使用的组件。': 'Buttons, chips, switches, progress and type all share one set of M3E roles and shapes. These are not mockups; they are the components this page uses.',
    '这些不是装饰性的原则，而是我写界面时的默认值：': 'These are not decorative rules; they are defaults I write interfaces with: ',
    '先有层级，再有表情。': 'hierarchy first, expression second.',
    '看看': 'See',
    '正在制作的项目...': 'In progress…',
    '还没做完，但已经值得先放上来。': 'Not finished yet, but worth showing already.',
    '在 GitHub 看看': 'View on GitHub',
    'TokiHarness': 'TokiHarness',
    '正在尝试制作 DSH 手机版，基于 MD3E 设计的二创。敬请期待...': 'Building a DSH mobile version, a fan project based on MD3E. Coming soon…',
    '另外三个也在慢慢长大。': 'The other three are growing too.',
    '再看看...': 'More to see…',
    '一些做进去的功能。': 'Some of the features inside.',
    '不是功能清单，更像是几个「为什么它要这样」的切片。': 'Not a feature list — more like a few slices of why it works this way.',
    '待办，也可以是一组': 'To-dos can be a set',
    '待办可以置顶、分组、设置时长；待办集让「今天要做什么」不至于摊成一地。': 'Pin, group and time-box to-dos. Collections keep today from becoming a pile.',
    '专注计时': 'Focus timer',
    '大圆环、暂停 / 跳过 / 循环、背景音和可换字体。计时不是惩罚，是一段被保护起来的时间。': 'A big ring, pause / skip / repeat, ambient sound and custom type. Timing is protected time, not punishment.',
    '手机锁与强制学习': 'Phone lock & deep study',
    '把手机暂时锁住，或者进入强制学习模式。不是靠意志力，而是先把干扰拿走。': 'Lock the phone for a while, or enter deep study mode. Remove the distraction before relying on willpower.',
    '统计': 'Stats',
    '周纵览、月度分布和专注历史。数据不追求像报表，而是让你看见时间去了哪里。': 'Weekly overview, monthly distribution and focus history. Not a report — a way to see where time went.',
    '我的与数据': 'Me & data',
    '外观、备份、局域网 WebUI 和本地数据。默认都在本机，只有检查更新会访问 GitHub。': 'Appearance, backup, LAN WebUI and local data. Everything stays local except update checks.',
    '底栏': 'Bottom bar',
    '待办、专注、锁机和统计收在同一条底栏里，拇指不用离开下半屏。': 'To-dos, focus, lock and stats live on one bottom bar, within thumb reach.',
    'TokiTodo 的第一原则不是「功能多」，而是「开始得足够容易」。所以它把待办、计时和锁机放在同一个入口，减少在几个 App 之间来回切换的摩擦。': 'TokiTodo’s first principle is not more features, but making it easy to start. To-dos, timer and lock share one entrance.',
    '悬浮地址栏 · 8 种主题色': 'Floating address bar · 8 theme colours',
    '悬浮地址栏': 'Floating address bar',
    '地址栏和工具栏是一组玻璃胶囊，可以在顶部和底部之间切换，网页会自动为它让位。': 'Address and toolbar are glass capsules that move between top and bottom; the page makes room.',
    '多标签': 'Tabs',
    '新建、关闭、重开、切换；每个标签有自己的标题、favicon 和加载状态。': 'Create, close, reopen, switch. Each tab keeps its title, favicon and loading state.',
    '本地新标签页': 'Local new tab',
    '时间、问候、快捷方式和搜索都在本地生成，不联网也能打开。': 'Time, greeting, shortcuts and search are generated locally and work offline.',
    '主题与玻璃': 'Themes & glass',
    '8 种主题色种子，跟随系统 / 浅色 / 深色；玻璃强度可以自己调。': 'Eight theme seeds, system / light / dark, with adjustable glass strength.',
    '双端一致': 'Consistent across platforms',
    '桌面用 Electron + Chromium，移动端用 Android WebView，尽量共用同一套视觉和交互。': 'Electron + Chromium on desktop, Android WebView on mobile, sharing one visual language.',
    '标签、主页和设置都在手势区附近，单手也能完成大部分操作。': 'Tabs, home and settings sit near the gesture area, so most actions work one-handed.',
    '浏览器是最难「做得有性格」的软件之一，因为它必须先把网页放好。Luma 的取舍是：把界面收进一个胶囊，把空间还给网页，只在需要的时候浮出来。': 'A browser must put the page first. Luma’s trade-off: fold the UI into a capsule, give space back to the page, and surface only when needed.',
    '列表 / 网格、置顶、搜索、日历视图和长按预览；编辑器从首图提取主色，让每篇日记有自己的气氛。': 'List / grid, pin, search, calendar and long-press preview. The editor pulls a colour from the cover image.',
    '文件夹、多选、全屏查看器和双指缩放；文件夹只记录照片引用，不复制或删除原图。': 'Folders, multi-select, fullscreen viewer and pinch zoom. Folders reference photos without copying or deleting originals.',
    '专注 / 短休息 / 长休息，圆角进度环、可自定义时长和专注总结。': 'Focus / short break / long break, rounded progress ring, custom durations and focus summaries.',
    '动态取色、纯黑、减弱动效、卡片密度和悬浮工具岛。': 'Dynamic colour, true black, reduced motion, card density and a floating tool island.',
    '数据与隐私': 'Data & privacy',
    '本地存储、完整 JSON 备份、回收站保留 14 天；没有账号上报和用户画像。': 'Local storage, full JSON backup, 14-day trash. No account telemetry or profiling.',
    '一块悬浮工具岛，写作、相册和专注随手切换。': 'A floating tool island for writing, gallery and focus.',
    'TokiNote 想做的不是「又一个笔记 App」，而是一个你愿意把私人内容放进去的地方。所以它先解决本地、备份和断网可用，再谈同步。': 'TokiNote is not another notes app. It is a place to put private things. Local storage, backup and offline use come first.',
    '以开源字体为主，附带更新过的安装教程和问题说明。': 'Mostly open-source fonts, with updated install guides and caveats.',
    '社区投稿版本，按自己的审美和使用场景收录，审核后发布。': 'Community picks, curated for taste and use case, reviewed before publishing.',
    '从不想 root 的换字体方式，到 root 和 Knox 相关的风险，尽量把坑写在前面。': 'From no-root font changes to root and Knox risks, the pitfalls come first.',
    '字体不是越多越好。这里会记录版本、适配系统、字形特点和已知问题。': 'More fonts is not the goal. Versions, system fit, letterforms and known issues are documented.',
    '不定期整理资源库和教程；社区反馈会进入下一轮更新。': 'The library and guides are updated irregularly; community feedback shapes the next round.',
    '字体是界面里最安静的品牌。TokiFonts 想做的，是把「换一套字」这件事讲清楚：它改变了什么，会坏在哪里，以及值不值得。': 'Type is the quietest part of a brand. TokiFonts explains what a font change does, what breaks, and whether it is worth it.',

    /* About */
    '一个用来放软件、设计和一些想法的安静角落。': 'A quiet corner for software, design and a few ideas.',
    '为什么会有它': 'Why it exists',
    '放了一些软件...虽然我想说规范设计真的很重要，ios 的软件生态不是一撮而就的，需要开发者用心的设计和优化。好吧我也只是按照我的爱好做了一些功能简单设计简单好玩的东西而已': 'I put some software here. Design systems matter; an ecosystem is not built overnight. These are simply small, playful things made for the joy of making.',
    '怎么做的': 'How it is made',
    '花园来自 Discussions 提供。其他的都是 AI agent 时代的产物。': 'Explore runs on Discussions. The rest comes from the age of AI agents.',
    '或许会坚持': 'Things I may keep',
    '先好用，再好玩。': 'Useful first, playful second.',
    '动效是标点，不是正文。': ' Motion is punctuation, not the body text.',
    '数据先属于你。': 'Your data belongs to you.',
    '能本地完成的事，不默认上传。': ' If it can stay local, it stays local.',
    '少即是多。': 'Less is more.',
    '没有追踪、没有弹窗、没有自动播放。': ' No tracking, pop-ups or autoplay.',
    '不追热点，不塞弹窗，不假装很忙。一个可以慢慢看、慢慢改的个人站。': 'No trends, no pop-ups, no pretending to be busy. A personal site to read and change slowly.',
    '有想法，': 'Have an idea?',
    '就聊聊。': 'Let’s talk.',
    '欢迎提出你的想法和建议 !': 'Ideas and suggestions are welcome!',
    '开源软件 仅供娱乐 !': 'Open-source, just for fun!',
    '在 GitHub 找我': 'Find me on GitHub',
    '© 2026 ichiyotsu · 没有追踪。': '© 2026 ichiyotsu · no tracking.',

    /* Explore */
    'EXPLORE / DISCUSSIONS': 'EXPLORE / DISCUSSIONS',
    '一个长在 GitHub Discussions 上的讨论区。': 'A discussion space living on GitHub Discussions.',
    '这里会有版本更新公告和软件功能交流...': 'Release notes and software conversations live here…',
    '可能还有一些还没想好放哪里的东西。': 'And perhaps a few things without a home yet.',
    '发帖/评论在 GitHub 完成；点赞/浏览保存在本机。': 'Posts and comments on GitHub; likes and views stay on this device.',
    'GitHub Discussions': 'GitHub Discussions',
    'LATEST': 'LATEST',
    'AUTO · 2H': 'AUTO · 2H',
    '全部': 'All',
    '公告': 'Announcement',
    '最新讨论': 'Latest discussions',
    '讨论': 'Discussion',
    '问题': 'Questions',
    '浏览': 'Views',
    '回复': 'Replies',
    '分享': 'Share',
    '在 GitHub 查看': 'View on GitHub',
    '复制链接': 'Copy link',
    '评论': 'Comment',
    '写评论': 'Write a comment',
    '发布仍在 GitHub 完成': 'Publishing still happens on GitHub',
    '复制并去回复': 'Copy & reply',
    '关闭讨论': 'Close discussion',
    '关闭编辑器': 'Close editor',
    '标题': 'Title',
    '想聊点什么？': 'What is on your mind?',
    '发布类型': 'Publish type',
    '讨论 · 问答': 'Discussion · Q&A',
    '讨论 · 想法': 'Discussion · Ideas',
    'Issue · 问题反馈': 'Issue · Bug report',
    'Issue · 功能建议': 'Issue · Feature request',
    '用 Markdown 写，或者关掉 Markdown 用富文本工具栏排版…': 'Write in Markdown, or turn it off to use the rich-text toolbar…',
    '预览': 'Preview',
    'Markdown 预览': 'Markdown preview',
    '富文本': 'Rich text',
    'Markdown': 'Markdown',
    '发布到 GitHub 新建内容页，用你的账号发布。': 'Publish opens a new GitHub page and uses your account.',
    '发布会打开 GitHub 新建内容页，用你的账号发布。': 'Publish opens a new GitHub page and uses your account.',
    '关闭菜单': 'Close menu',
    '打开菜单': 'Open menu',
    '切换到深色模式': 'Switch to dark mode',
    '切换到浅色模式': 'Switch to light mode',
    '跳到主要内容': 'Skip to content',
    '讨论': 'Discussion',
    '问答': 'Q&A',
    '想法': 'Ideas',
    '展示': 'Showcase',
    '投票': 'Poll',
    '分享讨论链接': 'Share discussion link',
    '按钮、chip、开关和进度都来自同一套 M3E 角色和形状。只保留真的能操作的部分，不做静态示意图。': 'Buttons, chips, switches and progress share one M3E role system. Only the parts that actually work are shown.',
    '动效是连续曲线。': 'Motion is a continuous curve.',
    '用 MD3E 进度条的连续曲线表达进行中，而不是让等待变成一个来回弹的球。': 'The MD3E progress curve shows work in progress, instead of a ball bouncing back and forth.',
    '正在制作的项目...': 'Projects in progress...',
    '还没做完，但已经值得先放上来。': 'Not finished yet, but worth putting out there.',
    '正在尝试制作 DSH 手机版，基于 MD3E 设计的二创。敬请期待...': 'Experimenting with a DSH mobile build, a fan project based on MD3E. Coming soon...',
    '在 GitHub 看看': 'View on GitHub',
    '置顶公告': 'Pinned announcement',
    '更新公告': 'Announcements',
    '说点什么': 'General',
    '设计建议': 'Ideas',
    '社区问答': 'Q&A',
    '发布类型': 'Post type',
    '保存草稿': 'Save draft',
    'GitHub 登录': 'Sign in with GitHub',
    '登录 GitHub': 'Sign in to GitHub',
    '发布评论': 'Publish comment',
    '在 GitHub 查看': 'View on GitHub',
    '复制链接': 'Copy link',
    '还没有评论。登录 GitHub 后写下第一条。': 'No comments yet. Sign in to GitHub to write the first one.',

    '设计建议': 'Ideas',
    '社区问答': 'Q&A',
    'Updated announcement': 'Updated announcement',
    'GitHub 登录': 'Sign in with GitHub',
    '退出': 'Sign out',
    '保存草稿': 'Save draft',
    '登录 GitHub': 'Sign in to GitHub',
    '发布评论': 'Publish comment',
    '需要先登录 GitHub': 'Sign in to GitHub first',
    '在 GitHub 查看': 'View on GitHub',
    '复制链接': 'Copy link',
    '使用 GitHub Token 直接在站内发布。Token 只保存在本标签页的 sessionStorage，不会写入代码或 localStorage。': 'Use a GitHub token to publish in place. The token stays in this tab’s sessionStorage and is never written to code or localStorage.',
    '去创建 token ↗': 'Create a token ↗',
    '评论': 'Comments',
    '还没有评论。登录 GitHub 后写下第一条。': 'No comments yet. Sign in to GitHub to write the first one.',
    '快速链接': 'Quick links',
    '置顶公告': 'Pinned announcement',
    '更新公告': 'Announcements',
    '软件讨论': 'Software talk',
    '全部': 'All',
    '测试版 v0.1.0-beta.1 · APK': 'Beta v0.1.0-beta.1 · APK',
    '正式版 v0.3.5 · APK': 'Stable v0.3.5 · APK',
    '测试版 v0.3.7-beta.3 · APK': 'Beta v0.3.7-beta.3 · APK',
    '测试版包含部分正式版尚未提供的预览功能。': 'Betas include preview features that are not yet in the stable release.',
    '调整左右栏宽度': 'Resize columns',
    '刷新整个探索页面': 'Refresh the whole explore page',
    '探索数据': 'Explore stats',
    '推荐软件': 'Recommended software',
    '正在制作': 'In progress',
    '搜索探索': 'Search explore',
    '有什么新鲜事？': 'What’s new?',
    '它是怎么长出来的': 'How it grew',
    '把复杂的事，做得': 'Make things feel',
    '今天': 'Today',
    '件待办': 'to-dos',
    '下载': 'Download',
    '字': 'Type',
    '永 和 九 年 · 横 竖 撇 捺': 'Yonghe 9 · strokes',
    'OFL · 持续收录': 'OFL · growing',
    '还有 DSH、TokiDSH 和一些没做完的实验，散落在 GitHub。': 'More experiments live on GitHub.',
    '去翻翻': 'Browse',
    '按一下': 'Press',
    '本地笔记软件，目前最完善的一个。': 'Local-first notes, the most complete one.',
    '关于这个网站。': 'About this site.',
  };

  const ATTRS = ['placeholder', 'aria-label', 'title'];
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  const key = 'ichiyotsu-lang';
  let lang = 'zh';
  let observer = null;
  const originalTitle = document.title;

  try { lang = localStorage.getItem(key) || 'zh'; } catch (error) { /* ignore */ }

  const trim = (value) => value.trim();
  const hasCJK = (value) => /[\u3400-\u9fff]/.test(value);

  function translate(value) {
    if (lang !== 'en') return value;
    const text = trim(value);
    if (!text) return value;

    if (DICT[text]) return value.replace(text, DICT[text]);

    let match = text.match(/^(\d+) 浏览$/);
    if (match) return value.replace(text, `${match[1]} views`);
    match = text.match(/^(\d+) 点赞$/);
    if (match) return value.replace(text, `${match[1]} likes`);
    match = text.match(/^(\d+) 评论$/);
    if (match) return value.replace(text, `${match[1]} comments`);
    match = text.match(/^(\d+) 小时前$/);
    if (match) return value.replace(text, `${match[1]}h ago`);
    match = text.match(/^(\d+) 天前$/);
    if (match) return value.replace(text, `${match[1]}d ago`);
    match = text.match(/^(\d+) 次浏览$/);
    if (match) return value.replace(text, `${match[1]} views`);
    if (text === '刚刚') return value.replace(text, 'just now');
    if (text === '发布于') return value.replace(text, 'Posted');
    if (hasCJK(text)) return value;
    return value;
  }

  function translateAttr(value) {
    if (lang !== 'en') return value;
    const text = trim(value);
    if (!text) return value;
    if (DICT[text]) return DICT[text];
    let match = text.match(/^站内点赞，当前 (\d+) 个赞$/);
    if (match) return `Like on this device, ${match[1]} likes`;
    if (text.startsWith('站内查看 ')) return text.replace('站内查看 ', 'View ').replace(' 条评论', ' comments');
    return value;
  }

  function applyTo(root) {
    if (!root) return;
    if (observer) observer.disconnect();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach((textNode) => {
      if (!originalText.has(textNode)) originalText.set(textNode, textNode.textContent);
      const source = originalText.get(textNode);
      textNode.textContent = translate(source);
    });

    const elements = root.querySelectorAll ? root.querySelectorAll('[placeholder], [aria-label], [title]') : [];
    elements.forEach((element) => {
      if (!originalAttrs.has(element)) originalAttrs.set(element, {});
      const stored = originalAttrs.get(element);
      ATTRS.forEach((attr) => {
        if (!element.hasAttribute(attr)) return;
        if (!(attr in stored)) stored[attr] = element.getAttribute(attr);
        element.setAttribute(attr, translateAttr(stored[attr]));
      });
    });

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  const LANGUAGE_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 12h17M12 3.5c3 3.4 3 13.6 0 17M12 3.5c-3 3.4-3 13.6 0 17" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  function updateButton(button) {
    if (!button.querySelector('svg')) button.innerHTML = LANGUAGE_ICON;
    button.dataset.lang = lang === 'en' ? 'en' : 'zh';
    button.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    button.title = lang === 'en' ? '切换到中文' : 'Switch to English';
  }

  function setLang(next, announce = true) {
    lang = next === 'en' ? 'en' : 'zh';
    const titles = {
      '/': 'TokiPage. — Software, design and explore.',
      '/software/': 'Software — TokiPage.',
      '/software/tokitodo/': 'TokiTodo — TokiPage.',
      '/software/luma/': 'Luma — TokiPage.',
      '/software/tokinote/': 'TokiNote — TokiPage.',
      '/software/tokifonts/': 'TokiFonts — TokiPage.',
      '/garden/': 'Explore — TokiPage.',
      '/about/': 'About — TokiPage.'
    };
    if (lang === 'en' && titles[location.pathname]) document.title = titles[location.pathname];
    if (lang === 'zh') document.title = originalTitle;
    try { localStorage.setItem(key, lang); } catch (error) { /* ignore */ }
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.body.classList.toggle('lang-en', lang === 'en');
    applyTo(document.body);
    const button = document.querySelector('.lang-toggle');
    if (button) updateButton(button);
    if (announce) document.dispatchEvent(new CustomEvent('ichiyotsu:lang', { detail: lang }));
  }

  function installButton() {
    if (document.querySelector('.lang-toggle')) return;
    const actions = document.querySelector('.topbar__actions');
    if (!actions) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button lang-toggle';
    button.addEventListener('click', () => setLang(lang === 'en' ? 'zh' : 'en'));
    actions.insertBefore(button, actions.firstElementChild);
    updateButton(button);
  }

  function start() {
    installButton();
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.body.classList.toggle('lang-en', lang === 'en');
    applyTo(document.body);
    const button = document.querySelector('.lang-toggle');
    if (button) updateButton(button);

    observer = new MutationObserver((entries) => {
      if (lang !== 'en') return;
      observer.disconnect();
      entries.forEach((entry) => {
        if (entry.type === 'characterData') {
          const node = entry.target;
          if (!originalText.has(node)) {
            originalText.set(node, node.textContent);
            node.textContent = translate(node.textContent);
          }
        } else {
          entry.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              if (!originalText.has(added)) originalText.set(added, added.textContent);
              added.textContent = translate(added.textContent);
            } else if (added.nodeType === Node.ELEMENT_NODE) {
              applyTo(added);
            }
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    if (lang === 'en') {
      const titles = {
        '/': 'TokiPage. — Software, design and explore.',
        '/software/': 'Software — TokiPage.',
        '/software/tokitodo/': 'TokiTodo — TokiPage.',
        '/software/luma/': 'Luma — TokiPage.',
        '/software/tokinote/': 'TokiNote — TokiPage.',
        '/software/tokifonts/': 'TokiFonts — TokiPage.',
        '/garden/': 'Explore — TokiPage.',
        '/about/': 'About — TokiPage.'
      };
      if (titles[location.pathname]) document.title = titles[location.pathname];
    }
  }

  window.ichiyotsuI18n = { setLang, apply: () => applyTo(document.body), get lang() { return lang; } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
