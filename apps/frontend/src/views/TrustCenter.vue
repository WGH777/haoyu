<template>
  <div class="trust-page">
    <section class="trust-hero">
      <div class="trust-orbit"></div>
      <span class="eyebrow">HaoYu Trust Engine</span>
      <h1>浩煜信任引擎</h1>
      <p>资金托管、过程留痕、信用沉淀与争议仲裁共同构成协作保障，让每一笔任务都有路径、每一次交付都有回响。</p>
      <div class="trust-metrics">
        <div><strong>6</strong><span>保障机制</span></div>
        <div><strong>100%</strong><span>流程留痕</span></div>
        <div><strong>24h</strong><span>风险响应</span></div>
      </div>
    </section>

    <section class="features">
      <article v-for="item in features" :key="item.title" class="feature-card">
        <div class="feature-icon">{{ item.icon }}</div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
      </article>
    </section>

    <section class="rules-section">
      <div class="section-heading">
        <span>Governance</span>
        <h2>平台规则</h2>
      </div>
      <el-collapse class="trust-collapse">
        <el-collapse-item v-for="rule in rules" :key="rule.name" :title="rule.title" :name="rule.name">
          <ul>
            <li v-for="line in rule.lines" :key="line">{{ line }}</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </section>

    <section class="tips">
      <div class="tip-icon">!</div>
      <div>
        <strong>安全提醒</strong>
        <p>请勿私下转账或提供支付密码、验证码等敏感信息。平台不会以任何理由索要账户密码。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const features = [
  { icon: '¥', title: '资金托管', desc: '发布需求时资金进入平台托管，验收通过后再结算给服务者。' },
  { icon: '✓', title: '过程留痕', desc: '从接单、协作、提交到验收，每一步都有记录和通知。' },
  { icon: '★', title: '信用沉淀', desc: '交易评价、完成率与履约表现共同构成平台信用资产。' },
  { icon: '◎', title: '风控审计', desc: '异常交易与可疑行为会被标记，并进入人工复核流程。' },
  { icon: '⚖', title: '争议协调', desc: '双方提交证据，平台依据记录进行公正处理。' },
  { icon: '⌁', title: '隐私保护', desc: '联系信息按交易阶段最小化展示，降低不必要暴露。' },
]

const rules = [
  { name: '1', title: '资金托管规则', lines: ['发布付费需求时，等额资金自动冻结托管。', '服务完成并验收通过后，资金结算给服务者。', '订单取消或争议退款，资金按规则原路处理。', '资金变动写入流水，便于查询和追溯。'] },
  { name: '2', title: '平台服务费', lines: ['前 30 单免服务费。', '第 31-50 单服务费 2%。', '第 51-100 单服务费 5%。', '第 101 单起服务费 10%。', '公益互助任务不收取服务费。'] },
  { name: '3', title: '信用体系', lines: ['完成订单后双方可互评。', '信用记录包含完成率、好评率、准时率。', '频繁取消或纠纷可能影响信用等级。', '信用展示采用分级标签，保护隐私。'] },
  { name: '4', title: '争议处理', lines: ['双方协商不成时可申请平台协调。', '争议期间相关资金继续冻结。', '平台根据双方证据与流程记录裁决。', '裁决结果通知双方并写入审计记录。'] },
  { name: '5', title: '安全与隐私', lines: ['联系方式仅在订单确认后对交易方可见。', '订单完成后联系信息自动隐藏。', '平台不向第三方出售用户数据。', '管理员操作全程可审计、可追溯。'] },
]
</script>

<style scoped>
.trust-page {
  position: relative;
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px;
  color: #fff2d6;
  overflow: hidden;
}

.trust-page::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: 28px;
  background:
    radial-gradient(circle at 20% 12%, rgba(255, 214, 145, .16), transparent 24%),
    radial-gradient(circle at 86% 10%, rgba(242, 179, 77, .14), transparent 28%),
    radial-gradient(circle at 50% 86%, rgba(92, 124, 166, .14), transparent 30%),
    linear-gradient(180deg, rgba(5, 10, 20, .76), rgba(5, 10, 20, .94));
}

