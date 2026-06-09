# 全局偏好

- 用户希望流程直接、低摩擦。除非受沙箱、安全策略、信息缺失或高风险/破坏性操作限制，否则不要反复询问确认。
- 当需要用户输入、确认或授权时，优先使用全局 `notifications` MCP 的 `send_notification` 工具弹出系统通知；如果当前会话未暴露该工具，则在对话中简短说明并请求确认。
- 所有内容必须使用中文，包括回复、AI 输出、代码注释、文档、Git 提交日志；除非规范要求其他语言。
- 每次回复前先检查输出语言是否符合本文件要求；即使工具输出、仓库上下文或错误日志是英文，解释、归纳和最终结论也必须使用中文。
- 代码文件需要包含中文注释，注释应服务于关键逻辑说明，并与思路文档中的实现逻辑保持一致。
- 最终回复需要同时输出：思路解释（可视化展示）、代码内容或关键代码摘录、代码文件保存路径。
- 代码应包含关键步骤输出；必要时输出错误日志，便于定位执行阶段和失败原因。
- 当用户指出错误时，需要将错误原因、修正方式和复用规则归纳为 skill 或更新现有 skill。
- 用户确认方案后，才可以编码；若用户直接给出明确执行命令，可视为对该具体动作的确认。

# 项目规则

- 这是浏览器扩展项目，修改 manifest、权限、注入脚本、内容脚本时，需要同时考虑 Chrome 和 Firefox 两套清单。
- Chrome 自定义包需要保持固定 `manifest.key`，避免扩展 ID 变化；当前 Chrome 扩展 ID 为 `nhhcjedbbojkomdalhjjbibjjidhmjmj`。
- 自定义插件名称为 `MyMarkdownViewer`，不要恢复成原始 `Markdown Viewer`。
- 根目录 `manifest.json` 用于本地加载 Chrome 版本，修改 `manifest.chrome.json` 后需要同步根目录 `manifest.json`。
- 打包 Chrome ZIP 后，需要按用户要求解压出可直接加载的目录；解压目录必须是扁平结构，所选目录根层要直接包含 `manifest.json`，不能要求用户再进入子目录。

# 权限处理复用规则

- 不要对 `chrome.permissions.remove` 传入 manifest 中的必需权限，例如 `host_permissions` 里的 `file:///*`。
- 清理权限前需要用 `chrome.runtime.getManifest().host_permissions` 过滤必需来源，只移除可选来源权限。
- 使用 `chrome.permissions.remove` 时应传入回调，并检查 `chrome.runtime.lastError`，避免出现 `Uncaught (in promise)`。
- 首次安装或存储为空时，必须验证权限清理逻辑不会误删必需权限。

# 打包注意事项

- 仓库原始 `build/package.sh chrome` 依赖 `zip` 命令，并且在 Windows + Node 24 环境下 `node-sass` 可能失败。
- 如果 `node-sass` 失败，可以用 `npm install --ignore-scripts` 安装 MDC 依赖，再用 Dart Sass 编译 `build/mdc/mdc.scss`，最后复制 `vendor/mdc.min.js` 和 `vendor/mdc.min.css`。
- Windows 环境可用 PowerShell 或 Python 校验 ZIP，确认包内根层 `manifest.json`、`content/plantuml.js`、`vendor/mdc.min.js`、`vendor/mdc.min.css` 存在且非空。
