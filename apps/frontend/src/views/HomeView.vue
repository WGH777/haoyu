<template>
  <div class="app-shell" :class="{ 'is-drawer-open': mobileDrawerOpen }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo" @click="$router.push('/task')">
        <span class="logo-mark">煜</span>
        <span class="logo-text">浩煜</span>
      </div>
      <nav class="nav">
        <router-link to="/task" class="nav-item" :class="{ active: $route.path === '/task' || $route.path === '/' }">
          <el-icon><List /></el-icon><span>任务大厅</span>
        </router-link>
        <template v-if="isLogin">
          <router-link to="/my-task" class="nav-item" :class="{ active: $route.path === '/my-task' }">
            <el-icon><Tickets /></el-icon><span>我的任务</span>
          </router-link>
          <router-link to="/my-orders" class="nav-item" :class="{ active: $route.path === '/my-orders' }">
            <el-icon><Connection /></el-icon><span>我接的订单</span>
          </router-link>
          <router-link to="/notifications" class="nav-item" :class="{ active: $route.path === '/notifications' }">
            <el-icon><Bell /></el-icon><span>通知</span>
            <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
          </router-link>
          <router-link to="/wallet" class="nav-item" :class="{ active: $route.path === '/wallet' }">
            <el-icon><Wallet /></el-icon><span>钱包</span>
          </router-link>
        </template>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/trust" class="nav-item small">信任中心</router-link>
        <template v-if="isLogin && canSeeUserManage">
          <router-link to="/user" class="nav-item small">用户管理</router-link>
          <router-link to="/admin" class="nav-item small">管理后台</router-link>
        </template>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="main-area">
      <!-- 桌面端顶部横向导航（v0.2.7 Phase 1-C） -->
    <HomeTopNav
      :is-login="isLogin"
      :user="currentUser"
      :wallet-balance="walletBalance"
      :search-keyword="searchKeyword"
      @update:search="searchKeyword = $event"
      @logout="handleLogout"
    />

    <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-brand-mark">煜</span>
          <span class="greeting">{{ isLogin && currentUser ? currentUser.nickname : '可信价值协作平台' }}</span>
        </div>
        <div class="topbar-right">
          <span v-if="isLogin && currentUser" class="balance-badge">💰 {{ formatYumiCompactFromCent(walletBalance) }}</span>
          <template v-if="isLogin">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-entry">
                <el-avatar
                  :size="32"
                  :src="currentUser?.avatar ? getFullUrl(currentUser.avatar!) : undefined"
                  :style="!currentUser?.avatar ? { backgroundColor: '#6366f1', color: '#fff', fontSize: '13px' } : {}"
                >
                  {{ currentUser?.email?.[0]?.toUpperCase() || '?' }}
                </el-avatar>
                <span class="user-entry-nick">{{ currentUser?.nickname }}</span>
                <el-icon class="user-entry-arrow"><CaretBottom /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button size="small" @click="$router.push('/login')">登录</el-button>
            <el-button size="small" type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </header>

      <div class="content" v-if="$route.path === '/' || $route.path === '/task'">
        <!-- Hero — 万家灯火主题 -->
        <section class="hero-v2">
          <!-- 灯火背景 -->
          <div class="hero-lights">
            <span class="light-dot" v-for="i in 24" :key="'l'+i"
              :style="{
                left: (10 + Math.sin(i * 1.7) * 42 + 42) + '%',
                top: (8 + Math.cos(i * 2.3) * 38 + 38) + '%',
                animationDelay: (i * 0.35) + 's',
                animationDuration: (2.2 + (i % 3) * 1.4) + 's',
                width: (3 + (i % 4)) + 'px',
                height: (3 + (i % 4)) + 'px'
              }"
            ></span>
            <!-- v0.2.6-hotfix1: 手机端额外暖金光点（仅移动端可见）-->
            <span class="light-dot mobile-extra-dot" v-for="i in 8" :key="'m'+i"
              :style="{
                left: (8 + Math.sin(i * 2.5 + 1) * 38 + 38) + '%',
                top: (10 + Math.cos(i * 3.1 + 2) * 35 + 35) + '%',
                animationDelay: (1.2 + i * 0.45) + 's',
                animationDuration: (2.8 + (i % 3) * 1.2) + 's',
                width: (4 + (i % 3) * 2) + 'px',
                height: (4 + (i % 3) * 2) + 'px'
              }"
            ></span>
          </div>
          <div class="hero-gradient"></div>
          <div class="hero-city-glow" aria-hidden="true"></div>
          <div class="hero-cityline" aria-hidden="true">
            <span v-for="i in 18" :key="'b'+i" :style="{ height: (18 + (i % 5) * 10) + 'px' }"></span>
          </div>
          <div class="hero-lantern-layer" aria-hidden="true">
            <span class="hero-lantern lantern-a">🏮</span>
            <span class="hero-lantern lantern-b">🏮</span>
            <span class="hero-lantern lantern-c">✦</span>
          </div>

          <div class="hero-v2-content">
            <!-- 标签 -->
            <span class="hero-anim-tag hero-tag-v2">
              <span class="tag-icon">🏮</span>万家灯火 · 资金托管 · 信用沉淀
            </span>

            <!-- 标题 -->
            <h1 class="hero-anim-h1 hero-title-v2">
              浩煜<span class="glow-text-v2"> Haoyu</span>
            </h1>

            <!-- 副标题 -->
            <p class="hero-anim-sub hero-sub-v2">
              让需求有着落，让协作有回响
            </p>
            <p class="hero-anim-sub hero-sub-v2-extra">
              可信价值协作平台
            </p>

            <!-- CTA 按钮 -->
            <div class="hero-anim-actions hero-actions-v2">
              <el-button type="warning" size="large" round @click="openCreateDialog" v-if="isLogin" class="btn-warm-gold">✨ 发布需求</el-button>
              <el-button type="warning" size="large" round @click="$router.push('/register')" v-else class="btn-warm-gold">创建协作身份</el-button>
              <el-button size="large" round class="btn-outline-v2" @click="$router.push('/task')">浏览任务</el-button>
              <el-button size="large" round class="btn-outline-v2 hide-mobile" @click="$router.push('/trust')">了解保障</el-button>
            </div>

            <!-- 协作流转视觉 -->
            <div class="hero-anim-flow hero-flow-v2">
              <svg class="flow-svg" viewBox="0 0 720 72" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#6366f1" stop-opacity="0" />
                    <stop offset="20%" stop-color="#818cf8" stop-opacity="0.6" />
                    <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.7" />
                    <stop offset="80%" stop-color="#06b6d4" stop-opacity="0.6" />
                    <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <!-- 连接线 -->
                <path d="M52,36 L108,36 L118,26 L158,26" stroke="url(#flowGrad)" stroke-width="1.5" fill="none" stroke-dasharray="6 4" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M202,26 L258,26 L268,36 L308,36" stroke="url(#flowGrad)" stroke-width="1.5" fill="none" stroke-dasharray="6 4" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite" begin="1s" />
                </path>
                <path d="M352,36 L408,36 L418,26 L458,26" stroke="url(#flowGrad)" stroke-width="1.5" fill="none" stroke-dasharray="6 4" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite" begin="0.5s" />
                </path>
                <path d="M502,26 L558,26 L568,36 L608,36" stroke="url(#flowGrad)" stroke-width="1.5" fill="none" stroke-dasharray="6 4" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite" begin="1.5s" />
                </path>
                <path d="M652,36 L668,36" stroke="url(#flowGrad)" stroke-width="1.5" fill="none" stroke-dasharray="6 4" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="3s" repeatCount="indefinite" begin="2s" />
                </path>
                <!-- 节点 -->
                <circle cx="36" cy="36" r="16" fill="rgba(99,102,241,0.15)" stroke="rgba(129,140,248,0.5)" stroke-width="1.5" />
                <text x="36" y="40" text-anchor="middle" fill="#a5b4fc" font-size="11" font-weight="600">发布</text>

                <circle cx="174" cy="26" r="16" fill="rgba(245,158,11,0.12)" stroke="rgba(252,211,77,0.45)" stroke-width="1.5" />
                <text x="174" y="30" text-anchor="middle" fill="#fcd34d" font-size="11" font-weight="600">托管</text>

                <circle cx="324" cy="36" r="16" fill="rgba(6,182,212,0.12)" stroke="rgba(34,211,238,0.45)" stroke-width="1.5" />
                <text x="324" y="40" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="600">协作</text>

                <circle cx="474" cy="26" r="16" fill="rgba(16,185,129,0.12)" stroke="rgba(52,211,153,0.45)" stroke-width="1.5" />
                <text x="474" y="30" text-anchor="middle" fill="#6ee7b7" font-size="11" font-weight="600">验收</text>

                <circle cx="624" cy="36" r="16" fill="rgba(139,92,246,0.12)" stroke="rgba(167,139,250,0.45)" stroke-width="1.5" />
                <text x="624" y="40" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="600">信用</text>
              </svg>
            </div>
          </div>
        </section>

        <!-- 桌面端新 Hero + 数据 + 流程（v0.2.7 Phase 1-C） -->
        <HomeHero @publish="openCreateDialog" />
        <HomeStatsStrip :stats="{ users: '5万', orders: '2万', rating: '98', funds: '500万' }" />
        <HomeValueFlow />
        <ServiceCategoryGrid />
        <FeaturedTaskSection :tasks="tasks.slice(0, 6)" />

        <!-- 数据看板（旧，移动端兼容）-->
        <section class="dashboard">
          <div class="stat-item">
            <span class="stat-number">{{ tasks.length }}</span>
            <span class="stat-label">开放需求</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">0%</span>
            <span class="stat-label">服务费率（前30单）</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">🔒</span>
            <span class="stat-label">资金托管保障</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-number">⚡</span>
            <span class="stat-label">智能调度匹配</span>
          </div>
        </section>

        <!-- 价值流转图 -->
        <section class="value-flow-enhanced">
          <div class="flow-step-dot done">
            <span class="flow-icon">📝</span>
            <span class="dot"></span>
            <span>需求发布</span>
          </div>
          <div class="flow-step-connector done"></div>
          <div class="flow-step-dot active">
            <span class="flow-icon">🔒</span>
            <span class="dot"></span>
            <span>资金托管</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">🤝</span>
            <span class="dot"></span>
            <span>协作执行</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">✅</span>
            <span class="dot"></span>
            <span>成果验收</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">💰</span>
            <span class="dot"></span>
            <span>价值结算</span>
          </div>
          <div class="flow-step-connector"></div>
          <div class="flow-step-dot">
            <span class="flow-icon">⭐</span>
            <span class="dot"></span>
            <span>信用沉淀</span>
          </div>
        </section>

        <!-- 搜索与筛选 -->
        <div class="filter-row">
          <el-input
            v-model="searchKeyword"
            placeholder="找需求、找能力、找协作机会"
            :prefix-icon="Search"
            clearable
            size="large"
            class="search-input"
          />
          <el-select v-model="priceFilter" size="large" class="filter-select">
            <el-option label="全部赏金" value="all" />
            <el-option label="100煜米以下" value="low" />
            <el-option label="100 – 500煜米" value="mid" />
            <el-option label="500煜米以上" value="high" />
          </el-select>
          <el-button size="large" @click="fetchData" :icon="Refresh" class="btn-outline">刷新</el-button>
        </div>

        <!-- 主内容区（任务网格 + 榜单侧栏） -->
        <div class="market-layout">
          <!-- 左侧：任务卡片网格 -->
          <div class="market-main" v-loading="loading">
            <el-empty v-if="!loading && !tasks.length" description="这里暂时安静，新的需求可能正在路上 ✨">
              <el-button type="primary" round @click="openCreateDialog">发布第一个需求</el-button>
            </el-empty>

            <div class="task-grid">
              <div
                v-for="(task, idx) in tasks"
                :key="task.id"
                class="task-card-premium"
                :class="{ 'high-budget': task.price >= 50000, 'task-card-anim': true }"
                :style="{ animationDelay: (idx * 0.06) + 's' }"
                @click="$router.push(`/task/${task.id}`)"
              >
                <div class="premium-card-top">
                  <div class="pct-tags">
                    <span class="premium-card-category">
                      {{ categoryLabel(task.category || '') }}
                      <span v-if="task.isPublicWelfare" class="welfare-badge">公益</span>
                    </span>
                    <span :class="['status-badge', statusClass(task.status)]">
                      {{ statusLabel(task.status) }}
                    </span>
                  </div>
                  <div class="pct-badges mobile-only-flow">
                    <span v-if="task.price >= 50000" class="mobile-badge hot">🔥 高预算</span>
                    <span v-else-if="isNewTask(task)" class="mobile-badge new">🆕 新发布</span>
                  </div>
                </div>

                <h3 class="premium-card-title">{{ task.title }}</h3>
                <p class="premium-card-desc-desktop desktop-only">{{ truncate(task.description, 80) }}</p>
                <p class="premium-card-desc-mobile mobile-only">{{ task.description ? (task.description.length > 120 ? task.description.slice(0, 120) + '...' : task.description) : '暂无描述' }}</p>

                <!-- 迷你进度条 -->
                <div class="progress-mini" style="margin-bottom: 0;">
                  <div class="progress-fill" :style="{ width: progressPercent(task.status) }"></div>
                </div>

                <div class="premium-card-bottom">
                  <div class="mobile-bottom-row mobile-only">
                    <span class="premium-card-price">{{ formatYumiCompactFromCent(task.price) }}</span>
                    <span class="pcr-service">{{ task.serviceMode === 'OFFLINE' ? '📍线下' : task.serviceMode === 'BOTH' ? '🌐均' : '💻线上' }}</span>
                  </div>
                  <span class="premium-card-price desktop-only">{{ formatYumiCompactFromCent(task.price) }}</span>
                  <span class="premium-card-meta">
                    <span class="desktop-only">{{ task.serviceMode === 'OFFLINE' ? '📍 线下' : task.serviceMode === 'BOTH' ? '🌐 均可' : '💻 线上' }}</span>
                    <span>👁 {{ task.views || 0 }}</span>
                    <span class="mobile-only">{{ timeAgo(task.createdAt) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：榜单侧栏 -->
          <aside class="leaderboard-sidebar">
            <!-- 热门需求 -->
            <div class="leaderboard-panel">
              <div class="leaderboard-title">
                <span>🔥</span> 热门需求
              </div>
              <div v-if="tasks.length" class="leaderboard-list">
                <div
                  v-for="(t, idx) in tasks.slice(0, 5)"
                  :key="'hot-' + t.id"
                  class="leaderboard-item"
                  @click="$router.push(`/task/${t.id}`)"
                  style="cursor: pointer;"
                >
                  <span class="leaderboard-rank" :class="'top-' + (idx + 1)" v-if="idx < 3">{{ idx + 1 }}</span>
                  <span class="leaderboard-rank" v-else>{{ idx + 1 }}</span>
                  <span class="leaderboard-name">{{ truncate(t.title, 16) }}</span>
                  <span class="leaderboard-value">{{ formatYumiCompactFromCent(t.price) }}</span>
                </div>
              </div>
              <div v-else style="font-size: 12px; color: #64748b; text-align: center; padding: 12px 0;">
                暂无需求
              </div>
            </div>

            <!-- 完成榜 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>🏆</span> 完成榜
              </div>
              <div class="leaderboard-empty">
                <div class="empty-icon-row">🏮</div>
                <p class="empty-title-row">第一批灯火正在点亮</p>
                <p class="empty-desc-row">完成协作任务后，你将有机会上榜</p>
                <el-button size="small" round @click="$router.push('/task')" class="empty-action">浏览任务</el-button>
              </div>
            </div>

            <!-- 信用榜 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>⭐</span> 信用榜
              </div>
              <div class="leaderboard-empty">
                <div class="empty-icon-row">🛡️</div>
                <p class="empty-title-row">信用从这里开始</p>
                <p class="empty-desc-row">每完成一次可信协作，你的信用分都会增长</p>
                <el-button size="small" round @click="$router.push('/trust')" class="empty-action">了解信任机制</el-button>
              </div>
            </div>

            <!-- 最新加入 -->
            <div class="leaderboard-panel" style="margin-top: 16px;">
              <div class="leaderboard-title">
                <span>🆕</span> 最新加入
              </div>
              <div class="leaderboard-empty">
                <div class="empty-icon-row">🌟</div>
                <p class="empty-title-row">等你点亮浩煜</p>
                <p class="empty-desc-row">加入协作网络，成为第一批创造者</p>
                <el-button v-if="!isLogin" size="small" round @click="$router.push('/register')" class="empty-action">创建协作身份</el-button>
                <el-button v-else size="small" round @click="openCreateDialog" class="empty-action">发布第一个需求</el-button>
              </div>
            </div>
          </aside>
        </div>

        <!-- 信任机制区 -->
        <section class="trust-section">
          <h3>🏮 万家灯火 · 浩煜信任引擎</h3>
          <p style="font-size:13px;color:#64748b;margin-bottom:0;">每一次协作都有据可查，每一笔资金都有保障</p>
          <div class="trust-grid">
            <div class="trust-item"><span>💰</span> 资金托管</div>
            <div class="trust-item"><span>📝</span> 过程留痕</div>
            <div class="trust-item"><span>⭐</span> 信用沉淀</div>
            <div class="trust-item"><span>⚖️</span> 争议仲裁</div>
            <div class="trust-item"><span>🔍</span> 风控审计</div>
            <div class="trust-item"><span>🤖</span> AI 调度</div>
          </div>
        </section>

        <footer class="page-footer">
          <span>🏮 浩煜 Haoyu — 万家灯火</span>
          <span class="dot">·</span>
          <router-link to="/trust">信任与保障</router-link>
          <span class="dot">·</span>
          <span>资金托管 · 信用沉淀 · 争议仲裁</span>
        </footer>

        <!-- 移动端浮动发布按钮 -->
        <button
          v-if="isLogin"
          class="mobile-fab"
          @click="openCreateDialog"
          aria-label="发布需求"
        >
          <span class="fab-icon">+</span>
        </button>

        <!-- v0.2.6-hotfix2: 移动端底部 Tab + 中央发布入口视觉初版 -->
        <MobileBottomTabs :is-login="isLogin" @publish="openCreateDialog" />
      </div>

      <div class="content" v-else>
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 发布弹窗 -->
    <CreateTaskDialog v-model="showCreateDialog" @published="fetchData" />
  </div>

  <!-- 移动端菜单 + 底部 Tab -->
  <MobileDrawerMenu
    :open="mobileDrawerOpen"
    :is-login="isLogin"
    :user="currentUser"
    :title="mobileTitle"
    :items="mobileMenuItems"
    @update:open="mobileDrawerOpen = $event"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { formatYumiFromCent, formatYumiCompactFromCent, yumiToCent } from '@/utils/money'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search, CaretBottom, List, Checked, Wallet, User, Document, Bell, Setting, Lock, Tickets, Connection } from '@element-plus/icons-vue'
import { ActionSheet } from 'vant'
import { getTaskList, type Task } from '@/api/task'
import { getProfile, type UserProfile } from '@/api/user'
import { notificationApi } from '@/api/notification'
import { getWallet } from '@/api/wallet'
import CreateTaskDialog from '@/components/home/CreateTaskDialog.vue'
import MobileBottomTabs from '@/components/home/MobileBottomTabs.vue'
import MobileDrawerMenu from '@/components/home/MobileDrawerMenu.vue'
import HomeTopNav from '@/components/home/HomeTopNav.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeStatsStrip from '@/components/home/HomeStatsStrip.vue'
import HomeValueFlow from '@/components/home/HomeValueFlow.vue'
import ServiceCategoryGrid from '@/components/home/ServiceCategoryGrid.vue'
import FeaturedTaskSection from '@/components/home/FeaturedTaskSection.vue'

const router = useRouter()
const route = useRoute()

const isLogin = computed(() => !!localStorage.getItem('token'))
const currentUser = ref<UserProfile | null>(null)
const walletBalance = ref(0)
const unreadCount = ref(0)
const mobileDrawerOpen = ref(false)

const routeTitleMap: Record<string, string> = {
  '/task': '任务大厅', '/': '任务大厅',
  '/my-task': '我的任务', '/my-orders': '我接的订单',
  '/notifications': '通知中心', '/wallet': '钱包',
  '/trust': '信任中心', '/user': '用户管理',
  '/admin': '管理后台', '/profile': '个人资料',
}
const mobileTitle = computed(() => routeTitleMap[route.path] || '浩煜')

const mobileMenuItems = computed(() => {
  const items: any[] = [
    { label: '任务大厅', path: '/task', icon: 'List' },
  ]
  if (isLogin.value) {
    items.push(
      { label: '我的任务', path: '/my-task', icon: 'Tickets' },
      { label: '我接的订单', path: '/my-orders', icon: 'Connection' },
      { label: '通知', path: '/notifications', icon: 'Bell', badge: unreadCount.value },
      { label: '钱包', path: '/wallet', icon: 'Wallet' },
    )
  }
  items.push({ label: '信任中心', path: '/trust', icon: 'Lock' })
  if (isLogin.value && canSeeUserManage.value) {
    items.push({ label: '用户管理', path: '/user', icon: 'User' })
    items.push({ label: '管理后台', path: '/admin', icon: 'Setting' })
  }
  return items
})

const goMenu = (path: string) => {
  mobileDrawerOpen.value = false
  document.body.classList.remove('drawer-open')
  router.push(path)
}
const goHome = () => {
  mobileDrawerOpen.value = false
  document.body.classList.remove('drawer-open')
  router.push('/task')
}
const handleLogout = () => {
  logout()
}
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  mobileDrawerOpen.value = false
  document.body.classList.remove('drawer-open')
  window.location.reload()
}

// watch drawer open state to toggle body scroll
watch(mobileDrawerOpen, (val) => {
  if (val) document.body.classList.add('drawer-open')
  else document.body.classList.remove('drawer-open')
})

const loading = ref(false)
const tasks = ref<Task[]>([])
const searchKeyword = ref('')
const priceFilter = ref('all')
const showCreateDialog = ref(false)

const canSeeUserManage = computed(() =>
  ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.value?.role || '')
)

