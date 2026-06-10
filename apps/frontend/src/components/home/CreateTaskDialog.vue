<template>
  <!-- ====== 桌面端弹窗 ====== -->
  <div class="publish-desktop">
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
  </div><!-- /.publish-desktop -->

  <!-- ====== 移动端全屏发布页 ====== -->
  <div v-show="modelValue" class="publish-mobile">
    <!-- sticky header -->
    <div class="pm-header">
      <button class="pm-back" @click="$emit('update:modelValue', false)">
        <span class="pm-back-icon">←</span>
        <span>返回</span>
      </button>
      <span class="pm-header-title">发布新需求</span>
      <el-button size="small" type="warning" round :loading="submitting" @click="submitTask" class="pm-submit-btn">
        发布
      </el-button>
    </div>

    <div class="pm-body">
      <!-- 标题 -->
      <div class="pm-field">
        <label class="pm-label">给这次协作起个清楚的名字</label>
        <el-input v-model="createForm.title" placeholder="让人一眼知道你需要什么" maxlength="60" show-word-limit class="pm-input" />
      </div>

      <!-- 描述 -->
      <div class="pm-field">
        <label class="pm-label">说说背景、目标和期望</label>
        <el-input v-model="createForm.desc" type="textarea" :rows="3" placeholder="越具体，匹配到合适的人越快" class="pm-textarea" />
      </div>

      <!-- 预算 -->
      <div class="pm-field">
        <label class="pm-label">你愿意为这个需求支付多少？（煜米）</label>
        <div class="pm-price-row">
          <el-input-number v-model="createForm.price" :min="1" :step="1" :precision="0" class="pm-price-input" controls-position="right" />
          <span class="pm-price-note">1 煜米 = 1 RMB</span>
        </div>
      </div>

      <!-- 分类（卡片式） -->
      <div class="pm-field">
        <label class="pm-label">分类</label>
        <div class="pm-cat-grid">
          <div
            v-for="cat in categoryOptions"
            :key="cat.value"
            class="pm-cat-option"
            :class="{ active: createForm.category === cat.value }"
            @click="createForm.category = cat.value"
          >{{ cat.label }}</div>
        </div>
      </div>

      <!-- 服务方式（并排卡片） -->
      <div class="pm-field">
        <label class="pm-label">服务方式</label>
        <div class="pm-mode-group">
          <div
            v-for="mode in serviceModeOptions"
            :key="mode.value"
            class="pm-mode-option"
            :class="{ active: createForm.serviceMode === mode.value }"
            @click="createForm.serviceMode = mode.value"
          >{{ mode.label }}</div>
        </div>
      </div>

      <!-- 配图 -->
      <div class="pm-field">
        <label class="pm-label">配图（可选）</label>
        <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="handleImageChange">
          <el-button type="primary" :loading="uploadingImg" class="pm-upload-btn">
            <img src="/assets/haoyu/mobile/icons_08_add_button_glow.webp" alt="" class="pm-upload-icon" />
            {{ previewImageUrl ? '已选图片' : '添加参考图' }}
          </el-button>
        </el-upload>
        <div v-if="previewImageUrl" class="pm-preview">
          <img :src="previewImageUrl" class="pm-preview-img" alt="参考图预览" />
        </div>
        <div v-else class="pm-preview-placeholder">
          <span>上传后将在此预览</span>
        </div>
      </div>
    </div>
  </div>
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

const categoryOptions = [
  { label: '技能服务', value: 'SKILL_SERVICE' },
  { label: '生活协助', value: 'LIFE_ASSISTANCE' },
  { label: '家庭关怀', value: 'FAMILY_CARE' },
  { label: '远程协助', value: 'REMOTE_ASSISTANCE' },
  { label: '社区协作', value: 'COMMUNITY_COLLABORATION' },
  { label: '公益互助', value: 'PUBLIC_WELFARE' },
  { label: '其他', value: 'OTHER' },
]

const serviceModeOptions = [
  { label: '线上', value: 'ONLINE' },
  { label: '线下', value: 'OFFLINE' },
  { label: '均可', value: 'BOTH' },
]

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
.publish-desktop { }
.publish-mobile { display: none; }

