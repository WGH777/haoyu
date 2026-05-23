# Haoyu Backend

基于 NestJS 的后端服务。详见根目录 [README.md](../README.md)。

## 技术栈
- NestJS 11 + TypeScript
- Prisma ORM（SQLite/PostgreSQL）
- JWT 认证 + bcrypt + refresh 轮换
- RBAC 权限 + 双签机制
- 原子资金引擎（Wallet + LedgerEntry）

## 快速启动
```bash
npm install
cp .env.example .env  # 编辑填入 JWT_SECRET
npx prisma generate && npx prisma db push
npm run start:dev
```

## 测试
```bash
npm test              # 单元测试(26)
npm run test:e2e      # E2E（需先启动服务）
```