// === 工具函数 ===
const categoryLabel = (c: string) => {
  const m: Record<string, string> = {
    SKILL_SERVICE: '技能', LIFE_ASSISTANCE: '生活', FAMILY_CARE: '家庭',
    REMOTE_ASSISTANCE: '远程', COMMUNITY_COLLABORATION: '社区',
    PUBLIC_WELFARE: '公益', OTHER: '其他'
  }
  return m[c] || c
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    PENDING: '待接单', ASSIGNED: '进行中', IN_PROGRESS: '服务中',
    SUBMITTED: '待验收', COMPLETED: '已完成', CANCELLED: '已取消', DISPUTED: '争议中'
  }
  return m[s] || s
}

const statusClass = (s: string) => {
  const m: Record<string, string> = {
    PENDING: 'pending', ASSIGNED: 'active', IN_PROGRESS: 'active',
    SUBMITTED: 'active', COMPLETED: 'done', CANCELLED: 'danger', DISPUTED: 'danger'
  }
  return m[s] || 'pending'
}

const progressPercent = (s: string) => {
  const m: Record<string, string> = {
    PENDING: '0%', ASSIGNED: '25%', IN_PROGRESS: '50%',
    SUBMITTED: '75%', COMPLETED: '100%', CANCELLED: '100%', DISPUTED: '100%'
  }
  return m[s] || '0%'
}

