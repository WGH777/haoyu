#!/bin/bash
# 浩煜 Haoyu — 自动构建 + 部署脚本
set -e

REPO="/opt/haoyu"
DEPLOY="/home/web/html/haoyu"

cd "$REPO/apps/frontend"

echo "🔨 构建前端..."
npm run build

echo -e "\n📦 部署到 $DEPLOY ..."
rsync -a --delete dist/ "$DEPLOY/"

echo "🔄 重载 Nginx（Docker 容器）..."
docker exec nginx nginx -s reload

echo "✅ 部署完成 — $(date '+%H:%M:%S')"
echo "ℹ️  提示：上传文件目录 /home/web/html/uploads/ 不受影响"
