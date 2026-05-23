<template>
  <div class="help-page">
    <h1>📖 帮助中心</h1>
    <p class="help-sub">关于浩煜平台的常见问题与解答</p>

    <div class="faq-list">
      <div v-for="(item, idx) in faqs" :key="idx" class="faq-card">
        <h3 class="faq-q">{{ item.q }}</h3>
        <p class="faq-a">{{ item.a }}</p>
      </div>
    </div>

    <div class="help-footer">
      <p>还有问题？<router-link to="/trust">查看信任中心</router-link>或<router-link to="/task">去任务大厅</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
const faqs = [
  { q: '浩煜是什么？', a: '浩煜是一个可信价值协作平台，连接真实需求与真实能力。你可以发布需求、接单服务，平台提供资金托管保障。' },
  { q: '如何发布需求？', a: '注册登录后，在任务大厅点击「发布需求」，填写标题、描述、预算、分类和服务方式即可。' },
  { q: '资金安全吗？', a: '发布付费需求时，资金进入平台托管。服务完成并确认后，资金才结算给服务者。若订单取消，资金退还。' },
  { q: '服务费怎么算？', a: '平台使用人民币计价。前30单免费；31-50单收取2%；51-100单收取5%；101单起收取10%。公益互助任务不收费。' },
  { q: '如何成为服务者？', a: '注册后在个人资料页申请认证，管理员审核通过后即可接单。完成订单越多，信用分越高。' },
  { q: '订单出现问题怎么办？', a: '可在订单详情页发起争议，平台会冻结资金并协调处理。服务者48h未开始服务会自动取消并退款。' },
  { q: '有哪些任务类型？', a: '技能服务、生活协助、家庭关怀、远程协助、社区协作、公益互助等，支持线上和线下两种方式。' },
  { q: '如何联系平台？', a: '当前为开发阶段，可通过站内通知或管理员后台联系我们。' },
]
</script>

<style scoped>
.help-page { max-width: 700px; margin: 40px auto; padding: 0 20px; }
.help-page h1 { font-size: 24px; color: #f1f5f9; margin-bottom: 8px; }
.help-sub { color: #cbd5e1; font-size: 14px; margin-bottom: 32px; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-card {
  padding: 20px 24px; border-radius: 14px;
  background: rgba(17,24,39,0.55);
  border: 1px solid rgba(148,163,184,0.1);
}
.faq-q { font-size: 15px; color: #a5b4fc; margin: 0 0 8px; font-weight: 600; }
.faq-a { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; }
.help-footer { margin-top: 32px; text-align: center; }
.help-footer p { color: #94a3b8; font-size: 13px; }
.help-footer a { color: #818cf8; }
</style>
