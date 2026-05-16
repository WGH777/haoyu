#!/bin/bash
# deploy-frontend.sh — 构建前端并部署到 Nginx 站点
set -e

echo "📦 构建前端..."
cd /root/.openclaw/workspace/haoyu-repo/apps/frontend
npx vite build

echo "📂 部署到 /var/www/haoyu..."
rm -rf /var/www/haoyu/*
cp -r dist/* /var/www/haoyu/
chmod -R 755 /var/www/haoyu

echo "✅ 前端已部署: www.haoyulv.com"