const truncate = (text: string, len: number) =>
  text && text.length > len ? text.slice(0, len) + '...' : text || ''

const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return minutes + '分钟前'
  if (hours < 24) return hours + '小时前'
  if (days < 7) return days + '天前'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const isNewTask = (task: Task) => {
  if (!task.createdAt) return false
  const created = new Date(task.createdAt).getTime()
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return Date.now() - created < threeDays
}

const getFullUrl = (path: string) =>
  path ? (path.startsWith('http') ? path : `http://localhost:3000${path}`) : ''

// === 数据请求 ===
const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTaskList()
    let list = Array.isArray(res) ? res : res?.data || []
    if (searchKeyword.value) {
      list = list.filter((t: any) =>
        t.title?.includes(searchKeyword.value) || t.description?.includes(searchKeyword.value)
      )
    }
    if (priceFilter.value === 'low') list = list.filter((t: any) => t.price <= 9900)
    else if (priceFilter.value === 'mid') list = list.filter((t: any) => t.price >= 10000 && t.price <= 49900)
    else if (priceFilter.value === 'high') list = list.filter((t: any) => t.price >= 50000)
    tasks.value = list
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  if (!isLogin.value) { router.push('/login'); return }
  showCreateDialog.value = true
}

// === 个人信息 ===
const fetchProfile = async () => {
  try {
    if (isLogin.value) {
      const res = await getProfile()
      currentUser.value = res as any
      localStorage.setItem('currentUser', JSON.stringify(res))
    }
  } catch {
    currentUser.value = null
  }
}

