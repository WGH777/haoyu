<template>
  <div class="trust-page">
    <section class="trust-hero">
      <div class="trust-orbit"></div>
      <div class="hero-copy">
        <span class="eyebrow">HaoYu Trust Engine</span>
        <h1>浩煜信任引擎</h1>
        <p>资金托管、过程留痕、信用沉淀与争议仲裁共同构成协作保障，让每一笔任务都有路径、每一次交付都有回响。</p>
      </div>
      <aside class="trust-score-card" aria-label="信任画像示例">
        <span>信用画像</span>
        <strong>96</strong>
        <p>完成率 98.6% · 好评率 99.1%</p>
      </aside>
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

    <section class="arbitration-section">
      <div class="section-heading">
        <span>Dispute Governance</span>
        <h2>争议仲裁流程</h2>
      </div>
      <div class="arbitration-grid">
        <article class="evidence-card">
          <strong>证据材料</strong>
          <p>聊天记录、交付文件、验收说明与资金流水共同构成核验依据。</p>
          <div class="evidence-tags">
            <span>沟通记录</span>
            <span>交付文件</span>
            <span>验收说明</span>
            <span>资金流水</span>
          </div>
        </article>
        <div class="dispute-steps">
          <div v-for="step in disputeSteps" :key="step.title" class="dispute-step">
            <span>{{ step.no }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
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
  { icon: '托', title: '资金托管', desc: '发布需求时资金进入平台托管，验收通过后再结算给服务者。' },
  { icon: '迹', title: '过程留痕', desc: '从接单、协作、提交到验收，每一步都有记录和通知。' },
  { icon: '信', title: '信用沉淀', desc: '交易评价、完成率与履约表现共同构成平台信用资产。' },
  { icon: '审', title: '风控审计', desc: '异常交易与可疑行为会被标记，并进入人工复核流程。' },
  { icon: '裁', title: '争议协调', desc: '双方提交证据，平台依据记录进行公正处理。' },
  { icon: '隐', title: '隐私保护', desc: '联系信息按交易阶段最小化展示，降低不必要暴露。' },
]

const disputeSteps = [
  { no: '01', title: '提交申请', desc: '交易双方在订单内提交争议原因与证据材料。' },
  { no: '02', title: '证据核验', desc: '平台核验聊天记录、交付文件、验收说明与资金流水。' },
  { no: '03', title: '平台处理', desc: '依据规则给出协调意见，必要时进入人工复核。' },
  { no: '04', title: '结果通知', desc: '处理结果同步双方，并写入审计与信用记录。' },
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
  max-width: 1160px;
  margin: 0 auto;
  padding: 30px;
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
    radial-gradient(circle at 18% 10%, rgba(255, 214, 145, .18), transparent 26%),
    radial-gradient(circle at 86% 12%, rgba(242, 179, 77, .13), transparent 28%),
    radial-gradient(circle at 50% 88%, rgba(92, 124, 166, .12), transparent 32%),
    linear-gradient(135deg, rgba(6, 10, 19, .84), rgba(8, 18, 32, .96) 50%, rgba(5, 8, 16, .98));
}

.trust-page::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: .40;
  background:
    linear-gradient(112deg, transparent 0 40%, rgba(255, 214, 145, .08) 40% 41%, transparent 41% 100%),
    radial-gradient(circle at 20% 86%, rgba(242, 179, 77, .12), transparent 24%);
}

.trust-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 24px;
  min-height: 320px;
  padding: 54px 42px;
  border: 1px solid rgba(255, 214, 145, .24);
  border-radius: 26px;
  background:
    radial-gradient(circle at 82% 30%, rgba(255, 184, 86, .18), transparent 28%),
    linear-gradient(120deg, rgba(5, 10, 20, .92), rgba(9, 21, 39, .70));
  box-shadow:
    0 24px 60px rgba(0, 0, 0, .36),
    0 0 42px rgba(242, 179, 77, .10),
    inset 0 1px 0 rgba(255, 255, 255, .08);
  overflow: hidden;
}

