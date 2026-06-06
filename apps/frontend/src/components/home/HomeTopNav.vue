<template>
  <nav class="home-top-nav">
    <div class="nav-inner">
      <div class="nav-brand" @click="$router.push('/task')">
        <span class="brand-logo">煜</span>
        <span class="brand-name">浩煜</span>
        <span class="brand-tagline">· 万家灯火</span>
      </div>
      <div class="nav-links">
        <a class="nav-link active" @click.prevent="$router.push('/task')">首页</a>
        <a class="nav-link" @click.prevent="$router.push('/task')">任务大厅</a>
        <a class="nav-link" @click.prevent="$router.push('/trust')">信任保障</a>
      </div>
      <div class="nav-search">
        <el-input
          :model-value="searchKeyword"
          @update:model-value="$emit('update:search', $event)"
          placeholder="找需求、找能力……"
          :prefix-icon="SearchIcon"
          clearable
          size="small"
          class="top-search-input"
        />
      </div>
      <div class="nav-actions">
        <template v-if="isLogin">
          <span class="balance-pill">{{ formatYumiCompactFromCent(walletBalance) }} 煜米</span>
          <el-dropdown trigger="click" @command="onCommand">
            <span class="user-avatar">
              <el-avatar :size="30" :style="{ backgroundColor: '#6366f1', color: '#fff', fontSize: '12px', verticalAlign: 'middle' }">
                {{ user?.email?.[0]?.toUpperCase() || '?' }}
              </el-avatar>
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
    </div>
  </nav>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { formatYumiCompactFromCent } from '@/utils/money'

const SearchIcon = markRaw(Search)
const router = useRouter()

defineProps<{
  isLogin: boolean
  user: any | null
  walletBalance: number
  searchKeyword: string
}>()
const emit = defineEmits<{ 'update:search': [v: string], 'logout': [] }>()

const onCommand = (cmd: string) => {
  if (cmd === 'logout') { emit('logout') }
  else { router.push('/' + cmd) }
}
</script>

<style scoped>
.home-top-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(8,13,26,0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(148,163,184,0.1);
}
.nav-inner {
  max-width: 1280px; margin: 0 auto;
  display: flex; align-items: center; gap: 20px;
  height: 56px; padding: 0 24px;
}
.nav-brand {
  display: flex; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0;
}
.brand-logo {
  width: 28px; height: 28px; border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.brand-name { font-size: 16px; font-weight: 700; color: #f1f5f9; }
.brand-tagline { font-size: 13px; color: #fbbf24; }
.nav-links { display: flex; gap: 6px; margin: 0 4px; }
.nav-link {
  padding: 6px 14px; border-radius: 8px;
  color: #94a3b8; font-size: 14px; cursor: pointer;
  transition: all 0.15s; text-decoration: none;
}
.nav-link:hover { color: #cbd5e1; background: rgba(255,255,255,0.04); }
.nav-link.active { color: #a5b4fc; background: rgba(99,102,241,0.1); }
.nav-search { flex: 1; max-width: 300px; margin: 0 auto; }
.top-search-input { --el-input-bg-color: rgba(255,255,255,0.04); }
.nav-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }
.balance-pill {
  padding: 3px 12px; border-radius: 14px;
  background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.2);
  color: #fcd34d; font-size: 13px; font-weight: 600;
}
.user-avatar { cursor: pointer; }
@media (max-width: 768px) {
  .home-top-nav { display: none; }
}
</style>
