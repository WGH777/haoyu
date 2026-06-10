<template>
  <div class="showcase-page">
    <header class="showcase-nav">
      <button class="brand-lockup" type="button">
        <span class="brand-mark"><img :src="brandLogoSrc" alt="" /></span>
        <span>浩煜·万家灯火</span>
      </button>
      <nav aria-label="showcase navigation">
        <a v-for="item in navItems" :key="item" href="#overview">{{ item }}</a>
      </nav>
      <div class="nav-actions">
        <button type="button">通知 <b>8</b></button>
        <button type="button">钱包</button>
        <span class="avatar"><img :src="avatarSrc" alt="" /></span>
      </div>
    </header>

    <main>
      <section id="overview" class="hero-panel" :style="{ backgroundImage: heroBackground }">
        <div class="hero-copy">
          <p class="eyebrow">HaoYu Product Vision</p>
          <h1>浩煜·万家灯火，总有你的一颗</h1>
          <p>
            从需求发布、资金托管、协作交付到验收结算，让每一份任务都有路径、每一次协作都有回响。
          </p>
          <div class="hero-actions">
            <button class="primary-btn" type="button">发布需求</button>
            <button class="ghost-btn" type="button">查看任务大厅</button>
          </div>
        </div>
        <div class="hero-orbit">
          <article v-for="item in heroStats" :key="item.label">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </article>
        </div>
      </section>

      <section class="section-grid create-section">
        <div class="section-heading">
          <span>01</span>
          <h2>发布需求效果图</h2>
          <p>深色玻璃表单、暖金边框与资金托管提示，展示从填写需求到确认发布的完整体验。</p>
        </div>
        <article class="glass-card create-card">
          <div class="form-row">
            <label>需求标题</label>
            <div class="mock-input">品牌官网视觉设计升级</div>
          </div>
          <div class="form-row">
            <label>需求描述</label>
            <div class="mock-textarea">
              说明背景、目标、交付物与验收标准，支持参考图和阶段性沟通。
            </div>
          </div>
          <div class="form-pair">
            <div class="form-row">
              <label>需求分类</label>
              <div class="mock-select">设计创意 <span>⌄</span></div>
            </div>
            <div class="form-row">
              <label>预算金额</label>
              <div class="mock-number"><button>-</button><b>18,000</b><button>+</button></div>
            </div>
          </div>
          <div class="form-pair">
            <div class="form-row">
              <label>服务方式</label>
              <div class="radio-set"><span class="active">线上</span><span>线下</span><span>均可</span></div>
            </div>
            <div class="form-row">
              <label>参考图片</label>
              <button class="upload-btn" type="button">添加参考图</button>
            </div>
          </div>
          <div class="escrow-note">
            <strong>资金托管保障</strong>
            <span>发布后预算进入平台托管，验收通过再结算给服务者。</span>
          </div>
          <button class="primary-btn full" type="button">确认发布</button>
        </article>
      </section>

      <section class="market-section">
        <div class="section-heading wide">
          <span>02</span>
          <h2>任务市场</h2>
          <p>推荐任务、高预算任务与最新发布组成 PC 端任务大厅的核心浏览体验。</p>
        </div>
        <div class="tabs">
          <button v-for="tab in marketTabs" :key="tab" type="button">{{ tab }}</button>
        </div>
        <div class="task-grid">
          <article v-for="task in tasks" :key="task.title" class="glass-card task-card">
            <div class="card-top">
              <span>{{ task.category }}</span>
              <b :class="['status-pill', task.tone]">{{ task.status }}</b>
            </div>
            <h3>{{ task.title }}</h3>
            <p>{{ task.desc }}</p>
            <div class="task-meta">
              <strong>{{ task.price }}</strong>
              <span>{{ task.owner }} · {{ task.time }}</span>
            </div>
            <div class="tag-row">
              <i v-for="tag in task.tags" :key="tag">{{ tag }}</i>
            </div>
            <button class="ghost-btn small" type="button">查看详情</button>
          </article>
        </div>
      </section>

      <section class="detail-section">
        <article class="glass-card detail-card">
          <div class="cover" :style="{ backgroundImage: heroBackground }"></div>
          <div>
            <span class="status-pill gold">待接单</span>
            <h2>城市灯火品牌全案升级</h2>
            <p>完成品牌定位、首页视觉、组件规范和交付验收清单，适合远程协作与阶段提交。</p>
            <div class="detail-price">托管金额 <strong>¥ 36,000</strong></div>
            <div class="publisher">
              <img :src="avatarSrc" alt="" />
              <span>发布者：星海设计中心 · 信用 96</span>
            </div>
            <div class="action-row">
              <button class="primary-btn" type="button">接单</button>
              <button class="ghost-btn" type="button">提交成果</button>
              <button class="ghost-btn" type="button">验收结算</button>
              <button class="danger-btn" type="button">争议入口</button>
            </div>
          </div>
        </article>
        <article class="glass-card timeline-card">
          <h3>协作流程</h3>
          <ol>
            <li v-for="step in timeline" :key="step"><span></span>{{ step }}</li>
          </ol>
        </article>
      </section>

      <section class="dual-section">
        <article class="glass-card">
          <h2>我的任务 / 我的订单</h2>
          <div class="order-columns">
            <div v-for="column in orderColumns" :key="column.title">
              <h3>{{ column.title }}</h3>
              <div v-for="item in column.items" :key="item.name" class="order-row">
                <span><b :class="['status-dot', item.tone]"></b>{{ item.name }}</span>
                <em>{{ item.status }}</em>
                <button type="button">{{ item.action }}</button>
              </div>
            </div>
          </div>
        </article>
        <article class="glass-card wallet-card">
          <h2>钱包中心</h2>
          <div class="asset-grid">
            <div v-for="asset in assets" :key="asset.label">
              <span>{{ asset.label }}</span>
              <strong>{{ asset.value }}</strong>
            </div>
          </div>
          <div class="ledger-list">
            <div v-for="entry in ledger" :key="entry.type">
              <span>{{ entry.type }}</span>
              <b>{{ entry.amount }}</b>
              <em>{{ entry.note }}</em>
            </div>
          </div>
        </article>
      </section>

      <section class="three-column-section">
        <article class="glass-card">
          <h2>通知中心</h2>
          <div v-for="notice in notices" :key="notice.title" class="notice-row">
            <b>{{ notice.title }}</b>
            <span>{{ notice.desc }}</span>
            <em>{{ notice.state }}</em>
          </div>
          <div class="empty-state">暂无更多未读通知</div>
        </article>
        <article class="glass-card profile-card">
          <h2>个人中心</h2>
          <img :src="avatarSrc" alt="" />
          <h3>林栖灯火</h3>
          <p>linqi@haoyu.example</p>
          <div class="profile-fields">
            <span>角色 <b>认证服务者</b></span>
            <span>余额 <b>¥ 28,600</b></span>
            <span>简介 <b>品牌视觉与前端体验设计</b></span>
            <span>创建时间 <b>2025-08-16</b></span>
          </div>
          <div class="password-box">修改密码卡片 · 深色输入框 · 暖金按钮</div>
        </article>
        <article class="glass-card trust-card">
          <h2>信任中心 / 争议仲裁</h2>
          <div class="trust-score">信用分 <strong>96</strong></div>
          <p>完成率 98.6% · 好评率 99.1%</p>
          <ul>
            <li>仲裁进度：证据核验中</li>
            <li>证据材料：聊天记录、交付文件、验收说明</li>
            <li>平台处理结果：按阶段成果比例结算</li>
          </ul>
        </article>
      </section>

      <section class="admin-section glass-card">
        <div class="section-heading wide">
          <span>11</span>
          <h2>管理中枢效果图</h2>
          <p>只展示后台治理能力，不接真实后台，不触发强制结算或驳回逻辑。</p>
        </div>
        <div class="admin-grid">
          <div v-for="metric in adminMetrics" :key="metric.label">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </div>
        </div>
        <div class="admin-table">
          <div v-for="row in adminRows" :key="row.name">
            <span>{{ row.name }}</span>
            <em>{{ row.desc }}</em>
            <button type="button">{{ row.action }}</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import heroBg from '@/assets/haoyu-desktop/hero_banners/hero_banners_05_city_waterfront_banner.webp'