const fetchUnreadCount = async () => {
  if (!isLogin.value) return
  try {
    const r: any = await notificationApi.unreadCount()
    unreadCount.value = r?.count ?? r ?? 0
  } catch {}
}

const fetchWalletBalance = async () => {
  if (!isLogin.value) return
  try {
    const w: any = await getWallet()
    walletBalance.value = w?.available ?? 0
  } catch {}
}

const handleCommand = (cmd: string) => {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'my-task') router.push('/my-task')
  if (cmd === 'wallet') router.push('/wallet')
  if (cmd === 'logout') {
    localStorage.clear()
    ElMessage.success('已退出登录')
    // 直接跳转首页，让 Vue 重新初始化，避免状态残留
    window.location.href = '/task'
  }
}

const handleMobileAvatarCommand = (cmd: string) => {
  mobileDrawerOpen.value = false
  document.body.classList.remove('drawer-open')
  handleCommand(cmd)
}

onMounted(() => {
  fetchProfile()
  fetchUnreadCount()
  fetchWalletBalance()
  fetchData()
  window.addEventListener('notification-read', fetchUnreadCount as any)
})
</script>

<style scoped>
/* ==========================================
   布局
   ========================================== */
.app-shell { display: flex; min-height: 100vh; }

/* === 侧边栏 === */
.sidebar {
  width: 200px; background: rgba(10, 14, 23, 0.95); backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  display: flex; flex-direction: column;
  position: fixed; top: 0; bottom: 0; z-index: 100;
}
.logo { display: flex; align-items: center; gap: 8px; padding: 20px 16px; cursor: pointer; }
.logo-mark {
  width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 8px; display: flex; align-items: center;
  justify-content: center; font-size: 18px; font-weight: 700;
}
.logo-text { font-size: 18px; font-weight: 700; color: #f1f5f9; }
.nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 8px; color: #94a3b8; text-decoration: none; font-size: 14px;
  transition: all 0.2s; position: relative;
}
.nav-item:hover { background: rgba(99, 102, 241, 0.08); color: #f1f5f9; }
.nav-item.active { background: rgba(99, 102, 241, 0.12); color: #a5b4fc; font-weight: 600; }
.nav-item.small { font-size: 12px; padding: 6px 12px; }
.badge {
  position: absolute; right: 10px; background: #ef4444; color: #fff;
  font-size: 11px; min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.sidebar-footer { padding: 8px; border-top: 1px solid rgba(148, 163, 184, 0.1); }

/* === 顶栏 === */
.topbar {
  height: 56px; background: rgba(10, 14, 23, 0.8); backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; position: sticky; top: 0; z-index: 50;
  /* v0.2.6 Phase 1: 顶栏底部微光 */
  box-shadow: 0 1px 0 rgba(99, 102, 241, 0.06);
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar-brand-mark {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border-radius: 6px;
  display: flex; align-items: center;
  justify-content: center; font-size: 15px; font-weight: 700;
  flex-shrink: 0;
}
.greeting { font-size: 14px; color: #94a3b8; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.balance-badge {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7; padding: 4px 12px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
}
.user-entry {
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  padding: 4px 12px; border-radius: 24px;
  background: rgba(148,163,184,0.06);
  border: 1px solid rgba(148,163,184,0.12);
  transition: all 0.2s ease;
}
.user-entry:hover {
  background: rgba(148,163,184,0.12);
  border-color: rgba(148,163,184,0.22);
}
.user-entry-nick {
  font-size: 14px; color: #cbd5e1; font-weight: 500;
  max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.user-entry-arrow {
  font-size: 12px; color: #64748b; margin-left: -2px;
}

.dropdown-trigger {
  cursor: pointer; font-size: 14px; color: #cbd5e1;
  display: flex; align-items: center; gap: 4px;
}

/* === 主区域 === */
.main-area { flex: 1; margin-left: 200px; background: #0a0e17; min-height: 100vh; }
.content { max-width: 1200px; margin: 0 auto; padding: 0 24px 40px; }

/* === Hero V2 — 万家灯火 === */
.hero-v2 {
  position: relative; overflow: hidden;
  padding: 72px 0 40px; text-align: center;
  min-height: 420px;
}
/* 灯火光源 */
.hero-lights {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
}
/* v0.2.6-hotfix1: PC 端隐藏手机端额外光点 */
.mobile-extra-dot { display: none; }
.light-dot {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(252,211,77,0.8) 0%, rgba(251,191,36,0.2) 50%, transparent 70%);
  animation: light-twinkle 3s ease-in-out infinite;
  filter: blur(1px);
}
/* 灯火光点分层：前景暖金，背景淡紫 */
.hero-lights::after {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.03) 0%, transparent 50%);
  pointer-events: none;
}
/* 底色渐变 — v0.2.6 Phase 1: 城市灯火氛围 */
.hero-gradient {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 45%),
    radial-gradient(ellipse at 20% 60%, rgba(6,182,212,0.04) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 80%, rgba(251,191,36,0.04) 0%, transparent 50%);
  pointer-events: none; z-index: 0;
}
/* v0.2.6-hotfix2: 城市灯火 / 灯笼 / 暖金光束 */
.hero-city-glow {
  position: absolute;
  left: 50%; bottom: -80px;
  width: min(980px, 110vw); height: 220px;
  transform: translateX(-50%);
  background:
    radial-gradient(ellipse at 50% 45%, rgba(251,191,36,0.18), transparent 58%),
    radial-gradient(ellipse at 28% 70%, rgba(99,102,241,0.12), transparent 54%),
    radial-gradient(ellipse at 72% 66%, rgba(6,182,212,0.08), transparent 50%);
  filter: blur(2px);
  pointer-events: none;
  z-index: 0;
}
.hero-cityline {
  position: absolute;
  left: 50%; bottom: 0;
  width: min(840px, 92vw);
  height: 74px;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}
.hero-cityline span {
  width: 22px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, rgba(30,41,59,0.86), rgba(15,23,42,0.9));
  border: 1px solid rgba(148,163,184,0.08);
  box-shadow: inset 0 6px 14px rgba(251,191,36,0.04), 0 -1px 10px rgba(251,191,36,0.04);
}
.hero-lantern-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.hero-lantern {
  position: absolute;
  color: rgba(252,211,77,0.46);
  filter: drop-shadow(0 0 18px rgba(251,191,36,0.18));
  animation: light-twinkle-soft 4s ease-in-out infinite;
}
.lantern-a { left: 14%; top: 18%; font-size: 30px; }
.lantern-b { right: 14%; top: 24%; font-size: 24px; animation-delay: 1.1s; }
.lantern-c { right: 23%; top: 12%; font-size: 18px; animation-delay: 1.8s; }
.hero-v2-content { position: relative; z-index: 1; }

.hero-tag-v2 {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 18px; border-radius: 20px;
  background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.22);
  color: #a5b4fc; font-size: 12px; font-weight: 600;
  margin-bottom: 20px; letter-spacing: 0.5px;
}
.tag-icon { font-size: 13px; }

