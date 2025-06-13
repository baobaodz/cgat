
# CGAT - Angular组件生成助手(自用)

![配置界面](https://github.com/baobaodz/picx-images-hosting/raw/master/cgat/image.4cl1p5p5qz.webp)![配置界面](https://github.com/baobaodz/picx-images-hosting/raw/master/cgat/image.51eb96e29q.webp)

CGAT (Custom Generate Angular Template) 是一个高效的 VS Code 扩展，专为快速生成企业级Angular组件模板而设计，支持模块化架构与可视化配置。

## 🌟 核心功能

### **一键生成**
- **右键生成**：在资源管理器目录右键 → `Generate Angular Component`  
- **模块化生成**：自动创建组件/模块/路由/服务文件  
- **智能关联**：自动检测最近模块并注入声明  

### **可视化配置**
- **Airbnb风格界面**：沉浸式配置体验  
- **动态预览**：实时查看生成的文件目录结构  
- **配置继承**：自动记忆用户偏好设置  

### **企业级模板**
- **预置功能模块**：
  ```text
  ├─ 筛选配置（企业/日期/高级筛选）
  ├─ 操作按钮（新增/删除/导入/导出）
  ├─ 表格功能（多选/编辑/删除）
  └─ 详情弹窗（抽屉/模态框）
  ```

## 🚀 快速开始

### **安装**
1. VS Code扩展市场搜索 `cgat`  
2. 点击安装，或手动安装 [最新Release包](https://github.com/baobaodz/cgat/releases)

### **使用**
1. **右键生成**  
   - 在目标目录右键 → `Generate Angular Component`  
   - 在配置面板设置参数 → 点击生成

2. **命令调用**  
   ```bash
   Ctrl+Shift+P → 输入命令：
   - "Generate Angular Component" : 生成组件
   - "Open CGAT Config"           : 打开全局配置
   ```

### **配置示例**
```json
// .vscode/settings.json
{
  "cgat.selectorPrefix": "yzf",
  "cgat.componentConfig": {
    "pre": { "generateModule": true },
    "filters": { "hasAdvancedFilter": true },
    "buttons": { "hasExportButton": true }
  }
}
```

## 🛠️ 高级功能

### **模块化架构**
```text
生成结构示例：
your-module/
├─ your-module.module.ts         # 模块文件
├─ your-module.service.ts        # 服务文件
├─ your-component/               # 组件目录
│  ├─ detail/                    # 详情子组件
│  └─ *.component.[ts|html|less] 
└─ your-module.const.ts          # 常量定义
```

### **智能代码注入**
- **自动更新模块声明**：
  ```typescript
  // 自动注入组件声明
  @NgModule({
    declarations: [
      ExistingComponent,
      YourNewComponent // ← 自动添加
    ]
  })
  ```

## 🎨 界面特性
| 功能             | 说明                          |
|------------------|-----------------------------|
| **动态路径预览** | 彩色标识已存在/新增文件        |
| **配置联动**     | 启用"新增按钮"自动显示详情配置 |
| **企业级校验**   | 强制组件名称kebab-case格式     |

### 
## 🤝 贡献
欢迎通过以下方式参与改进：
- 提交 Issue 报告问题
- Fork仓库并提交PR
- 补充单元测试（`test/` 目录）

## 📜 许可证
MIT License © [baobaodz](https://github.com/baobaodz)

