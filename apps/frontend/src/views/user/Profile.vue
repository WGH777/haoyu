<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>账号信息</span>
            </div>
          </template>
          
          <div class="avatar-section">
            <el-upload
              class="avatar-uploader"
              action="" 
              :http-request="handleUpload"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <div class="avatar-wrapper">
                <img 
                  v-if="avatarUrl && !imgError" 
                  :src="avatarUrl" 
                  class="avatar-img" 
                  @error="handleImgError"
                />
                
                <el-avatar 
                  v-else
                  shape="circle" 
                  :size="120" 
                  :style="{ backgroundColor: getNameColor(user.email), fontSize: '40px', color: '#fff' }"
                >
                  {{ getFirstLetter(user.email) }}
                </el-avatar>

                <div class="upload-mask">
                  <el-icon size="30"><Camera /></el-icon>
                  <span class="upload-text">更换头像</span>
                </div>
              </div>
            </el-upload>
            <p class="tips">点击头像更换 (自动居中裁剪)</p>
          </div>

          <el-descriptions :column="1" border class="mt-20">
            <el-descriptions-item label="昵称">{{ user.nickname }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <el-tag :type="getRoleTag(user.role)">{{ getRoleName(user.role) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="余额" class-name="balance-text">
              ¥ {{ ((user.balance || 0) / 100).toFixed(2) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="box-card">
          <template #header><div class="card-header"><span>修改密码</span></div></template>
          <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword"><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
            <el-form-item label="新密码" prop="newPassword"><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword"><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdatePwd" :loading="loading">提交修改</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { getProfile, updatePassword, uploadAvatar } from '@/api/user'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Camera } from '@element-plus/icons-vue'

const router = useRouter()
const user = ref<any>({})
const loading = ref(false)
const imgError = ref(false) // 标记图片是否加载失败
const pwdFormRef = ref()
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdRules = {
  oldPassword: [{ required: true, message: '必填', trigger: 'blur' }],
  newPassword: [{ required: true, message: '必填', trigger: 'blur' }, { min: 6, message: '至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认', trigger: 'blur' }]
}

// 计算属性：处理头像地址
const avatarUrl = computed(() => {
  if (!user.value.avatar) return ''
  if (user.value.avatar.startsWith('http')) return user.value.avatar
  return `http://localhost:3000${user.value.avatar}`
})

// 工具：首字母与随机色
const getFirstLetter = (email: string) => (email ? email.charAt(0).toUpperCase() : '?')
const getNameColor = (str: string) => {
  if (!str) return '#409EFF'
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9C27B0', '#3F51B5', '#009688']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const fetchData = async () => {
  try { 
    const res = await getProfile()
    user.value = res
    imgError.value = false // 重置错误状态
    localStorage.setItem('currentUser', JSON.stringify(res))
    window.dispatchEvent(new Event('balance-change')) 
  } catch (e) {}
}

const handleImgError = () => {
  // 如果图片加载失败（比如404），自动切换回首字母模式
  imgError.value = true
}

const handleUpload = async (options: any) => {
  const formData = new FormData(); formData.append('file', options.file)
  try { 
    loading.value = true
    await uploadAvatar(formData)
    ElMessage.success('上传成功')
    await fetchData() 
  } catch (e) { ElMessage.error('失败') } finally { loading.value = false }
}

const beforeAvatarUpload = (rawFile: any) => {
  if (!['image/jpeg', 'image/png'].includes(rawFile.type)) { ElMessage.error('格式不支持'); return false }
  if (rawFile.size / 1024 / 1024 > 2) { ElMessage.error('图片过大'); return false }
  return true
}

const getRoleName = (role: string) => ({ 'SUPER_ADMIN': '超级管理员', 'ADMIN': '管理员', 'USER': '普通员工' }[role] || role)
const getRoleTag = (role: string) => (role === 'SUPER_ADMIN' ? 'danger' : role === 'ADMIN' ? 'warning' : 'info')

const handleUpdatePwd = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid: boolean) => {
    if (valid) { try { loading.value = true; await updatePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword }); ElMessage.success('修改成功，请重登'); localStorage.clear(); router.push('/login') } catch (e) {} finally { loading.value = false } }
  })
}
const resetForm = () => { pwdFormRef.value?.resetFields() }

onMounted(() => { fetchData() })
</script>

<style scoped>
.profile-container { max-width: 1000px; margin: 20px auto; }
.avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }

/* 头像框容器 */
.avatar-uploader { 
  cursor: pointer; position: relative; 
  border-radius: 50%; width: 120px; height: 120px; 
  box-shadow: 0 4px 16px rgba(0,0,0,0.1); 
  /* 关键：去掉边框，改用 overflow hidden 裁剪内容 */
  overflow: hidden; 
}

/* 🔥 核心修复：强制让 el-upload 内部的触发器占满 100% */
.avatar-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.avatar-wrapper { 
  width: 100%; height: 100%; position: relative; 
  display: flex; justify-content: center; align-items: center;
  background: #f0f2f5; 
}

/* 图片自动填满并居中 */
.avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.upload-mask { 
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0,0,0,0.5); color: #fff; display: flex; flex-direction: column; 
  align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; 
  z-index: 10;
}
.avatar-uploader:hover .upload-mask { opacity: 1; }
.upload-text { font-size: 14px; margin-top: 8px; font-weight: 500; }
.tips { font-size: 13px; color: #909399; margin-top: 15px; }
.mt-20 { margin-top: 20px; }
</style>