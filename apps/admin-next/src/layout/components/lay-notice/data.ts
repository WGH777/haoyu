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
        title: "用户治理能力已启用",
        description: "创建用户、重置密码、封禁/解封、调整角色等管理操作已全面上线。",
        datetime: "",
        type: "1",
        status: "success"
      },
      {
        avatar: "",
        title: "管理操作将记录审计日志",
        description: "所有 SUPER_ADMIN 操作均自动记录，可在审计日志中查询追溯。",
        datetime: "",
        type: "1",
        status: "primary"
      },
      {
        avatar: "",
        title: "请妥善保管管理员账号",
        description: "SUPER_ADMIN 拥有最高权限，请勿分享账号或在不安全设备登录。",
        datetime: "",
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
        title: "创建用户后请及时通知账号负责人",
        description: "新创建的用户如需登录，请将账号信息安全发送给对应负责人。",
        datetime: "",
        type: "2"
      },
      {
        avatar: "",
        title: "重置密码后请提醒用户尽快修改",
        description: "临时密码仅显示一次，建议用户首次登录后立即修改密码。",
        datetime: "",
        type: "2"
      },
      {
        avatar: "",
        title: "角色调整后请复核权限范围",
        description: "将用户提升为 ADMIN 后，该用户可查看全站数据。请定期复核。",
        datetime: "",
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
        title: "定期检查审计日志",
        description: "建议每周查看审计日志，确认无异常管理操作。",
        datetime: "",
        extra: "建议",
        status: "info",
        type: "3"
      },
      {
        avatar: "",
        title: "定期复核管理员账号",
        description: "确认 ADMIN 和 SUPER_ADMIN 账号均为在职负责人，及时调整离职人员角色。",
        datetime: "",
        extra: "建议",
        status: "info",
        type: "3"
      },
      {
        avatar: "",
        title: "关注异常封禁与解封记录",
        description: "频繁的封禁/解封操作可能表示账号异常，请关注审计日志中的 BAN/UNBAN 记录。",
        datetime: "",
        extra: "建议",
        status: "warning",
        type: "3"
      }
    ],
    emptyText: "暂无待办"
  }
];
