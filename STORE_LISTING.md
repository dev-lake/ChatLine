# Chrome Web Store 提交信息

本文档汇总了提交扩展到 Chrome Web Store 所需的所有信息。

## 基本信息

- **扩展名称**: ChatGPT Outline
- **版本**: 1.0
- **分类**: Productivity
- **语言**: English

## 简短描述 (Short Description)

最多 132 字符：

```
Adds a navigable outline sidebar to ChatGPT, DeepSeek, and Gemini conversations for quick navigation.
```

## 详细描述 (Detailed Description)

```
ChatGPT Outline Extension adds a convenient sidebar to your ChatGPT, DeepSeek, and Gemini conversations, making it easy to navigate long chats.

Features:
• Auto-generated outline of Q&A pairs
• Click any item to jump to that part of the conversation
• Resizable sidebar - drag to adjust width
• Collapsible design with floating expand button
• Dark mode support
• Works seamlessly with ChatGPT, DeepSeek, and Gemini

The extension runs entirely in your browser with no data collection or external requests. All processing happens locally to ensure your privacy.

Perfect for:
- Reviewing long conversations
- Quickly finding specific topics
- Organizing complex multi-topic chats
- Improving chat navigation experience
```

## 单一用途说明 (Single Purpose Description)

提交时在 "Justification" 字段中填写：

```
Single Purpose Description:

This extension adds a navigable outline sidebar to ChatGPT, DeepSeek, and Gemini chat interfaces. It scans conversation messages in real-time, extracts question-answer pairs, and displays them as a collapsible outline on the right side of the page. Users can click on any item in the outline to quickly jump to that part of the conversation.

The extension requires host permissions for chatgpt.com, chat.openai.com, and chat.deepseek.com to:
1. Read conversation messages from the page DOM
2. Inject the outline sidebar UI
3. Adjust page layout to accommodate the sidebar

All processing happens locally in the browser. No data is collected, transmitted, or stored externally. The extension uses only content scripts with no background processes or external network requests.
```

## 权限说明 (Permission Justification)

**请求的主机权限**:
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`
- `https://chat.deepseek.com/*`

**用途说明**:
```
Host Permissions Justification:

The extension requires access to these specific domains to provide its core functionality:

1. Read conversation messages from the page DOM to generate the outline
2. Inject the sidebar UI into the page
3. Adjust page layout to accommodate the sidebar without obscuring content

The extension uses content scripts that only run on these specific chat platforms. No other permissions are requested. All processing happens locally in the browser with no external network requests.
```

## 隐私政策 (Privacy Policy)

**隐私政策 URL**:
```
https://github.com/你的用户名/chat-line#privacy-policy
```

（记得替换为你的实际 GitHub 用户名）

**隐私政策内容** (已添加到 README.md):
```
This extension does not collect, store, or transmit any personal data or user information.

- All processing happens locally in your browser
- No data is sent to external servers
- No analytics or tracking tools are used
- No user data is stored or logged
- The extension only reads and modifies the visual layout of supported chat websites

Last updated: 2026-02-15
```

## 远程代码声明

```
Remote Code: NO

This extension does not use any remote code. All functionality is implemented in local JavaScript files included in the extension package. No external scripts, libraries, or resources are loaded at runtime.
```

## 截图建议

建议准备以下截图（1280x800 或 640x400）：

1. **主功能展示**: 显示侧边栏和对话内容
2. **可调整大小**: 展示拖动调整侧边栏宽度
3. **折叠状态**: 显示浮动展开按钮
4. **深色模式**: 展示深色主题下的效果
5. **多站点支持**: 分别展示在 ChatGPT 和 DeepSeek 上的效果

## 推广图片 (Promotional Images)

需要准备：
- Small tile: 440x280
- Large tile: 920x680 (可选)
- Marquee: 1400x560 (可选)

## 提交检查清单

- [ ] manifest.json 版本号正确
- [ ] 已移除不必要的权限
- [ ] 所有图标文件存在 (16x16, 48x48, 128x128)
- [ ] 准备好截图
- [ ] 隐私政策 URL 可访问
- [ ] 打包文件 (chat-line-v1.0.zip) 已生成
- [ ] 测试扩展在目标网站上正常工作

## 提交步骤

1. 访问 https://chrome.google.com/webstore/devconsole
2. 点击 "New Item"
3. 上传 `chat-line-v1.0.zip`
4. 填写商店列表信息（使用本文档中的内容）
5. 上传截图和图标
6. 填写隐私政策 URL
7. 提交审核

## 注意事项

- 首次提交需要支付 $5 开发者注册费
- 审核通常需要 1-3 个工作日
- 确保所有信息准确无误，避免被拒绝
- 保持扩展功能与描述一致
