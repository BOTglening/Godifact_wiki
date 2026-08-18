# 神造物 Wiki

《神造物》世界观档案库。由 MkDocs 迁移至 **VitePress**，内容目录 `docs/` 保持不变。

## 环境要求

- Node.js ≥ 18（推荐 20+）

## 服务器控制台（推荐）

双击 `Wiki服务器.bat` 打开菜单操作，或直接带参数调用：

```bash
Wiki服务器.bat start     # 启动开发服务器（热更新，http://localhost:5173）
Wiki服务器.bat preview   # 启动静态预览（http://localhost:4173，未构建时自动先构建）
Wiki服务器.bat build     # 仅构建站点（.vitepress/dist）
Wiki服务器.bat stop      # 停止所有 Wiki 服务器（按端口结束进程）
Wiki服务器.bat status    # 查看服务器状态
```

启动的服务器运行在独立窗口中，关闭窗口即停止；`stop` 也可随时结束所有实例。

## 常用命令

在 `神造物wiki/` 目录下执行：

```bash
npm install        # 安装依赖（首次）
npm run docs:dev   # 本地开发服务器（http://localhost:5173，热更新）
npm run docs:build # 构建静态站点（输出至 .vitepress/dist/）
npm run docs:preview # 本地预览构建产物
```

## 目录结构

```
神造物wiki/
├── .vitepress/          # 站点配置与主题
│   ├── config.mts       # 站点配置：导航、侧边栏、中文全文搜索分词
│   └── theme/           # 主题扩展（页脚、样式）
├── docs/                # 全部 Markdown 内容（与 MkDocs 时代一致）
│   ├── index.md         # 首页（Hero 布局）
│   └── public/          # 静态资源（favicon 等）
└── package.json
```

## 说明

- **中文全文搜索**：使用 VitePress 本地搜索（MiniSearch），`config.mts` 中内置了中日韩文本分词器（单字 + 双字词组），无需任何外部服务。
- **零依赖静态预览**：不想装依赖时，也可用仓库根目录 `_工具/serve-static.mjs` 直接托管构建产物：
  `node _工具/serve-static.mjs .vitepress/dist 4173`（自动处理 clean URL 回退）。
- **链接校验**：仓库根目录 `_工具/check-links.ps1` 仍然有效（内容目录未变），可用于检查 `docs/` 内的相对链接。
- 原 `mkdocs.yml` 已随框架迁移移除；如需回退 MkDocs，可从 git 历史恢复。
