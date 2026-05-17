#!/bin/bash
# 浩煜 Haoyu — 自动构建 + 部署脚本
set -e

REPO="/root/.openclaw/workspace/haoyu-repo"
DEPLOY="/var/www/haoyu"

cd "$REPO/apps/frontend"

echo "🔨 构建前端..."
npm run build

echo "📦 部署到 $DEPLOY ..."
rm -rf "$DEPLOY/assets" "$DEPLOY/favicon.svg" "$DEPLOY/index.html" "$DEPLOY/vite.svg"
cp -r dist/* "$DEPLOY/"

echo "🔄 重载 Nginx..."
nginx -s reload

echo "✅ 部署完成 — $(date '+%H:%M:%S')"