import brandLogo from '@/assets/haoyu-desktop/icons/icons_18_brand_leaf_logo.webp'
import avatar from '@/assets/haoyu-desktop/avatars/avatars_02_female_avatar_portrait.webp'

const heroBgSrc = heroBg
const brandLogoSrc = brandLogo
const avatarSrc = avatar
const heroBackground = `linear-gradient(90deg, rgba(4, 9, 18, .96), rgba(5, 10, 20, .72) 45%, rgba(5, 10, 20, .34)), url(${heroBgSrc})`

const navItems = ['产品总览', '发布需求', '任务市场', '钱包托管', '信任治理', '管理中枢']
const heroStats = [
  { value: '10万+', label: '注册用户' },
  { value: '3万+', label: '完成任务' },
  { value: '98.6%', label: '好评率' },
  { value: '1.2亿+', label: '托管资金' },
  { value: '24h', label: '平均响应' },
]
const marketTabs = ['推荐任务', '高预算任务', '最新发布', '设计创意', '开发技术', '文案策划', '视频动画', '营销推广']
const tasks = [
  { title: '高端家居品牌首页设计', desc: '重塑官网首屏、产品叙事与转化组件。', price: '¥ 28,000', status: '待接单', tone: 'gold', owner: '辰光家居', time: '15分钟前', category: '设计创意', tags: ['UI', '品牌', '官网'] },
  { title: '智能家居小程序开发', desc: '设备控制、场景联动、订单与消息提醒。', price: '¥ 42,000', status: '进行中', tone: 'blue', owner: '未来科技', time: '1小时前', category: '开发技术', tags: ['Vue', '小程序', 'IoT'] },
  { title: '产品宣传片脚本与剪辑', desc: '3-5 分钟产品卖点视频，含脚本与字幕。', price: '¥ 16,800', status: '待验收', tone: 'amber', owner: '光影映画', time: '今天', category: '视频动画', tags: ['脚本', '剪辑', '字幕'] },
  { title: '社区公益海报与推文', desc: '公益活动视觉、社媒推文和传播节奏。', price: '¥ 6,000', status: '已完成', tone: 'green', owner: '暖城社区', time: '昨天', category: '营销推广', tags: ['公益', '海报', '传播'] },
]
const timeline = ['需求发布', '资金托管', '接单协作', '成果提交', '验收结算', '信用沉淀']
const orderColumns = [
  { title: '我发布的任务', items: [
    { name: '品牌官网升级', status: '进行中', action: '查看详情', tone: 'blue' },
    { name: '宣传片制作', status: '待验收', action: '去验收', tone: 'amber' },
    { name: '文案策划包', status: '争议中', action: '发起争议', tone: 'red' },
  ] },
  { title: '我接取的任务', items: [
    { name: '数据大屏开发', status: '进行中', action: '提交成果', tone: 'blue' },
    { name: '活动视觉设计', status: '已完成', action: '查看详情', tone: 'green' },
  ] },
]
const assets = [
  { label: '可用余额', value: '¥ 86,420' },
  { label: '冻结金额', value: '¥ 36,000' },
  { label: '总资产', value: '¥ 122,420' },
]
const ledger = [
  { type: '充值', amount: '+ ¥ 20,000', note: '银行卡入账' },
  { type: '发布任务冻结', amount: '- ¥ 36,000', note: '品牌全案托管' },
  { type: '任务收入', amount: '+ ¥ 12,800', note: '验收结算' },
  { type: '解冻', amount: '+ ¥ 3,200', note: '预算剩余' },
  { type: '提现', amount: '- ¥ 8,000', note: '到账处理中' },
  { type: '平台调账', amount: '+ ¥ 600', note: '服务补偿' },
  { type: '风险准备金', amount: '- ¥ 400', note: '治理保障' },
]
const notices = [
  { title: '未读通知', desc: '你有 8 条新的协作动态', state: '未读' },
  { title: '任务状态通知', desc: '智能家居小程序已进入开发阶段', state: '已读' },
  { title: '验收通知', desc: '宣传片制作等待你确认验收', state: '未读' },
  { title: '结算通知', desc: '数据大屏任务收入已入账', state: '已读' },
  { title: '争议通知', desc: '文案策划包争议进入证据核验', state: '未读' },
]
const adminMetrics = [
  { label: '总用户数', value: '108,246' },
  { label: '总任务数', value: '42,819' },
  { label: '总订单数', value: '31,604' },
  { label: '待处理争议', value: '27' },
  { label: '资金监控', value: '¥ 1.2亿' },
]
const adminRows = [
  { name: '用户管理', desc: '认证、角色、信用画像', action: '查看' },
  { name: '任务监控', desc: '内容风险、预算异常、交付状态', action: '监控' },
  { name: '订单管理', desc: '接单、提交、验收、争议链路', action: '追踪' },
  { name: '强制结算', desc: '仅效果图展示，不触发真实操作', action: '展示' },
  { name: '强制驳回', desc: '仅效果图展示，不触发真实操作', action: '展示' },
]
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #050914;
}

