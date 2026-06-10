export interface ListItem {
  avatar: string;
  title: string;
  datetime: string;
  type: string;
  description: string;
  status?: "primary" | "success" | "warning" | "info" | "danger";
  extra?: string;
  link?: string;
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
        title: "用户治理能力已启用",
        description: "创建用户、重置密码、封禁/解封、调整角色等管理操作已全面上线。",
        datetime: "",
        type: "1",
        status: "success",
        link: "/admin/users"
      },
      {
        avatar: "",
        title: "管理操作将记录审计日志",
        description: "所有 SUPER_ADMIN 操作均自动记录，可在审计日志中查询追溯。",
        datetime: "",
        type: "1",
        status: "primary",
        link: "/admin/audit"
      },
      {
        avatar: "",
        title: "请定期复核管理员账号",
        description: "确认 ADMIN 和 SUPER_ADMIN 账号均为在职负责人，及时调整角色权限。",
        datetime: "",
        type: "1",
        status: "warning",
        link: "/admin/users"
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
        title: "创建用户记录请在审计日志查看",
        description: "每次创建用户操作均生成 CREATE_USER 审计记录，包含操作人和目标邮箱。",
        datetime: "",
        type: "2",
        link: "/admin/audit"
      },
      {
        avatar: "",
        title: "重置密码记录请在审计日志查看",
        description: "每次重置密码操作均生成 RESET_PASSWORD 审计记录，临时密码仅显示一次。",
        datetime: "",
        type: "2",
        link: "/admin/audit"
      },
      {
        avatar: "",
        title: "封禁/解封记录请在用户管理查看",
        description: "BAN_USER 与 UNBAN_USER 操作均记录在审计日志，可在用户页查看当前状态。",
        datetime: "",
        type: "2",
        link: "/admin/users"
      },
      {
        avatar: "",
        title: "角色调整记录请在审计日志查看",
        description: "CHANGE_USER_ROLE 记录了每次角色变更前后的状态和操作原因。",
        datetime: "",
        type: "2",
        link: "/admin/audit"
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
        title: "复核管理员账号",
        description: "检查当前 ADMIN 和 SUPER_ADMIN 账号列表，确保均为有效在职人员。",
        datetime: "",
        extra: "建议",
        status: "info",
        type: "3",
        link: "/admin/users"
      },
      {
        avatar: "",
        title: "检查异常用户状态",
        description: "查看是否有账号被频繁封禁/解封，或存在 SUSPENDED 状态需处理的用户。",
        datetime: "",
        extra: "建议",
        status: "warning",
        type: "3",
        link: "/admin/users"
      },
      {
        avatar: "",
        title: "查看仲裁记录",
        description: "在仲裁中心查看待处理争议，确认无超时未裁决的任务或订单。",
        datetime: "",
        extra: "建议",
        status: "info",
        type: "3",
        link: "/admin/arbitration"
      },
      {
        avatar: "",
        title: "观察钱包监控",
        description: "在钱包监控页面查看全站流水，关注大额交易和异常资金变动。",
        datetime: "",
        extra: "建议",
        status: "info",
        type: "3",
        link: "/admin/wallet"
      }
    ],
    emptyText: "暂无待办"
  }
];
