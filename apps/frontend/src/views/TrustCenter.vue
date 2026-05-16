<template>
  <div class="trust-page">
    <div class="hero">
      <h1>🔒 浩煜信任引擎</h1>
      <p class="subtitle">你的每一笔交易，都有完整的保障机制</p>
    </div>

    <el-row :gutter="20" class="features">
      <el-col :span="8" v-for="item in features" :key="item.title">
        <el-card shadow="hover" class="feature-card">
          <div class="feature-icon">{{ item.icon }}</div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-divider />

    <div class="rules-section">
      <h2>平台规则</h2>

      <el-collapse>
        <el-collapse-item title="💰 资金托管规则" name="1">
          <ul>
            <li>发布付费需求时，等额资金自动冻结托管，平台无法挪用</li>
            <li>服务完成且验收通过后，资金自动结算给服务者</li>
            <li>订单取消或争议退款，资金原路退回</li>
            <li>所有资金变动写入公开账本，随时可查</li>
          </ul>
        </el-collapse-item>

        <el-collapse-item title="📊 平台服务费" name="2">
          <ul>
            <li>前 30 单：<strong>免服务费</strong></li>
            <li>第 31-50 单：服务费 <strong>2%</strong></li>
            <li>第 51-100 单：服务费 <strong>5%</strong></li>
            <li>第 101 单起：服务费 <strong>10%</strong></li>
            <li>公益互助任务不收取服务费</li>
          </ul>
        </el-collapse-item>

        <el-collapse-item title="🔐 信用体系" name="3">
          <ul>
            <li>每笔完成的订单双方可互相评价</li>
            <li>信用记录包括：完成率、好评率、准时率</li>
            <li>频繁取消或纠纷可能影响信用等级和接单权限</li>
            <li>信用展示采用分级标签，保护隐私</li>
          </ul>
        </el-collapse-item>

        <el-collapse-item title="⚖️ 争议处理" name="4">
          <ul>
            <li>双方协商不成的争议，可申请平台协调</li>
            <li>争议期间相关资金继续冻结，保障双方权益</li>
            <li>平台根据双方证据做出裁决</li>
            <li>裁决结果通知双方并写入审计日志</li>
          </ul>
        </el-collapse-item>

        <el-collapse-item title="🛡 安全与隐私" name="5">
          <ul>
            <li>联系信息仅在订单确认后对交易对方可见</li>
            <li>订单完成后联系方式自动隐藏</li>
            <li>平台不向第三方出售用户数据</li>
            <li>所有管理员操作可审计、可追溯</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-divider />

    <div class="tips">
      <el-alert
        title="安全提醒"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>请勿私下转账或提供支付密码、验证码等敏感信息。</p>
          <p>平台不会以任何理由要求您提供账户密码。</p>
          <p>如遇可疑行为，请立即联系平台管理员。</p>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '💰',
    title: '资金托管',
    desc: '发布需求时资金自动冻结在平台托管账户，服务完成验收后才结算给服务者。平台不触碰用户资金。',
  },
  {
    icon: '📝',
    title: '过程留痕',
    desc: '从接单、开始服务、提交成果到确认完成，每一步都有记录和通知。服务过程透明可追踪。',
  },
  {
    icon: '⭐',
    title: '信用沉淀',
    desc: '每次交易积累信用。完成率高、评价好的用户将获得更好的匹配和信任。信用是你在平台的最重要资产。',
  },
  {
    icon: '🔍',
    title: '风控审计',
    desc: 'AI辅助风险识别 + 人工复核。异常交易、可疑行为自动标记。管理员操作全程可审计。',
  },
  {
    icon: '🤝',
    title: '争议协调',
    desc: '交易纠纷可通过平台争议系统处理。双方提交证据，平台公正裁决，资金按裁决结果执行。',
  },
  {
    icon: '🔒',
    title: '隐私保护',
    desc: '联系方式仅在交易期间对对方可见。个人信息最小化收集，不向第三方出售。数据可申请导出或删除。',
  },
]
</script>

<style scoped>
.trust-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}
.hero {
  text-align: center;
  padding: 32px 0;
}
.hero h1 {
  font-size: 28px;
  margin-bottom: 8px;
}
.subtitle {
  color: #666;
  font-size: 15px;
}
.features {
  margin: 20px 0;
}
.feature-card {
  text-align: center;
  border-radius: 10px;
  height: 100%;
  margin-bottom: 16px;
}
.feature-icon {
  font-size: 36px;
  margin-bottom: 10px;
}
.feature-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
.feature-card p {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
.rules-section h2 {
  font-size: 20px;
  margin-bottom: 16px;
}
.rules-section ul {
  padding-left: 20px;
}
.rules-section li {
  margin-bottom: 6px;
  line-height: 1.6;
}
.tips p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