button {
  font: inherit;
}

.showcase-page {
  min-height: 100vh;
  color: #fff2d6;
  background:
    radial-gradient(circle at 12% 8%, rgba(242, 179, 77, .12), transparent 28%),
    radial-gradient(circle at 88% 18%, rgba(116, 102, 215, .11), transparent 26%),
    linear-gradient(180deg, #050914 0%, #0a1020 44%, #060913 100%);
  overflow-x: hidden;
}

.showcase-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .36;
  background-image:
    radial-gradient(circle, rgba(255, 214, 145, .35) 0 1px, transparent 1.8px),
    linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 86px 86px, 100% 48px;
}

.showcase-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 240px 1fr auto;
  align-items: center;
  gap: 24px;
  height: 76px;
  padding: 0 34px;
  border-bottom: 1px solid rgba(255, 214, 145, .14);
  background: rgba(5, 10, 20, .82);
  backdrop-filter: blur(20px);
}

.brand-lockup,
.nav-actions button,
.ghost-btn,
.danger-btn,
.upload-btn,
.order-row button,
.admin-table button {
  border: 1px solid rgba(255, 214, 145, .22);
  color: #ffe6b3;
  background: rgba(255, 255, 255, .055);
  border-radius: 999px;
}

.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  font-size: 18px;
  font-weight: 900;
}

