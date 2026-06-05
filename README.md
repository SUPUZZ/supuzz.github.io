# supuzz-web

SUPUZZ 品牌官网静态站点：积木与 STEM 玩具推广页、博客文章、关于我们等，采用多入口 HTML（Parcel 打包）、公用头部/底部组件与静态资源。

## 技术栈

- [Parcel](https://parceljs.org/) 2.x 开发与生产构建
- HTML + CSS，配合 `posthtml-include` 引入 `components/` 下的片段
- `static/` 目录通过 `parcel-reporter-static-files-copy` 复制到产物目录

## 环境要求

- 建议使用当前 **Node.js LTS**（与 Parcel 2 兼容）

## 安装依赖

在项目根目录执行：

```bash
npm install
```

## 本地开发（启动）

启动 Parcel 开发服务器（会监听根目录下各 `*.html` 入口）：

```bash
npm start
```

终端会输出本地访问地址（一般为 `http://localhost:1234`）。修改源码后会热更新。

## 生产打包

构建静态文件到 `dist/`（资源使用相对路径 `./`，便于任意目录部署）：

```bash
npm run build
```

完成后可将 **`dist/`** 整目录上传到静态托管（如 Nginx、OSS、CDN 等）。构建产物包含 HTML、打包后的 JS/CSS 以及从 `static/` 复制的静态文件。

## 项目结构（简要）

| 路径 | 说明 |
|------|------|
| `*.html` | 页面入口（首页 `index.html`、文章页、博客等） |
| `components/` | 可复用 HTML 片段（header、footer） |
| `static/` | 无需打包处理的静态资源，构建时复制到 `dist/` |
| `style.css`、图片等 | 与入口 HTML 引用关系由 Parcel 解析 |

## 许可证

见仓库内 `package.json` 的 `license` 字段（当前为 `ISC`）。