.hero-title-v2 {
  font-size: 54px; font-weight: 900; color: #f1f5f9;
  margin: 0 0 10px; letter-spacing: -2px;
  line-height: 1.08;
  text-shadow: 0 0 36px rgba(99,102,241,0.14);
}
.hero-title-v2 .hero-sub-br {
  display: block;
}
.glow-text-v2 {
  background: linear-gradient(135deg, #a5b4fc 0%, #fcd34d 50%, #67e8f9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub-v2 {
  font-size: 20px; color: #e2e8f0; margin: 0 0 6px;
  max-width: 560px; margin-left: auto; margin-right: auto;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-shadow: 0 0 24px rgba(251,191,36,0.08);
}
.hero-sub-v2-extra {
  font-size: 14px; color: #64748b; margin: 0 0 28px;
  max-width: 500px; margin-left: auto; margin-right: auto;
  font-weight: 400;
}

.hero-actions-v2 {
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
  margin-bottom: 32px;
}

.btn-glow-v2 {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important; color: #fff !important;
  font-weight: 700 !important; font-size: 15px !important;
  box-shadow: 0 4px 24px rgba(99,102,241,0.35);
  transition: all 0.3s !important;
}
.btn-glow-v2:hover {
  box-shadow: 0 6px 32px rgba(99,102,241,0.5);
  transform: translateY(-2px);
}

/* v0.2.6 Phase 1: 暖金主按钮 */
.btn-warm-gold {
  font-weight: 800 !important;
  font-size: 15px !important;
  color: #0f172a !important;
  box-shadow: 0 4px 24px rgba(251, 191, 36, 0.35) !important;
  transition: all 0.3s !important;
}
.btn-warm-gold:hover {
  box-shadow: 0 8px 34px rgba(251, 191, 36, 0.52) !important;
  transform: translateY(-2px);
}

.btn-outline-v2 {
  background: transparent !important;
  border: 1px solid rgba(148,163,184,0.22) !important;
  color: #94a3b8 !important; font-size: 15px !important;
  transition: all 0.3s !important;
}
.btn-outline-v2:hover {
  border-color: #6366f1 !important; color: #a5b4fc !important;
}

/* 流转图 */
.hero-flow-v2 {
  max-width: 680px; margin: 0 auto;
  padding: 0 16px;
}
.flow-svg {
  width: 100%; height: auto;
  filter: drop-shadow(0 0 6px rgba(99,102,241,0.15));
}

/* === 数据看板 === */
.dashboard {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}
.stat-item {
  position: relative;
  flex: initial; text-align: center; padding: 18px 14px;
  background: linear-gradient(180deg, rgba(17,24,39,0.72), rgba(15,23,42,0.52));
  border: 1px solid rgba(148,163,184,0.12);
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.16);
  overflow: hidden;
}
.stat-item::before {
  content: '';
  position: absolute; left: 50%; top: -28px;
  width: 88px; height: 56px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(251,191,36,0.16), transparent 70%);
}
.stat-divider { display: none; }
/* v0.2.6 Phase 5: 数据指标暖金数字 */
.stat-number {
  font-size: 28px;
  font-weight: 800;
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
  background: linear-gradient(135deg, #a5b4fc, #67e8f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
}

/* === 价值流转图（增强版） === */
.value-flow-enhanced {
  display: flex; align-items: flex-start; justify-content: center;
  margin-bottom: 32px; padding: 18px 20px;
  background: linear-gradient(135deg, rgba(17,24,39,0.58), rgba(15,23,42,0.36));
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 18px;
  overflow-x: auto;
  box-shadow: 0 6px 26px rgba(0,0,0,0.12);
}
.value-flow-enhanced .flow-icon { font-size: 20px; margin-bottom: 6px; }
.value-flow-enhanced .flow-step-dot {
  min-width: 72px;
  padding: 8px 8px;
  border-radius: 14px;
  background: rgba(15,23,42,0.36);
  border: 1px solid rgba(148,163,184,0.08);
}

/* === 筛选行 === */
.filter-row {
  display: flex; gap: 12px; align-items: center; margin-bottom: 24px;
}
.search-input { max-width: 380px; }
.filter-select { width: 170px; }
.filter-select .el-input__wrapper {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
}

/* 上传按钮 */
/* ==========================================
   市场布局（任务网格 + 榜单侧栏）
   ========================================== */
.market-layout {
  display: flex; gap: 24px; margin-bottom: 40px; align-items: flex-start;
}
.market-main { flex: 1; min-width: 0; }

/* 任务卡片网格 — v0.2.6 Phase 2: PC 三列 + 间隙优化 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 福利标签微调 */
.welfare-badge {
  background: rgba(245,158,11,0.15);
  color: #fcd34d;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 6px;
  font-size: 10px;
}

/* === 榜单侧栏 === */
.leaderboard-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 72px;
}