.brand-mark,
.avatar {
  display: inline-grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(255, 232, 174, .12);
  box-shadow: 0 0 0 1px rgba(255, 214, 145, .22), 0 12px 30px rgba(0, 0, 0, .24);
}

.brand-mark { width: 38px; height: 38px; }
.brand-mark img, .avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar { width: 36px; height: 36px; }

.showcase-nav nav {
  display: flex;
  justify-content: center;
  gap: 24px;
  min-width: 0;
}

.showcase-nav a {
  color: rgba(255, 232, 196, .66);
  text-decoration: none;
  font-size: 14px;
  white-space: nowrap;
}

.showcase-nav a:first-child,
.showcase-nav a:hover {
  color: #ffd16e;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-actions button {
  height: 38px;
  padding: 0 14px;
}

main {
  width: min(1280px, calc(100% - 56px));
  margin: 0 auto;
  padding: 28px 0 72px;
}

.hero-panel,
.glass-card {
  border: 1px solid rgba(255, 214, 145, .18);
  background:
    linear-gradient(180deg, rgba(255, 232, 174, .07), rgba(255, 255, 255, .026)),
    rgba(8, 14, 28, .82);
  box-shadow: 0 28px 80px rgba(0, 0, 0, .36), 0 0 42px rgba(196, 125, 43, .08), 0 0 0 1px rgba(255,255,255,.035) inset;
  backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 36px;
  min-height: 520px;
  padding: 66px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}

