# Chrome 扩展打包上传说明

## 打包前检查清单

### 1. 必需文件确认
确保以下文件存在且完整：
- [x] `manifest.json` - 扩展配置文件
- [x] `content.js` - 核心功能脚本
- [x] `styles.css` - 样式文件
- [x] `icon16.png` - 16x16 图标
- [x] `icon48.png` - 48x48 图标
- [x] `icon128.png` - 128x128 图标
- [x] `README.md` - 项目说明（可选，不会打包进扩展）

### 2. 版本信息检查
当前版本：`1.0`（在 `manifest.json` 中定义）

每次更新上传前，需要在 `manifest.json` 中递增版本号：
```json
"version": "1.0"  → "1.1" 或 "1.0.1"
```

### 3. 清理不必要的文件
打包前应排除以下文件（不要包含在上传的 ZIP 中）：
- `.git/` - Git 版本控制目录
- `.gitignore` - Git 配置
- `CLAUDE.md` - 开发说明
- `PACKAGING.md` - 本文档
- `README.md` - 项目说明
- `gemini_example.html` - 测试文件
- `generate-icons.html` - 图标生成工具
- 任何 `.DS_Store` 文件（macOS 系统文件）

## 打包步骤

### 方法一：手动创建 ZIP（推荐）

1. **创建临时打包目录**
```bash
mkdir -p ../chat-line-package
```

2. **复制必需文件**
```bash
cp manifest.json ../chat-line-package/
cp content.js ../chat-line-package/
cp styles.css ../chat-line-package/
cp icon16.png ../chat-line-package/
cp icon48.png ../chat-line-package/
cp icon128.png ../chat-line-package/
```

3. **创建 ZIP 文件**
```bash
cd ../chat-line-package
zip -r ../chat-line-v1.0.zip .
```

4. **清理临时目录**
```bash
cd ..
rm -rf chat-line-package
```

### 方法二：使用脚本自动打包

创建 `package.sh` 脚本：
```bash
#!/bin/bash
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
PACKAGE_NAME="chat-line-v${VERSION}.zip"

# 创建临时目录
TEMP_DIR=$(mktemp -d)

# 复制必需文件
cp manifest.json "$TEMP_DIR/"
cp content.js "$TEMP_DIR/"
cp styles.css "$TEMP_DIR/"
cp icon*.png "$TEMP_DIR/"

# 创建 ZIP
cd "$TEMP_DIR"
zip -r "$OLDPWD/$PACKAGE_NAME" .

# 清理
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

echo "✓ 打包完成: $PACKAGE_NAME"
```

使用方法：
```bash
chmod +x package.sh
./package.sh
```

## 上传到 Chrome Web Store

### 1. 准备商店资料

#### 必需的商店资料
- **扩展名称**：ChatGPT Outline
- **简短描述**（132 字符以内）：
  ```
  为 ChatGPT、DeepSeek 和 Gemini 对话生成可导航的大纲侧边栏，快速跳转到对话的任意位置。
  ```
- **详细描述**：
  ```
  ChatGPT Outline 是一个浏览器扩展，为您的 AI 对话添加智能导航功能。

  主要特性：
  • 自动生成对话大纲 - 将问答对显示在右侧侧边栏
  • 快速导航 - 点击任意问题即可跳转到对话的相应位置
  • 多平台支持 - 支持 ChatGPT、DeepSeek 和 Gemini
  • 可调整大小 - 拖动边框调整侧边栏宽度
  • 可折叠界面 - 需要时展开，不需要时收起

  支持的网站：
  • https://chatgpt.com
  • https://chat.openai.com
  • https://chat.deepseek.com
  • https://gemini.google.com

  使用方法：
  1. 安装扩展
  2. 访问支持的 AI 对话网站
  3. 侧边栏会自动出现在右侧
  4. 点击问题标题即可跳转到对应位置

  隐私说明：
  本扩展仅在浏览器本地运行，不收集或上传任何数据。
  ```

#### 必需的截图（至少 1 张，最多 5 张）
建议准备以下截图（1280x800 或 640x400）：
1. ChatGPT 界面展示侧边栏的完整截图
2. DeepSeek 界面使用示例
3. Gemini 界面使用示例
4. 侧边栏折叠/展开状态对比
5. 拖动调整大小的演示

#### 可选资料
- **宣传图片**（440x280）：用于商店展示
- **宣传视频**：YouTube 链接，展示扩展功能

### 2. 上传流程

1. **访问 Chrome Web Store 开发者控制台**
   - 网址：https://chrome.google.com/webstore/devconsole
   - 需要 Google 账号和一次性 $5 开发者注册费

2. **创建新项目**
   - 点击"新增项目"
   - 上传打包好的 ZIP 文件

3. **填写商店信息**
   - 商店列表标签：选择"扩展程序"
   - 类别：选择"生产工具"或"辅助功能"
   - 语言：选择"中文（简体）"和"English"

4. **隐私设置**
   - 单一用途说明：为 AI 对话网站添加导航大纲功能
   - 权限说明：
     - `activeTab`：用于在当前标签页注入侧边栏界面
   - 数据使用：不收集用户数据

5. **提交审核**
   - 检查所有信息无误
   - 点击"提交审核"
   - 通常需要 1-3 个工作日

## 更新版本

更新扩展时：
1. 修改代码
2. 在 `manifest.json` 中递增版本号
3. 重新打包
4. 在开发者控制台上传新版本
5. 填写更新说明
6. 提交审核

## 常见问题

### Q: 审核被拒怎么办？
A: 查看拒绝原因，通常是：
- 权限使用说明不清楚
- 截图不符合要求
- 描述信息不完整
根据反馈修改后重新提交。

### Q: 如何测试打包后的扩展？
A: 在 Chrome 中：
1. 访问 `chrome://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择解压后的文件夹

### Q: 支持其他浏览器吗？
A: 可以上传到：
- Edge Add-ons（使用相同的 ZIP 包）
- Firefox Add-ons（可能需要调整 manifest.json）

## 检查清单

上传前最后检查：
- [ ] 版本号已更新
- [ ] 所有功能正常工作
- [ ] 在 ChatGPT、DeepSeek 上测试通过
- [ ] 图标清晰无模糊
- [ ] ZIP 文件不包含多余文件
- [ ] 商店描述准确完整
- [ ] 截图准备齐全
- [ ] 隐私政策说明清楚