/* 榜单空状态引导 */
.leaderboard-empty {
  text-align: center; padding: 16px 10px 12px;
}
.empty-icon-row {
  font-size: 28px; margin-bottom: 8px;
}
.empty-title-row {
  font-size: 13px; font-weight: 600; color: #cbd5e1; margin: 0 0 4px;
}
.empty-desc-row {
  font-size: 11px; color: #64748b; margin: 0 0 10px; line-height: 1.5;
}
.empty-action {
  font-size: 12px !important; padding: 5px 14px !important;
}
.empty-action:hover {
  transform: translateY(-1px);
}

/* === 卡片角标 === */
.card-corner-badge {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 6px;
  letter-spacing: 0.3px;
  pointer-events: none;
}
.card-corner-badge.hot {
  background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1));
  border: 1px solid rgba(251,191,36,0.3);
  color: #fcd34d;
}
.card-corner-badge.new {
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08));
  border: 1px solid rgba(99,102,241,0.25);
  color: #a5b4fc;
}
.task-card-premium.high-budget {
  border-color: rgba(251,191,36,0.25);
}
.task-card-premium.high-budget:hover {
  border-color: rgba(251,191,36,0.4);
  box-shadow: 0 10px 48px rgba(251,191,36,0.1);
}

/* 移动端底部 Tab + FAB 样式已在 MobileBottomTabs.vue */

