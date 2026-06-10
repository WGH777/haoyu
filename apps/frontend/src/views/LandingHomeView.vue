<template>
  <div class="landing-page">
    <HomeTopNav
      :is-login="isLogin"
      :user="currentUser"
      :wallet-balance="walletBalance"
      :search-keyword="searchKeyword"
      @update:search="searchKeyword = $event"
      @logout="handleLogout"
    />

    <HomeHero @publish="handlePublish" />

    <HomeStatsStrip :stats="{ users: '5万', orders: '2万', rating: '98', funds: '500万' }" />

    <HomeValueFlow />

    <ServiceCategoryGrid />

    <FeaturedTaskSection :tasks="tasks.slice(0, 6)" />

    <CreateTaskDialog v-model="showCreateDialog" @published="fetchData" />

    <MobileBottomTabs :is-login="isLogin" @publish="handlePublish" />
    <MobileDrawerMenu
      :open="mobileDrawerOpen"
      :is-login="isLogin"
      :user="currentUser"
      :title="'浩煜'"
      :items="mobileMenuItems"
      @update:open="mobileDrawerOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTaskList, type Task } from '@/api/task'
import { getProfile, type UserProfile } from '@/api/user'
import { getWallet } from '@/api/wallet'
import { notificationApi } from '@/api/notification'

import HomeTopNav from '@/components/home/HomeTopNav.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import HomeStatsStrip from '@/components/home/HomeStatsStrip.vue'
import HomeValueFlow from '@/components/home/HomeValueFlow.vue'
import ServiceCategoryGrid from '@/components/home/ServiceCategoryGrid.vue'
import FeaturedTaskSection from '@/components/home/FeaturedTaskSection.vue'
import CreateTaskDialog from '@/components/home/CreateTaskDialog.vue'
import MobileBottomTabs from '@/components/home/MobileBottomTabs.vue'
import MobileDrawerMenu from '@/components/home/MobileDrawerMenu.vue'

const router = useRouter()

const isLogin = computed(() => !!localStorage.getItem('token'))
const currentUser = ref<UserProfile | null>(null)
const walletBalance = ref(0)
const unreadCount = ref(0)
const searchKeyword = ref('')
const tasks = ref<Task[]>([])
const showCreateDialog = ref(false)
const loading = ref(false)
const mobileDrawerOpen = ref(false)

const mobileMenuItems = computed(() => {
  const items: any[] = [
    { label: '任务大厅', path: '/task', icon: 'HomeFilled' },
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
  return items
})

const handlePublish = () => {
  if (!isLogin.value) { router.push('/login'); return }
  showCreateDialog.value = true
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  window.location.reload()
}

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
    tasks.value = list
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

const fetchProfile = async () => {
  try {
    const cached = localStorage.getItem('currentUser')
    if (cached) { currentUser.value = JSON.parse(cached) }
    const res = await getProfile()
    currentUser.value = res
    localStorage.setItem('currentUser', JSON.stringify(res))
  } catch {
    currentUser.value = null
  }
}

const fetchWallet = async () => {
  if (!isLogin.value) return
  try {
    const w: any = await getWallet()
    walletBalance.value = w?.available ?? 0
  } catch { /* ok */ }
}

const fetchUnreadCount = async () => {
  if (!isLogin.value) return
  try {
    const r: any = await notificationApi.unreadCount()
    unreadCount.value = r?.count ?? 0
  } catch { /* ok */ }
}

onMounted(async () => {
  await Promise.all([fetchData(), fetchProfile(), fetchWallet(), fetchUnreadCount()])
})
</script>

<style>
body {
  background: #0a0e17;
  margin: 0;
}
.landing-page {
  min-height: 100vh;
  background: #0a0e17;
  overflow-x: hidden;
}
</style>
<style scoped>
@media (max-width: 768px) {
  .landing-page {
    padding-top: 52px;
  }
}
</style>
