<template>
  <el-dialog :model-value="modelValue" width="560px" destroy-on-close class="publish-dialog" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>
      <div class="publish-dialog-title">发布新需求</div>
    </template>
    <el-form :model="createForm" label-position="top" class="publish-form">
      <el-form-item label="给这次协作起个清楚的名字" required>
        <el-input v-model="createForm.title" placeholder="让人一眼知道你需要什么" maxlength="60" show-word-limit />
      </el-form-item>
      <el-form-item label="说说背景、目标和期望">
        <el-input v-model="createForm.desc" type="textarea" :rows="3" placeholder="越具体，匹配到合适的人越快" />
      </el-form-item>
      <el-form-item label="你愿意为这个需求支付多少？（煜米）">
        <el-input-number v-model="createForm.price" :min="1" :step="1" :precision="0" style="width:200px" />
        <span style="font-size:12px;color:rgba(203,213,225,0.48);margin-left:8px;">1 煜米 = 1 RMB</span>
      </el-form-item>
      <el-form-item label="配图（可选）">
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="handleImageChange">
          <el-button type="primary" :loading="uploadingImg" class="upload-btn">
            {{ previewImageUrl ? '已选图片' : '添加参考图' }}
          </el-button>
        </el-upload>
        <p class="upload-hint" style="font-size:12px;color:rgba(203,213,225,0.48);margin-top:6px;">截图、样例图或补充说明都可以</p>
        <div v-if="previewImageUrl" class="reference-preview">
          <img :src="previewImageUrl" class="reference-preview-img" alt="参考图预览" />
        </div>
        <div v-else class="reference-preview-placeholder">
          <span style="color:rgba(255,255,255,0.25);font-size:12px;">上传后将在此预览</span>
        </div>
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="createForm.category" style="width:100%">
          <el-option label="技能服务" value="SKILL_SERVICE" />
          <el-option label="生活协助" value="LIFE_ASSISTANCE" />
          <el-option label="家庭关怀" value="FAMILY_CARE" />
          <el-option label="远程协助" value="REMOTE_ASSISTANCE" />
          <el-option label="社区协作" value="COMMUNITY_COLLABORATION" />
          <el-option label="公益互助" value="PUBLIC_WELFARE" />
          <el-option label="其他" value="OTHER" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务方式">
        <el-radio-group v-model="createForm.serviceMode">
          <el-radio label="ONLINE">线上</el-radio>
          <el-radio label="OFFLINE">线下</el-radio>
          <el-radio label="BOTH">均可</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submitTask" :loading="submitting">确认发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { createTask, uploadTaskImage } from '@/api/task'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean], 'published': [] }>()

const submitting = ref(false)
const uploadingImg = ref(false)
const selectedImageFile = ref<File | null>(null)
const previewImageUrl = ref('')

const createForm = reactive({
  title: '', desc: '', price: 100, category: 'SKILL_SERVICE', serviceMode: 'ONLINE', image: ''
})

const submitTask = async () => {
  if (!createForm.title.trim()) { ElMessage.warning('请输入标题'); return }
  submitting.value = true
  try {
    let imageUrl = createForm.image || ''
    if (selectedImageFile.value) {
      uploadingImg.value = true
      try {
        const fd = new FormData(); fd.append('file', selectedImageFile.value)
        const res: any = await uploadTaskImage(fd)
        imageUrl = res?.url || ''
      } catch { /* 上传失败但不阻止发布 */ }
      finally { uploadingImg.value = false }
    }
    await createTask({
      title: createForm.title,
      description: createForm.desc,
      price: Math.round(createForm.price * 100),
      category: createForm.category,
      serviceMode: createForm.serviceMode,
      image: imageUrl || undefined
    } as any)
    ElMessage.success('需求已发布，等待合适的人来接单')
    emit('update:modelValue', false)
    createForm.title = ''; createForm.desc = ''; createForm.price = 100; createForm.image = ''
    previewImageUrl.value = ''; selectedImageFile.value = null
    emit('published')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleImageChange = (uploadFile: any) => {
  const raw = uploadFile?.raw || uploadFile
  if (!(raw instanceof File)) return
  selectedImageFile.value = raw
  if (previewImageUrl.value) URL.revokeObjectURL(previewImageUrl.value)
  previewImageUrl.value = URL.createObjectURL(raw)
}
</script>

<style scoped>
.publish-dialog-title {
  margin: 0;
  color: #ffffff !important;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-shadow: 0 0 18px rgba(124, 92, 255, 0.28);
}
:deep(.publish-dialog .el-dialog__header) {
  color: #ffffff !important;
}
.publish-form .el-form-item__label {
  color: rgba(255,255,255,0.82) !important;
  font-weight: 600 !important;
}
.publish-form .el-input__inner,
.publish-form .el-textarea__inner {
  color: rgba(255,255,255,0.92) !important;
}
.publish-form .el-input__inner::placeholder,
.publish-form .el-textarea__inner::placeholder {
  color: rgba(180,190,210,0.5) !important;
}
.upload-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.86), rgba(139, 92, 246, 0.86)) !important;
  border: 1px solid rgba(129, 140, 248, 0.30) !important;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.20) !important;
}
.reference-preview {
  width: 120px; height: 120px;
  border-radius: 10px; overflow: hidden;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  margin-top: 8px;
}
.reference-preview-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.reference-preview-placeholder {
  width: 120px; height: 120px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px dashed rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  margin-top: 8px;
}
</style>
