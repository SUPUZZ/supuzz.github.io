#!/bin/bash
# ============================================
# SUPUZZ 本地开发启动脚本
# 使用方式: ./start-dev.sh [port]
#   默认端口 8766，也可指定端口: ./start-dev.sh 9999
# ============================================
set -e

cd "$(dirname "$0")"

PORT="${1:-8766}"

echo "========================================"
echo "  SUPUZZ 本地开发服务器"
echo "========================================"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "[1/3] 安装依赖..."
    npm install
else
    echo "[1/3] 依赖已就绪"
fi

# 清理缓存
echo "[2/3] 清理缓存..."
rm -rf .parcel-cache dist 2>/dev/null || true

# 如果指定端口被占用则先释放
lsof -ti :"$PORT" | xargs kill -9 2>/dev/null || true

# 启动开发服务器 (包含中文页面)
echo "[3/3] 启动 Parcel 开发服务器..."
echo ""

# 后台启动 parcel 并捕获 URL
npx parcel *.html en/*.html es/*.html ja/*.html zh-Hant/*.html de/*.html pt/*.html --port "$PORT" 2>&1 &
PARCEL_PID=$!

# 等待服务器就绪并捕获地址
for i in $(seq 1 60); do
    if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
        break
    fi
    sleep 0.5
done

echo ""
echo "========================================"
echo "  服务器已就绪!"
echo ""
echo "  👉 http://localhost:$PORT"
echo ""
echo "  Português: http://localhost:$PORT/pt/"
echo "  Deutsch:  http://localhost:$PORT/de/"
echo "  繁體中文: http://localhost:$PORT/zh-Hant/"
echo "  英文首页: http://localhost:$PORT/en/"
echo "========================================"
echo ""

# 等待 parcel 进程
wait $PARCEL_PID