.eyebrow,
.section-heading span {
  color: #ffd16e;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
}

h1, h2, h3, p {
  margin: 0;
}

h1 {
  max-width: 680px;
  margin-top: 18px;
  font-size: 58px;
  line-height: 1.05;
  letter-spacing: 0;
}

.hero-copy p:not(.eyebrow) {
  max-width: 680px;
  margin-top: 22px;
  color: rgba(255, 232, 196, .72);
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.primary-btn {
  min-height: 46px;
  padding: 0 24px;
  border: 0;
  border-radius: 999px;
  color: #241307;
  font-weight: 900;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 16px 34px rgba(235, 164, 69, .26);
}

.ghost-btn,
.danger-btn {
  min-height: 46px;
  padding: 0 22px;
}

.danger-btn {
  color: #ffb9a7;
  border-color: rgba(193, 92, 65, .42);
}

.hero-orbit {
  align-self: end;
  display: grid;
  gap: 12px;
}

.hero-orbit article,
.stat-box,
.asset-grid div,
.admin-grid div {
  border: 1px solid rgba(255, 214, 145, .16);
  border-radius: 8px;
  background: rgba(4, 9, 17, .58);
}

.hero-orbit article {
  padding: 18px 20px;
}

.hero-orbit strong,
.asset-grid strong,
.admin-grid strong {
  display: block;
  color: #ffe8ae;
  font-size: 27px;
}

.hero-orbit span,
.asset-grid span,
.admin-grid span {
  color: rgba(166, 183, 207, .74);
}

.section-grid,
.detail-section,
.dual-section,
.three-column-section,
.admin-section {
  margin-top: 28px;
}

.section-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 24px;
}

.section-heading {
  padding: 28px 8px;
}

.section-heading h2,
.glass-card h2 {
  margin-top: 10px;
  font-size: 30px;
}

.section-heading p,
.glass-card > p,
.detail-card p,
.trust-card li,
.notice-row span {
  margin-top: 12px;
  color: rgba(166, 183, 207, .76);
  line-height: 1.7;
}

.glass-card {
  position: relative;
  border-radius: 8px;
  padding: 26px;
  overflow: hidden;
}

.glass-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 232, 174, .08), transparent) 0 0 / 100% 1px no-repeat;
}

.create-card {
  display: grid;
  gap: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 232, 196, .82);
  font-weight: 800;
}

.mock-input,
.mock-textarea,
.mock-select,
.mock-number {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 8px;
  color: #fff2d6;
  background: rgba(4, 9, 17, .74);
  box-shadow: 0 12px 26px rgba(0,0,0,.18);
}

.mock-textarea {
  min-height: 98px;
  align-items: flex-start;
  padding-top: 14px;
  color: rgba(255, 242, 214, .84);
}

.form-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mock-number {
  padding: 0;
}

.mock-number button {
  width: 44px;
  height: 44px;
  border: 0;
  color: #ffd16e;
  background: rgba(242, 179, 77, .10);
}

.radio-set,
.tag-row,
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-set span,
.tag-row i,
.tabs button {
  border: 1px solid rgba(255, 214, 145, .18);
  border-radius: 999px;
  color: rgba(166, 183, 207, .78);
  background: rgba(255, 255, 255, .045);
}

.radio-set span {
  padding: 11px 14px;
}

.radio-set .active,
.tabs button:first-child {
  color: #ffd16e;
  background: rgba(242, 179, 77, .15);
}

.upload-btn {
  width: 100%;
  min-height: 46px;
}

.escrow-note {
  display: grid;
  gap: 4px;
  padding: 16px;
  border-radius: 8px;
  color: #ffe8ae;
  background: rgba(242, 179, 77, .10);
  border: 1px solid rgba(255, 214, 145, .22);
}

.escrow-note span {
  color: rgba(166, 183, 207, .78);
}

.full {
  width: 100%;
}

.market-section {
  margin-top: 42px;
}

.wide {
  max-width: 760px;
}

.tabs {
  margin: 4px 0 18px;
}

