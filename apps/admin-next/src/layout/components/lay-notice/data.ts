export interface ListItem {
  avatar: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
}

export interface TabItem {
  key: string;
  name: string;
  list: ListItem[];
  emptyText: string;
}

export const noticesData: TabItem[] = [
  {
    key: "1",
    name: "通知",
    list: [
      {
        avatar: "",
        title: "v0.2.3-trial 正在观察",
        description: "用户治理完整阶段已上线，包含分页搜索、创建用户、重置密码、封禁/解封、调整角色、审计日志。",
        datetime: "刚刚",
        type: "1",
        status: "primary"
      },
      {
        avatar: "",
        title: "用户治理模块已上线",
        description: "SUPER_ADMIN 可在用户管理页进行危险操作，所有操作均记录审计日志。",
        datetime: "今天",
        type: "1",
        status: "success"
      },
      {
        avatar: "",
        title: "请关注审计日志记录",
        description: "CREATE_USER / RESET_PASSWORD / BAN_USER / UNBAN_USER / CHANGE_USER_ROLE 五类事件已全量记录。",
        datetime: "今天",
        type: "1",
        status: "warning"
      }
    ],
    emptyText: "暂无通知"
  },
  {
    key: "2",
    name: "消息",
    list: [
      {
        avatar: "",
        title: "创建用户已接入 CREATE_USER 审计",
        description: "通过 POST /api/admin/users 创建的用户将自动记录管理员操作行为。",
        datetime: "今天",
        type: "2"
      },
      {
        avatar: "",
        title: "重置密码已接入 RESET_PASSWORD 审计",
        description: "SUPER_ADMIN 重置用户密码后将自动生成强密码并记录审计。",
        datetime: "今天",
        type: "2"
      },
      {
        avatar: "",
        title: "封禁/解封已接入审计",
        description: "BAN_USER / UNBAN_USER 操作均需填写原因，完整记录管理员行为。",
        datetime: "今天",
        type: "2"
      },
      {
        avatar: "",
        title: "调整角色已接入 CHANGE_USER_ROLE 审计",
        description: "仅支持 USER ↔ ADMIN 切换，禁止修改 SUPER_ADMIN 角色。",
        datetime: "今天",
        type: "2"
      }
    ],
    emptyText: "暂无消息"
  },
  {
    key: "3",
    name: "待办",
    list: [
      {
        avatar: "",
        title: "手机端 UI 细节优化",
        description: "通知弹层移动端适配、头像默认图、按钮间距微调。",
        datetime: "",
        extra: "计划中",
        status: "info",
        type: "3"
      },
      {
        avatar: "",
        title: "主站 /assets 缓存策略复核",
        description: "admin-next /static 已采用 no-cache，主站 /assets 仍为 immutable，需评估是否统一。",
        datetime: "",
        extra: "待评估",
        status: "warning",
        type: "3"
      },
      {
        avatar: "",
        title: "admin-next 部署路径标准化",
        description: "当前部署在 /home/web/html/haoyu-admin-next/，非标准路径，需迁移到 /var/www/ 下。",
        datetime: "",
        extra: "待排期",
        status: "warning",
        type: "3"
      },
      {
        avatar: "",
        title: "任务治理只读详情增强",
        description: "任务/订单列表仅展示基本信息，需补充详情页和状态筛选。",
        datetime: "",
        extra: "计划中",
        status: "info",
        type: "3"
      }
    ],
    emptyText: "暂无待办"
  }
];
