#!/bin/bash

# 定义目标目录（与代码中的路径一致）
TARGET_DIR="static/manuals"

# 1. 创建目录（如果不存在）
echo "正在创建目录: $TARGET_DIR"
mkdir -p "$TARGET_DIR"
if [ $? -eq 0 ]; then
    echo "目录创建成功（或已存在）"
else
    echo "目录创建失败，请检查权限"
    exit 1
fi

# 2. 创建空的webp封面图片文件（注：空webp文件并非标准格式，仅用于占位，后续可替换为真实图片）
echo -e "\n正在创建空的封面图片文件..."
touch "$TARGET_DIR/ice-world-manual-cover.webp"
touch "$TARGET_DIR/ocean-world-manual-cover.webp"
touch "$TARGET_DIR/kids-table-chair-manual-cover.webp"

# 3. 创建空的PDF文件（空PDF并非标准格式，仅用于占位，后续可替换为真实PDF）
echo "正在创建空的PDF手册文件..."
touch "$TARGET_DIR/ice-world-building-blocks-manual.pdf"
touch "$TARGET_DIR/ocean-world-building-blocks-manual.pdf"
touch "$TARGET_DIR/kids-table-chair-set-manual.pdf"

# 4. 验证文件是否创建成功
echo -e "\n验证文件列表："
ls -l "$TARGET_DIR" | grep -E "\.(webp|pdf)"

# 5. 提示信息
echo -e "\n✅ 空文件创建完成！"
echo "⚠️  注意：这些是空文件，并非标准的webp/PDF格式，仅用于页面调试。"
echo "⚠️  后续请将真实的封面图片和PDF文件替换到 $TARGET_DIR 目录下。"