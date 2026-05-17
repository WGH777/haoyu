<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="发布新需求" width="560px" destroy-on-close>
    <el-form :model="form" label-position="top">
      <el-form-item label="给这次协作起个清楚的名字" required>
        <el-input v-model="form.title" placeholder="让人一眼知道你需要什么" maxlength="60" show-word-limit />
      </el-form-item>
      <el-form-item label="说说背景、目标和期望">
        <el-input v-model="form.desc" type="textarea" :rows="3" placeholder="越具体，匹配到合适的人越快" />
      </el-form-item>
      <el-form-item label="你愿意为这个需求支付多少？（¥）">
        <el-input-number v-model="form.price" :min="1" :step="10" :precision="2" style="width:200px" />
      </el-form-item>
      <el-form-item label="配图（可选）">
        <el-upload :http-request="(opts: any) => $emit('upload', opts)" :show-file-list="false" accept="image/*">
          <el-button type="primary" :loading="uploading" class="upload-btn">
            {{ form.image ? '已选图片' : '添加参考图' }}
          </el-button>
        </el-upload>
        <p style="font-size:12px;color:rgba(203,213,225,0.48);margin-top:6px">截图、样例图或补充说明都可以</p>
        <el-image v-if="form.image" :src="form.image" style="width:100px;height:100px;border-radius:8px;margin-top:8px" fit="cover" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.category" style="width:100%">
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
        <el-radio-group v-model="form.serviceMode">
          <el-radio label="ONLINE">线上</el-radio>
          <el-radio label="OFFLINE">线下</el-radio>
          <el-radio label="BOTH">均可</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="$emit('submit')">确认发布</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  form: { title: string; desc: string; price: number; category: string; serviceMode: string; image: string }
  uploading: boolean
  submitting: boolean
}>()

defineEmits<{
  'update:visible': [v: boolean]
  submit: []
  upload: [opts: any]
}>()
</script>

<style scoped>
.upload-btn {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.86), rgba(139, 92, 246, 0.86)) !important;
  border: 1px solid rgba(129, 140, 248, 0.30) !important;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.20) !important;
}
</style>