.trust-orbit {
  position: absolute;
  right: 68px;
  top: 34px;
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

.hero-copy {
  position: relative;
  z-index: 1;
}

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

.trust-score-card {
  position: relative;
  z-index: 1;
  align-self: center;
  padding: 22px;
  border: 1px solid rgba(255, 214, 145, .20);
  border-radius: 22px;
  background:
    radial-gradient(circle at 82% 12%, rgba(242, 179, 77, .18), transparent 34%),
    rgba(5, 10, 20, .54);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06);
}

.trust-score-card span,
.trust-score-card strong,
.trust-score-card p {
  display: block;
}

.trust-score-card span {
  color: rgba(255, 232, 196, .68);
  font-size: 13px;
}

.trust-score-card strong {
  margin: 10px 0 8px;
  color: #ffe8ae;
  font-size: 56px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.trust-score-card p {
  margin: 0;
  color: rgba(183, 200, 220, .68);
  font-size: 13px;
  line-height: 1.6;
}

.trust-metrics {
  grid-column: 1 / -1;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 150px));
  gap: 12px;
  margin-top: 8px;
}

.trust-metrics div {
  padding: 12px 16px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 16px;
  background: rgba(255, 255, 255, .05);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
}

.trust-metrics strong {
  display: block;
  color: #ffd073;
  font-size: 22px;
}

.trust-metrics span,
.feature-card p,
.tips p,
.dispute-step p,
.evidence-card p {
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
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.026)),
    rgba(5, 10, 20, .36);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, .20),
    inset 0 1px 0 rgba(255,255,255,.06);
  transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease;
}

.feature-card:hover {
  border-color: rgba(255, 214, 145, .30);
  transform: translateY(-1px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, .24), inset 0 1px 0 rgba(255,255,255,.06);
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
  font-size: 18px;
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

.arbitration-section {
  padding: 24px;
  margin-bottom: 22px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 24px;
  background:
    radial-gradient(circle at 95% 0%, rgba(255, 214, 145, .10), transparent 26%),
    rgba(4, 9, 17, .50);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
}

.arbitration-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.evidence-card,
.dispute-step {
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 18px;
  background: rgba(255, 255, 255, .035);
}

.evidence-card {
  padding: 20px;
}

.evidence-card strong,
.dispute-step strong {
  color: #fff7dd;
}

.evidence-card p,
.dispute-step p {
  margin: 8px 0 0;
  line-height: 1.7;
}

.evidence-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.evidence-tags span {
  padding: 5px 10px;
  border: 1px solid rgba(255, 214, 145, .14);
  border-radius: 999px;
  color: #ffe8ae;
  background: rgba(255, 214, 145, .07);
  font-size: 12px;
  font-weight: 700;
}

.dispute-steps {
  display: grid;
  gap: 10px;
}

.dispute-step {
  display: flex;
  gap: 14px;
  padding: 16px;
}

.dispute-step > span {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #2a1a05;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  font-size: 12px;
  font-weight: 900;
}

.rules-section {
  padding: 24px;
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 24px;
  background: rgba(4, 9, 17, .50);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
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
  background: rgba(255, 255, 255, .025);
  border-color: rgba(255, 214, 145, .13);
}

:deep(.trust-collapse .el-collapse-item__header) {
  padding: 0 14px;
  border-radius: 14px;
  font-weight: 800;
}

:deep(.trust-collapse .el-collapse-item__wrap) {
  margin-top: 4px;
  border-radius: 14px;
}

:deep(.trust-collapse .el-collapse-item__content) {
  padding: 14px 16px 16px;
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
  border-radius: 20px;
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 179, 77, .13), transparent 28%),
    rgba(242, 179, 77, .08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .05);
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
  .trust-hero { grid-template-columns: 1fr; padding: 34px 22px; }
  .trust-hero h1 { font-size: 32px; }
  .trust-orbit { opacity: .36; }
  .features { grid-template-columns: 1fr; }
  .trust-metrics { grid-template-columns: 1fr; }
  .arbitration-grid { grid-template-columns: 1fr; }
}
</style>