.tabs button {
  height: 38px;
  padding: 0 16px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.task-card {
  min-height: 278px;
  display: flex;
  flex-direction: column;
}

.card-top,
.task-meta,
.publisher,
.order-row,
.ledger-list div,
.notice-row,
.admin-table div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.card-top span,
.small,
.order-row em,
.ledger-list em,
.notice-row em {
  color: rgba(166, 183, 207, .68);
  font-size: 12px;
}

.status-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.gold { color: #ffd16e; background: rgba(242, 179, 77, .14); }
.blue { color: #b7c7df; background: rgba(112, 132, 164, .18); }
.amber { color: #ffca72; background: rgba(245, 158, 11, .16); }
.green { color: #85e8c2; background: rgba(45, 178, 131, .16); }
.red { color: #ffb09b; background: rgba(193, 92, 65, .18); }

.task-card h3 {
  margin-top: 20px;
  font-size: 20px;
}

.task-card p {
  margin-top: 12px;
  color: rgba(166, 183, 207, .74);
  line-height: 1.65;
}

.task-meta {
  margin-top: auto;
  padding-top: 18px;
}

.task-meta strong,
.detail-price strong {
  color: #ffe8ae;
  font-size: 22px;
}

.tag-row {
  margin: 14px 0 16px;
}

.tag-row i {
  padding: 5px 9px;
  font-style: normal;
}

.detail-section {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, .8fr);
  gap: 20px;
}

.detail-card {
  display: grid;
  grid-template-columns: 42% minmax(0, 1fr);
  gap: 24px;
}

.cover {
  min-height: 340px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}

.detail-card h2 {
  margin-top: 16px;
  font-size: 34px;
}

.detail-price {
  margin-top: 18px;
  color: rgba(166, 183, 207, .76);
}

.publisher {
  justify-content: flex-start;
  margin-top: 18px;
  color: rgba(255, 232, 196, .74);
}

.publisher img,
.profile-card img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.timeline-card ol {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.timeline-card li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
  padding: 12px 0;
  color: rgba(255, 232, 196, .82);
}

.timeline-card li span {
  width: 12px;
  height: 12px;
  margin-top: 5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe8ae, #f2b34d);
  box-shadow: 0 0 0 4px rgba(242, 179, 77, .12);
}

.dual-section {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
  gap: 20px;
}

.order-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 20px;
}

.order-row,
.ledger-list div,
.notice-row,
.admin-table div {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 214, 145, .12);
  border-radius: 8px;
  background: rgba(4, 9, 17, .45);
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
}

.status-dot.blue { background: #b7c7df; }
.status-dot.amber { background: #ffca72; }
.status-dot.green { background: #85e8c2; }
.status-dot.red { background: #ff9a82; }

.order-row button,
.admin-table button {
  height: 32px;
  padding: 0 12px;
}

.asset-grid,
.admin-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.asset-grid div,
.admin-grid div {
  padding: 16px;
}

.ledger-list {
  margin-top: 16px;
}

.ledger-list b {
  color: #ffe8ae;
}

.three-column-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.empty-state,
.password-box {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  color: rgba(166, 183, 207, .68);
  background: rgba(4, 9, 17, .42);
  border: 1px dashed rgba(255, 214, 145, .18);
}

.profile-card {
  text-align: center;
}

.profile-card img {
  width: 72px;
  height: 72px;
  margin: 8px auto 14px;
}

.profile-fields {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  text-align: left;
}

.profile-fields span {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(166, 183, 207, .72);
}

.profile-fields b {
  color: #ffe8ae;
  text-align: right;
}

.trust-score {
  margin-top: 18px;
  color: rgba(166, 183, 207, .76);
}

.trust-score strong {
  display: block;
  color: #ffe8ae;
  font-size: 56px;
}

.trust-card ul {
  margin: 18px 0 0;
  padding-left: 18px;
}

.admin-section {
  padding: 30px;
}

.admin-grid {
  grid-template-columns: repeat(5, 1fr);
}

.admin-table {
  margin-top: 18px;
}
</style>
