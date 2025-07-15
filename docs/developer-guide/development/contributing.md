# 贡献指南

欢迎为 PhotoEditor Demo 项目做出贡献！本指南将帮助您了解如何参与项目开发。

## 🎯 贡献方式

### 代码贡献
- 修复 Bug
- 添加新功能
- 性能优化
- 代码重构

### 文档贡献
- 改进文档内容
- 添加使用示例
- 翻译文档
- 修正错误

### 测试贡献
- 编写单元测试
- 添加集成测试
- 性能测试
- 兼容性测试

### 社区贡献
- 回答问题
- 分享经验
- 推广项目
- 反馈建议

## 🚀 开始贡献

### 1. 准备工作

#### Fork 项目
1. 访问 [项目主页](https://github.com/LuoLeYan/photoEditorDemo)
2. 点击右上角的 "Fork" 按钮
3. 将项目 Fork 到您的 GitHub 账户

#### 克隆项目
```bash
# 克隆您 Fork 的项目
git clone https://github.com/YourUsername/photoEditorDemo.git
cd photoEditorDemo

# 添加上游仓库
git remote add upstream https://github.com/LuoLeYan/photoEditorDemo.git

# 验证远程仓库
git remote -v
```

#### 设置开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run serve
```

### 2. 开发流程

#### 创建功能分支
```bash
# 同步最新代码
git checkout main
git pull upstream main

# 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/issue-number
```

#### 分支命名规范
- `feature/功能名称` - 新功能开发
- `fix/问题描述` - Bug 修复
- `docs/文档类型` - 文档更新
- `refactor/重构内容` - 代码重构
- `test/测试内容` - 测试相关
- `chore/维护内容` - 维护任务

#### 开发规范

**代码风格**:
```bash
# 运行代码检查
npm run lint

# 自动修复格式问题
npm run lint:fix
```

**提交规范**:
```bash
# 提交格式
git commit -m "type(scope): description"

# 示例
git commit -m "feat(adapter): add konva rotation support"
git commit -m "fix(ui): resolve preview window sizing issue"
git commit -m "docs(api): update component documentation"
```

**提交类型**:
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 代码重构
- `test` - 测试相关
- `chore` - 构建或辅助工具变动

### 3. 代码质量

#### 代码检查
```bash
# ESLint 检查
npm run lint

# 类型检查 (如果使用 TypeScript)
npm run type-check

# 运行所有检查
npm run check-all
```

#### 测试要求
```bash
# 运行单元测试
npm run test:unit

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率
npm run test:coverage
```

**测试覆盖率要求**:
- 新功能代码覆盖率 > 80%
- 关键功能代码覆盖率 > 90%
- 整体项目覆盖率不能下降

#### 性能要求
- 新功能不能显著影响现有性能
- 大型功能需要提供性能测试报告
- 内存使用需要在合理范围内

## 📝 Pull Request 流程

### 1. 提交 PR

#### 推送代码
```bash
# 推送到您的 Fork
git push origin feature/your-feature-name
```

#### 创建 Pull Request
1. 访问您的 Fork 页面
2. 点击 "Compare & pull request"
3. 填写 PR 模板
4. 提交 Pull Request

### 2. PR 模板

```markdown
## 📋 变更描述
简要描述本次变更的内容和目的。

## 🎯 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 性能优化
- [ ] 代码重构
- [ ] 文档更新
- [ ] 测试改进

## 🧪 测试
- [ ] 已添加单元测试
- [ ] 已添加集成测试
- [ ] 已进行手动测试
- [ ] 测试覆盖率满足要求

## 📸 截图/演示
如果涉及 UI 变更，请提供截图或 GIF 演示。

## 🔗 相关 Issue
关闭 #issue_number

## ✅ 检查清单
- [ ] 代码遵循项目规范
- [ ] 已运行 lint 检查
- [ ] 已运行测试并通过
- [ ] 已更新相关文档
- [ ] 已测试在不同浏览器中的兼容性
```

### 3. 代码审查

#### 审查标准
- **功能正确性** - 功能是否按预期工作
- **代码质量** - 代码是否清晰、可维护
- **性能影响** - 是否影响现有性能
- **安全性** - 是否存在安全隐患
- **兼容性** - 是否影响浏览器兼容性

#### 响应审查
- 及时回应审查意见
- 根据建议修改代码
- 解释设计决策
- 保持友好的沟通

### 4. 合并要求

#### 合并条件
- [ ] 所有 CI 检查通过
- [ ] 至少一个维护者审查通过
- [ ] 解决所有审查意见
- [ ] 测试覆盖率满足要求
- [ ] 文档已更新

#### 合并方式
- **Squash and merge** - 小功能和 Bug 修复
- **Merge commit** - 大功能和重要变更
- **Rebase and merge** - 保持线性历史

## 🐛 Bug 报告

### 报告模板

```markdown
## 🐛 Bug 描述
清晰简洁地描述遇到的问题。

## 🔄 重现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 🎯 期望行为
描述您期望发生的行为。

## 📸 截图
如果适用，添加截图来帮助解释问题。

## 🖥️ 环境信息
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91]
- 版本: [例如 v1.0.0]

## 📝 附加信息
添加任何其他相关的上下文信息。
```

## 💡 功能请求

### 请求模板

```markdown
## 🚀 功能描述
清晰简洁地描述您想要的功能。

## 🎯 问题背景
描述这个功能要解决的问题。

## 💭 解决方案
描述您希望的解决方案。

## 🔄 替代方案
描述您考虑过的其他替代方案。

## 📝 附加信息
添加任何其他相关的上下文或截图。
```

## 🏆 贡献者认可

### 贡献类型
- **代码贡献者** - 提交代码的开发者
- **文档贡献者** - 改进文档的贡献者
- **测试贡献者** - 编写测试的贡献者
- **设计贡献者** - 提供设计建议的贡献者
- **社区贡献者** - 活跃在社区的贡献者

### 认可方式
- 在 README 中列出贡献者
- 在 Release Notes 中感谢贡献者
- 颁发贡献者徽章
- 邀请加入核心团队

## 📞 获取帮助

### 沟通渠道
- **GitHub Issues** - 报告问题和功能请求
- **GitHub Discussions** - 一般讨论和问答
- **邮件** - 私人或敏感问题

### 响应时间
- **Bug 报告** - 24-48 小时内响应
- **功能请求** - 1 周内响应
- **Pull Request** - 3-5 个工作日内审查

### 行为准则
- 保持友好和尊重
- 欢迎新手贡献者
- 提供建设性反馈
- 遵循开源社区最佳实践

## 📚 学习资源

### 技术文档
- [开发环境设置](setup.md)
- [项目架构](../architecture/README.md)
- [API 参考](../api-reference/README.md)

### 外部资源
- [Git 工作流程](https://guides.github.com/introduction/flow/)
- [如何写好 Commit Message](https://chris.beams.io/posts/git-commit/)
- [开源贡献指南](https://opensource.guide/how-to-contribute/)

---

*感谢您对 PhotoEditor Demo 项目的贡献！每一个贡献都让项目变得更好。*