/* ====== 移动端全屏发布页 ====== */
@media (max-width: 768px) {
  .publish-desktop { display: none; }
  .publish-mobile {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: #05070d;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: calc(100px + env(safe-area-inset-bottom));
  }

  .pm-header {
    position: sticky;
    top: 0;
    height: 52px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(5,7,13,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 10;
    border-bottom: 1px solid rgba(148,163,184,0.08);
  }
  .pm-back {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: rgba(180,190,210,0.8);
    font-size: 14px;
    cursor: pointer;
    padding: 4px 0;
  }
  .pm-back-icon { font-size: 16px; }
  .pm-header-title {
    font-size: 17px;
    font-weight: 700;
    color: #f1f5f9;
  }
  .pm-submit-btn {
    min-height: 36px !important;
    padding: 0 18px !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    border-radius: 12px !important;
  }

  .pm-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pm-field { display: flex; flex-direction: column; gap: 8px; }
  .pm-label {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.82);
  }

  .pm-input { height: 44px; }
  .pm-input .el-input__wrapper { border-radius: 12px !important; }
  .pm-input .el-input__inner { font-size: 15px !important; }
  .pm-input .el-input__count .el-input__count-inner { background: transparent !important; color: rgba(180,190,210,0.4) !important; }

  .pm-textarea { }
  .pm-textarea .el-textarea__inner {
    min-height: 96px !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }

  .pm-price-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pm-price-input { width: 150px; }
  .pm-price-input .el-input-number__increase,
  .pm-price-input .el-input-number__decrease { border-radius: 0 12px 12px 0 !important; }
  .pm-price-note {
    font-size: 11px;
    color: rgba(203,213,225,0.48);
  }

  .pm-cat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .pm-cat-option {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: rgba(17,24,39,0.5);
    border: 1px solid rgba(148,163,184,0.1);
    color: rgba(255,255,255,0.65);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .pm-cat-option.active {
    border-color: #fbbf24;
    color: #fcd34d;
    background: rgba(251,191,36,0.08);
  }
  .pm-cat-option:active {
    background: rgba(251,191,36,0.15);
  }

  .pm-mode-group {
    display: flex;
    gap: 10px;
  }
  .pm-mode-option {
    flex: 1;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(17,24,39,0.5);
    border: 1px solid rgba(148,163,184,0.1);
    color: rgba(255,255,255,0.65);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .pm-mode-option.active {
    border-color: #fbbf24;
    color: #fcd34d;
    background: rgba(251,191,36,0.08);
  }
  .pm-mode-option:active {
    background: rgba(251,191,36,0.15);
  }

  .pm-upload-btn {
    min-height: 40px !important;
    border-radius: 12px !important;
    background: linear-gradient(135deg, rgba(99,102,241,0.86), rgba(139,92,246,0.86)) !important;
    border: 1px solid rgba(129,140,248,0.3) !important;
    box-shadow: 0 8px 20px rgba(99,102,241,0.2) !important;
  }
  .pm-upload-icon {
    width: 18px;
    height: 18px;
    margin-right: 6px;
    vertical-align: middle;
  }
  .pm-preview {
    width: 80px; height: 80px;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
  }
  .pm-preview-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .pm-preview-placeholder {
    width: 80px; height: 80px;
    border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px dashed rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
    color: rgba(255,255,255,0.25);
    font-size: 11px;
    text-align: center;
  }

  /* 375 断点 */
  @media (max-width: 375px) {
    .pm-body { padding: 12px; }
    .pm-input { height: 42px; }
    .pm-textarea .el-textarea__inner { min-height: 84px !important; }
    .pm-price-input { width: 120px; }
    .pm-cat-option { height: 40px; font-size: 12px; }
    .pm-mode-option { height: 38px; font-size: 12px; }
    .pm-preview { width: 72px; height: 72px; }
    .pm-preview-placeholder { width: 72px; height: 72px; }
  }

  /* 430 断点 */
  @media (min-width: 391px) and (max-width: 430px) {
    .pm-cat-option { height: 44px; }
    .pm-price-input { width: 160px; }
  }
}

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