/* === 信任机制 === */
.trust-section {
  margin-bottom: 40px; padding: 28px 32px 32px;
  background: rgba(17,24,39,0.35);
  border: 1px solid rgba(148,163,184,0.08);
  border-radius: 14px; text-align: center;
}
.trust-section h3 {
  font-size: 18px; color: #f1f5f9; margin-bottom: 6px;
}
.trust-grid {
  display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
  margin-top: 16px;
}
.trust-item {
  font-size: 14px; color: #94a3b8;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px;
  background: rgba(17,24,39,0.5);
  border: 1px solid rgba(148,163,184,0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: default;
}
.trust-item:hover {
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(99, 102, 241, 0.04);
  transform: translateY(-1px);
}
.trust-item span { font-size: 16px; }

/* === 页脚 — v0.2.6 Phase 5: 暖金点缀 === */
.page-footer {
  text-align: center; padding: 24px 0; font-size: 13px;
  color: #475569; display: flex; gap: 8px; justify-content: center;
  flex-wrap: wrap;
}
.page-footer a { color: #818cf8; }
.page-footer a:hover { color: #fbbf24; }
.dot { color: #334155; }

/* ==========================================
   移动端抽屉菜单
   ========================================== */
.mobile-topbar {
  display: none;
}
.mobile-menu-btn {
  width: 40px; height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  display: none;
  align-items: center; justify-content: center;
  flex-direction: column; gap: 4px;
  cursor: pointer;
  padding: 0;
}
.mobile-menu-btn span {
  width: 18px; height: 2px;
  border-radius: 999px;
  background: rgba(255,255,255,0.88);
  transition: transform 0.2s ease;
}
.mobile-topbar-right {
  display: flex; align-items: center; gap: 8px;
}
.mobile-avatar-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
}
.mobile-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-weight: 700; font-size: 13px;
}
.mobile-page-title {
  font-size: 15px; font-weight: 600; color: #f1f5f9;
  margin-left: 8px;
}

.mobile-drawer-user {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; margin-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.drawer-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-weight: 700; font-size: 16px;
}
.drawer-user-info { display: flex; flex-direction: column; gap: 2px; }
.drawer-nickname { color: #f1f5f9; font-size: 15px; font-weight: 500; }
.drawer-email { color: rgba(255,255,255,0.45); font-size: 12px; word-break: break-all; }

.mobile-drawer-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.52);
  z-index: 998;
  display: none;
}
.mobile-drawer {
  position: fixed; top: 0; left: 0;
  width: min(82vw, 320px); height: 100vh;
  z-index: 999;
  background: rgba(12, 17, 31, 0.98);
  border-right: 1px solid rgba(255,255,255,0.08);
  transform: translateX(-100%);
  transition: transform 0.22s ease;
  box-shadow: 24px 0 60px rgba(0,0,0,0.35);
  padding: 16px;
  display: none;
  flex-direction: column;
  overflow-y: auto;
}
.mobile-drawer-footer {
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;
}
.mobile-drawer.open { transform: translateX(0); }
.mobile-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 8px;
}
.brand {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.brand-logo {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.brand-name { font-size: 18px; font-weight: 700; color: #f1f5f9; }
.drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #94a3b8; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.mobile-drawer-menu {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
  padding: 8px 0;
}
.mdm-item {
  display: flex; align-items: center;
  padding: 10px 12px; border-radius: 10px;
  color: #cbd5e1; text-decoration: none; font-size: 15px;
  transition: background 0.15s ease;
  cursor: pointer; position: relative;
}
.mdm-item:hover, .mdm-item:active { background: rgba(99,102,241,0.12); color: #e2e8f0; }
.mdm-item.active { background: rgba(99,102,241,0.18); color: #a5b4fc; font-weight: 500; }
.mdm-badge { position: static; margin-left: auto; }

/* 原有移动端底部导航样式保留但隐藏 */
.mobile-nav { display: none !important; }
.mn-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  min-width: 48px; min-height: 48px;
  color: #64748b; text-decoration: none; font-size: 11px;
  position: relative; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: color 0.15s ease;
}
.mn-item .el-icon { font-size: 20px; }
.mn-item.active { color: #a5b4fc; }
.mn-item:active { color: #c7d2fe; }
.mn-publish {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 26px;
  display: flex; align-items: center; justify-content: center;
  margin-top: -20px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
}
.mn-publish:active {
  transform: scale(0.92);
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.25);
}
.mn-badge {
  position: absolute; top: 0; right: -6px;
  background: #ef4444; color: #fff;
  font-size: 10px; min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}

/* ==========================================
   响应式
   ========================================== */
@media (max-width: 1024px) {
  .leaderboard-sidebar {
    display: none !important;
  }
  .content {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .mobile-topbar {
    display: flex !important;
    position: fixed; top: 0; left: 0; right: 0; z-index: 900;
    height: 52px;
    align-items: center; justify-content: space-between;
    padding: 0 14px;
    background: rgba(8, 13, 26, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .mobile-menu-btn { display: flex !important; }
  .app-shell.is-drawer-open .mobile-topbar-right { opacity: 0; pointer-events: none; transition: opacity 0.15s ease; }
  .mobile-drawer-mask { display: block !important; }
  .mobile-drawer { display: flex !important; }
  body.drawer-open { overflow: hidden; }
  .app-shell {
    max-width: 100vw;
    overflow-x: hidden;
  }
  .app-shell > .sidebar { display: none !important; }
  .main-area {
    margin-left: 0 !important;
    width: 100% !important;
    padding-top: 52px !important;
    max-width: 100vw;
  }
  .topbar { padding: 0 12px !important; }
  .topbar .greeting { display: none !important; }
  .topbar-brand-mark { display: none !important; }
  /* v0.2.6-hotfix1: 手机端额外光点可见 */
  .mobile-extra-dot {
    display: block !important;
  }
  .content { padding: 0 12px 32px !important; max-width: 100vw; }

  /* Hero V2 移动端 — v0.2.6-hotfix2 强视觉首屏 */
  .hero-v2 {
    padding: 32px 0 26px !important;
    min-height: 390px;
    border-radius: 0 0 28px 28px;
    margin: 0 -12px 18px;
  }
  .hero-title-v2 {
    font-size: 34px !important;
    letter-spacing: -1.2px;
    margin-bottom: 12px;
  }
  .hero-sub-v2 { font-size: 20px !important; padding: 0 22px; text-shadow: 0 0 20px rgba(251,191,36,0.12); line-height: 1.5; }
  .hero-sub-v2-extra { font-size: 13px !important; padding: 0 8px; margin-bottom: 24px; }
  .hero-tag-v2 {
    background: rgba(251,191,36,0.11);
    border-color: rgba(251,191,36,0.24);
    color: #fcd34d;
    margin-bottom: 18px;
  }
  .hero-cityline { width: 96vw; height: 62px; opacity: 0.72; gap: 4px; }
  .hero-cityline span { width: 15px; }
  .hero-lantern { opacity: 0.7; }
  .lantern-a { left: 7%; top: 16%; font-size: 28px; }
  .lantern-b { right: 8%; top: 22%; font-size: 22px; }
  .lantern-c { right: 20%; top: 10%; font-size: 16px; }
  .hero-city-glow { height: 190px; bottom: -70px; }
  .hero-actions-v2 {
    flex-direction: column; align-items: center; gap: 10px;
    margin-bottom: 22px;
  }
  .hero-actions-v2 .el-button { width: 84%; min-height: 46px; }
  .hero-actions-v2 .el-button--warning {
    width: 84%; min-height: 48px;
    animation: gold-pulse 3s ease-in-out infinite;
    border-radius: 999px !important;
    font-size: 16px !important;
  }
  .hero-flow-v2 { padding: 0 4px; }

  /* 旧 Hero 兼容 */
  .hero { padding: 32px 0 24px !important; }
  .hero h1 { font-size: 24px !important; }
  .hero-subtitle { font-size: 14px !important; }
  .hero-actions { flex-direction: column; align-items: center; gap: 10px; }
  .hero-actions .el-button { width: 80%; }

  .dashboard {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 0;
    margin-bottom: 18px;
  }
  .stat-item { min-width: 0; padding: 14px 8px; border-radius: 16px; }
  .stat-number { font-size: 24px; }
  .stat-label { font-size: 11px; }
  .value-flow-enhanced { gap: 8px; padding: 12px; overflow-x: auto; justify-content: flex-start; border-radius: 18px; }
  .value-flow-enhanced .flow-step-connector { min-width: 12px; }
  .value-flow-enhanced .flow-step-dot { min-width: 66px; }
  .task-grid { grid-template-columns: 1fr; gap: 12px; }
  .market-layout { flex-direction: column; }
  .filter-row { flex-wrap: wrap; gap: 8px; }
  .filter-row .el-button { flex-shrink: 0; }
  .search-input { max-width: 100% !important; flex: 1; }
  .filter-select { width: 130px !important; flex-shrink: 0; }
  .filter-row .el-button { min-height: 44px; }
  .trust-grid { gap: 8px; }
  .trust-item { font-size: 12px; padding: 6px 10px; }
  .balance-badge { display: none; }

  /* 移动端底部 Tab + 中央发布入口 — v0.2.6-hotfix2 */
  .mobile-fab {
    display: none !important;
  }
  .mobile-bottom-tabs {
    display: grid !important;
    grid-template-columns: 1fr 1fr 74px 1fr 1fr;
    align-items: center;
    position: fixed;
    left: 12px; right: 12px;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    height: 64px;
    padding: 6px 8px;
    border-radius: 24px;
    background: rgba(10,14,23,0.92);
    border: 1px solid rgba(148,163,184,0.14);
    box-shadow: 0 12px 36px rgba(0,0,0,0.36), 0 0 28px rgba(99,102,241,0.08);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 940;
  }
  .mobile-tab-item,
  .mobile-tab-publish {
    border: 0;
    background: transparent;
    color: #94a3b8;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 10px;
    min-width: 0;
  }
  .mobile-tab-item.active { color: #fcd34d; }
  .tab-icon { font-size: 17px; line-height: 1; }
  .mobile-tab-publish {
    width: 58px; height: 58px;
    border-radius: 50%;
    justify-self: center;
    margin-top: -24px;
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
    color: #0f172a;
    font-size: 30px;
    line-height: 1;
    font-weight: 400;
    box-shadow: 0 10px 30px rgba(251,191,36,0.34);
    animation: gold-pulse 3.2s ease-in-out infinite;
  }
  .mobile-tab-publish:active { transform: scale(0.94); }
  .fab-icon {
    font-size: 28px; color: #fff; font-weight: 300;
    line-height: 1; margin-top: -1px;
  }

  /* ===== 手机端任务卡片 — 信息流布局重构 ===== */
  /* v0.2.6 Phase 3: 内间距微调 + 高预算暖金边框移动端适配 */
  .task-card-premium {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(15,23,42,0.88), rgba(15,23,42,0.72));
    border: 1px solid rgba(148,163,184,0.14);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    position: relative;
  }
  .task-card-premium:active {
    transform: scale(0.99);
    opacity: 0.95;
  }
  /* 高预算卡片移动端暖金边框 */
  .task-card-premium.high-budget {
    border-color: rgba(251,191,36,0.25);
  }

  /* meta 行：左侧 tags + 右侧 badge */
  .premium-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: nowrap;
  }
  .pct-tags {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  .premium-card-category {
    font-size: 10px;
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(148,163,184,0.08);
    color: #94a3b8;
    white-space: nowrap;
    font-weight: 600;
  }
  .status-badge {
    font-size: 10px;
    padding: 2px 10px;
    border-radius: 999px;
    white-space: nowrap;
    font-weight: 700;
  }
  .pct-badges.mobile-only-flow {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .mobile-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
    pointer-events: none;
    line-height: 1;
  }
  .mobile-badge.hot {
    background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1));
    border: 1px solid rgba(251,191,36,0.3);
    color: #fcd34d;
  }
  .mobile-badge.new {
    background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08));
    border: 1px solid rgba(99,102,241,0.25);
    color: #a5b4fc;
  }

  /* 标题 */
  .premium-card-title {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.45;
    color: #f1f5f9;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  /* 描述，最多两行，颜色降低 */
  .premium-card-desc-mobile {
    font-size: 13px;
    line-height: 1.5;
    color: #64748b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }
  .premium-card-desc-desktop {
    display: none;
  }

  /* 迷你进度条 — v0.2.6 Phase 3: 稍粗提升可见性 */
  .progress-mini {
    height: 4px;
    margin: 2px 0;
    border-radius: 2px;
  }
  .progress-mini .progress-fill {
    border-radius: 2px;
  }

  /* 底部信息区：两行布局 — v0.2.6 Phase 3: 价格/服务排列优化 */
  .premium-card-bottom {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 10px;
    border-top: 1px solid rgba(148,163,184,0.08);
  }
  .mobile-bottom-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .premium-card-price {
    font-size: 18px;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pcr-service {
    font-size: 12px;
    color: #94a3b8;
  }
  .premium-card-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #64748b;
  }

  /* FAB 底部留空 — 避免遮挡最后一张卡片 */
  .task-grid {
    padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
  }

  /* 两列卡片：确保宽度稳定，不出现半张挤压 */
  .task-card-premium {
    min-width: 0;
  }

  /* 两列模式下：描述压缩为1行，角标缩小，底部信息紧凑 */
  .premium-card-desc-mobile {
    -webkit-line-clamp: 1;
  }
  .mobile-badge {
    height: 20px;
    font-size: 9px;
    padding: 0 6px;
  }

  /* 隐藏桌面端元素 */
  .premium-card-price.desktop-only {
    display: none;
  }
  .premium-card-meta .desktop-only {
    display: none;
  }

  /* 移动端 meta 间距微调 */
  .premium-card-meta {
    gap: 8px;
    font-size: 11px;
  }

  /* 抽屉菜单项加大点击区 */
  .mdm-item {
    min-height: 48px;
    padding: 12px 14px !important;
  }

  /* 手机端隐藏钱包余额和桌面端用户入口（仅保留移动端统一入口） */
  .topbar .balance-badge { display: none !important; }
  .topbar .user-entry { display: none !important; }

  /* 手机端用户入口只保留移动顶栏的统一入口 */
  .topbar .user-entry-nick { display: none; }
  .user-entry {
    padding: 2px; gap: 0; background: none; border: none;
  }
  .user-entry-arrow { display: none; }

  /* 抽屉登录/注册/退出按钮加大点击区 */
  .mobile-drawer-footer .el-button {
    min-height: 44px;
    width: 100%;
    margin-top: 6px;
  }

  /* 移动端顶栏登录按钮 */
  .mobile-topbar-right .el-button {
    min-height: 36px;
  }

  /* 移动端顶栏头像按钮加大点击区 */
  .mobile-avatar-btn {
    width: 44px;
    height: 44px;
  }
}

/* ====== 大手机 / 小平板：任务卡片两列布局 ====== */
@media (min-width: 601px) and (max-width: 768px) {
  .task-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 12px;
  }
  .task-card-premium {
    min-width: 0;
  }
  /* 两列时价格稍小，描述更紧凑 */
  .premium-card-price {
    font-size: 16px;
  }
  .premium-card-desc-mobile {
    -webkit-line-clamp: 1;
  }
  .mobile-badge {
    height: 20px;
    font-size: 9px;
    padding: 0 6px;
  }
}

/* ====== van-action-sheet 暗色主题适配 ====== */
:deep(.van-action-sheet) {
  background: #1e293b !important;
}
:deep(.van-action-sheet__item) {
  background: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 15px !important;
  min-height: 48px;
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}
:deep(.van-action-sheet__item:active) {
  background: rgba(99,102,241,0.12) !important;
}
:deep(.van-action-sheet__cancel) {
  background: #1e293b !important;
  color: #94a3b8 !important;
  font-size: 15px !important;
  min-height: 48px;
}
:deep(.van-action-sheet__header) {
  background: #1e293b !important;
  color: #f1f5f9 !important;
}
:deep(.van-overlay) {
  background: rgba(0,0,0,0.52) !important;
}
:deep(.van-action-sheet__gap) {
  display: none !important;
}
</style>
