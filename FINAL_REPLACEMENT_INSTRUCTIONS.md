# 最终替换说明

## 一、图片替换

### 1. 需要替换的图片文件

| 占位图片路径 | 实际图片要求 |
|------------|------------|
| `static/product-images/rainbow-building-blocks-main.webp` | 彩虹积木主图，展示产品整体外观 |
| `static/product-images/rainbow-building-blocks-thumb.webp` | 彩虹积木缩略图，用于博客列表 |

### 2. 图片替换步骤

1. **准备高质量图片**：
   - 格式：WebP
   - 主图尺寸建议：1200x630px
   - 缩略图尺寸建议：800x600px
   - 确保图片清晰展示彩虹积木的色彩和特点

2. **替换图片文件**：
   - 删除现有占位图片
   - 将新图片以相同文件名放入 `static/product-images/` 目录

3. **重新构建网站**：
   ```bash
   npm run build
   ```

## 二、文本内容检查（可选）

以下内容可根据实际需求进行调整：

1. **博客文章标题**：
   - 当前："SUPUZZ Premium Rainbow Building Blocks: Creative Learning for Ages 2-6"
   - 可根据产品实际名称调整

2. **博客文章描述**：
   - 当前："Discover the SUPUZZ Premium Rainbow Building Blocks Set - large, soft interlocking construction toys that promote STEAM learning and creative development for children ages 2-6."
   - 可根据产品实际特点调整

3. **文章内容**：
   - 文件：`article-building-blocks-premium.html`
   - 可根据产品实际信息更新详细描述

## 三、注意事项

1. **图片文件名**：请保持与现有文件名完全一致，否则需要更新代码中的路径
2. **图片格式**：必须使用 WebP 格式以确保最佳性能
3. **构建命令**：每次修改图片或文本后，务必运行 `npm run build` 以更新静态文件
4. **预览检查**：替换后建议在浏览器中检查网站，确保所有图片正确显示

## 四、文件位置汇总

- 博客文章：`article-building-blocks-premium.html`
- 博客列表数据：`static/blog.json` 和 `dist/blog.json`
- 主图：`static/product-images/rainbow-building-blocks-main.webp`
- 缩略图：`static/product-images/rainbow-building-blocks-thumb.webp`
- 图片替换清单：`image-replacement-list.md`（包含更详细的图片需求说明）