.trust-hero {
  position: relative;
  min-height: 300px;
  padding: 54px 42px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 24px;
  background:
    linear-gradient(120deg, rgba(5, 10, 20, .86), rgba(9, 21, 39, .62)),
    radial-gradient(circle at 82% 30%, rgba(255, 184, 86, .20), transparent 26%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .34), inset 0 1px 0 rgba(255, 255, 255, .06);
  overflow: hidden;
}

.trust-orbit {
  position: absolute;
  right: 44px;
  top: 38px;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  border: 1px solid rgba(255, 214, 145, .20);
  box-shadow: inset 0 0 40px rgba(242, 179, 77, .12), 0 0 34px rgba(242, 179, 77, .10);
}

.trust-orbit::before,
.trust-orbit::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(160, 178, 205, .16);
}

.trust-orbit::before { inset: 34px; }
.trust-orbit::after { inset: 72px; background: rgba(255, 214, 145, .10); }

.eyebrow,
.section-heading span {
  display: inline-flex;
  color: #ffd073;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.trust-hero h1 {
  margin: 12px 0 14px;
  font-size: 44px;
  line-height: 1.1;
  color: #ffe8ae;
}

.trust-hero p {
  max-width: 620px;
  margin: 0;
  color: rgba(255, 232, 196, .70);
  font-size: 16px;
  line-height: 1.8;
}

.trust-metrics {
  display: flex;
  gap: 12px;
  margin-top: 34px;
}

.trust-metrics div {
  min-width: 118px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 14px;
  background: rgba(255, 255, 255, .045);
}

.trust-metrics strong {
  display: block;
  color: #ffd073;
  font-size: 22px;
}

.trust-metrics span,
.feature-card p,
.tips p {
  color: rgba(255, 232, 196, .62);
}

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0;
}

.feature-card {
  min-height: 190px;
  padding: 24px;
  border: 1px solid rgba(255, 214, 145, .15);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.feature-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  margin-bottom: 18px;
  border-radius: 14px;
  color: #2a1a05;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  font-size: 22px;
  font-weight: 900;
}

.feature-card h3 {
  margin: 0 0 10px;
  color: #fff7dd;
  font-size: 18px;
}

.feature-card p {
  margin: 0;
  line-height: 1.7;
}

.rules-section {
  padding: 24px;
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 20px;
  background: rgba(4, 9, 17, .40);
}

.section-heading h2 {
  margin: 6px 0 18px;
  color: #ffe8ae;
  font-size: 28px;
}

:deep(.trust-collapse) {
  --el-collapse-border-color: rgba(255, 214, 145, .13);
  border: 0;
}

:deep(.trust-collapse .el-collapse-item__header),
:deep(.trust-collapse .el-collapse-item__wrap) {
  color: #fff2d6;
  background: transparent;
  border-color: rgba(255, 214, 145, .13);
}

:deep(.trust-collapse .el-collapse-item__content) {
  color: rgba(255, 232, 196, .68);
}

.rules-section ul {
  margin: 0;
  padding-left: 20px;
}

.rules-section li {
  margin-bottom: 8px;
  line-height: 1.7;
}

.tips {
  display: flex;
  gap: 14px;
  margin-top: 22px;
  padding: 18px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 18px;
  background: rgba(242, 179, 77, .08);
}

.tip-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #2a1a05;
  background: #ffd073;
  font-weight: 900;
}

.tips strong {
  color: #ffe8ae;
}

.tips p {
  margin: 6px 0 0;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .trust-page { padding: 12px; }
  .trust-hero { padding: 34px 22px; }
  .trust-hero h1 { font-size: 32px; }
  .trust-orbit { opacity: .36; }
  .features { grid-template-columns: 1fr; }
  .trust-metrics { flex-wrap: wrap; }
}
</style>