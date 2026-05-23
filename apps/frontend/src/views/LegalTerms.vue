<template>
  <div class="legal-page">
    <div class="legal-container">
      <h1>用户协议与隐私政策</h1>
      
      <section>
        <h2>一、平台服务协议</h2>
        <p>欢迎使用浩煜平台（以下简称"平台"）。本协议由您（"用户"）与平台运营方共同缔结。</p>
        
        <h3>1.1 平台定位</h3>
        <p>浩煜是一个<b>全民帮扶与可信价值协作平台</b>，连接需求方与服务者，提供任务发布、接单、资金托管、争议处理等基础服务。</p>
        <p><b>平台不提供</b>医疗诊断、法律咨询、金融投资、心理咨询、药品销售、保险代理、会计审计等需专业资质的服务。此类需求将被系统自动拒绝。</p>
        
        <h3>1.2 服务者责任</h3>
        <ul>
          <li>服务者应如实描述自身能力，不得虚假宣传</li>
          <li>服务者应在承诺时间内完成服务并提交成果</li>
          <li>服务者不得利用平台从事违法活动</li>
        </ul>
        
        <h3>1.3 需求方责任</h3>
        <ul>
          <li>需求方应如实描述任务需求</li>
          <li>需求方应在收到成果后及时验收确认</li>
          <li>需求方不得发布违法、违规或超出平台服务范围的需求</li>
        </ul>
      </section>

      <section>
        <h2>二、资金安全</h2>
        <h3>2.1 资金托管</h3>
        <p>需求方发布任务时，资金将从钱包余额中冻结，由平台托管。服务完成并确认后，资金自动结算给服务者。</p>
        
        <h3>2.2 退款规则</h3>
        <ul>
          <li>无人接单：全额退还至需求方钱包</li>
          <li>双方协商取消：按协商结果处理</li>
          <li>争议裁决：按裁决结果执行</li>
        </ul>
        
        <h3>2.3 平台费用</h3>
        <p>平台初期免收服务费。未来引入阶梯费率（0%/2%/5%/10%）时将提前公告。</p>
      </section>

      <section>
        <h2>三、线下服务安全须知</h2>
        <p>选择线下服务时，请注意以下安全事项：</p>
        <ul>
          <li>📌 首次见面请选择公共场所</li>
          <li>📌 告知家人/朋友服务地点和时间</li>
          <li>📌 服务过程中保持通讯畅通</li>
          <li>📌 如遇异常情况，立即终止服务并联系平台</li>
          <li>📌 平台为信息撮合平台，线下服务中的人身安全由服务双方自行负责</li>
        </ul>
      </section>

      <section>
        <h2>四、隐私政策</h2>
        <h3>4.1 信息收集</h3>
        <p>平台收集以下信息以提供服务：邮箱（用于登录/通知）、昵称、任务发布/接单记录、交易记录。</p>
        
        <h3>4.2 信息使用</h3>
        <p>您的信息仅用于：</p>
        <ul>
          <li>提供平台核心服务（任务匹配、资金结算）</li>
          <li>发送订单状态通知</li>
          <li>平台安全与风控</li>
        </ul>
        
        <h3>4.3 信息保护</h3>
        <p>平台采用以下措施保护您的数据：</p>
        <ul>
          <li>传输层 TLS 加密</li>
          <li>密码 bcrypt 哈希存储</li>
          <li>日志自动脱敏（密码/手机号等敏感字段）</li>
          <li>敏感操作需人工确认</li>
        </ul>
        
        <h3>4.4 数据删除</h3>
        <p>您可联系管理员注销账户。注销后，您的个人信息将被删除，但已完成订单的交易记录将依法保留。</p>
      </section>

      <section>
        <h2>五、免责声明</h2>
        <p>平台作为技术服务平台，不参与用户之间的具体交易。用户因使用平台服务产生的纠纷，平台将依据本协议和争议处理规则进行协调，但不承担超出平台责任的赔偿义务。</p>
        <p>线下服务中的人身安全和财产损失，由服务双方自行承担。平台建议用户采取适当的自我保护措施。</p>
      </section>

      <p class="version">版本：V1.0 | 生效日期：2026-05-18</p>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: var(--bg-primary, #0f0f1a);
}

.legal-container {
  max-width: 800px;
  margin: 0 auto;
  color: var(--text-primary, #e0e0e0);
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: var(--accent, #7c5cfc);
}

h2 {
  font-size: 1.3rem;
  margin: 2rem 0 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(124, 92, 252, 0.3);
}

h3 {
  font-size: 1.05rem;
  margin: 1.2rem 0 0.5rem;
  color: #b0a0f0;
}

p { line-height: 1.7; margin: 0.5rem 0; }
ul { padding-left: 1.5rem; }
li { line-height: 1.7; margin: 0.3rem 0; }

.version {
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  color: var(--text-muted, #666);
  font-size: 0.85rem;
  text-align: center;
}

section {
  background: var(--bg-card, rgba(255,255,255,0.03));
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}
</style>
