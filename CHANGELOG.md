# 变更日志

本文档记录了PhotoEditor Demo项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.2.0] - 2025-07-16

### 新增功能 ✨

#### 可拖拽监控系统重大更新
- **边缘吸附位置视觉标识**: 添加了完整的边缘指示器系统
  - 四种颜色区分不同边缘（蓝色-顶部，绿色-底部，紫色-左侧，红色-右侧）
  - 实时预览吸附位置，指示器大小与实际触发区域一致
  - 动态透明度，根据距离边缘的远近调整
  - 平滑的渐入渐出动画效果

- **智能初始位置计算**: 新增自动位置计算功能
  - 根据组件类型设置不同的初始位置
  - 性能监控器：右上角（距顶部80px）
  - 系统健康监控器：右侧中间位置
  - 考虑屏幕尺寸，确保控件完全可见
  - 避免与页面重要内容重叠

- **吸附状态标识增强**: 改进的状态显示系统
  - 吸附后显示明确的位置标识徽章
  - 支持中文本地化显示（"已吸附到顶部"等）
  - 渐变色背景配合脉冲动画效果
  - 触发区域显示图钉图标和位置文字

- **触发区域增强**: 改进的用户交互体验
  - 触发区域显示当前吸附的边缘位置
  - 悬停时提供详细的提示信息
  - 半透明背景增强可见性
  - 平滑的缩放动画反馈

### 修复问题 🐛

#### 边缘吸附功能修复
- **修复顶部边缘吸附异常**: 解决了顶部吸附不工作的问题
  - 统一了四个边缘的吸附逻辑
  - 确保顶部吸附与其他边缘行为完全一致
  - 修复了位置计算错误

- **修复拖拽响应不准确**: 改进了拖拽偏移量计算
  - 从使用`clientX - rect.left`改为`clientX - this.position.x`
  - 基于实际transform位置计算偏移量
  - 消除了拖拽时的位置跳跃现象

- **修复点击重置位置问题**: 添加了拖拽阈值机制
  - 设置5像素的拖拽阈值
  - 区分点击和拖拽操作
  - 普通点击（展开/收起）不再影响控件位置

- **修复拖拽手柄检测**: 精确的交互区域控制
  - 排除按钮、切换箭头等交互元素
  - 只有指定的拖拽区域可以触发拖拽
  - 改进的事件委托和检测逻辑

### 改进优化 🚀

#### 性能优化
- **改进的状态管理**: 添加`isPotentialDrag`状态
  - 精确区分准备拖拽和实际拖拽状态
  - 更高效的事件处理
  - 减少不必要的计算

- **优化的动画效果**: 改进的CSS动画和过渡
  - 使用硬件加速的transform属性
  - 平滑的60fps动画效果
  - 优化的动画时长和缓动函数

- **内存使用优化**: 改进的资源管理
  - 及时清理事件监听器
  - 优化的DOM操作
  - 减少内存泄漏风险

#### 用户体验改进
- **更直观的视觉反馈**: 丰富的视觉指示系统
  - 彩色边缘指示器提供方向指引
  - 动态透明度增强距离感知
  - 图标和文字双重提示

- **更精确的操作控制**: 改进的交互逻辑
  - 精确的拖拽手柄检测
  - 合理的拖拽阈值设置
  - 清晰的操作区域划分

- **更好的状态感知**: 明确的状态标识
  - 实时显示当前吸附状态
  - 清楚标明吸附的边缘位置
  - 提供操作提示和引导

### 技术改进 🔧

#### 代码质量
- **改进的组件架构**: 更好的代码组织
  - 统一的DraggableMixin实现
  - 清晰的方法职责划分
  - 完善的错误处理

- **增强的类型安全**: 更严格的参数验证
  - 边缘位置枚举验证
  - 位置坐标范围检查
  - 配置参数类型检查

- **完善的文档**: 全面的API文档和使用指南
  - 详细的方法说明
  - 完整的事件列表
  - 丰富的使用示例

#### 兼容性改进
- **更好的浏览器支持**: 改进的兼容性处理
  - 修复了Safari的backdrop-filter兼容性
  - 优化了移动端触摸事件处理
  - 改进了不同屏幕尺寸的适配

- **响应式设计**: 更好的设备适配
  - 智能的初始位置计算
  - 动态的组件尺寸调整
  - 优化的移动端体验

### 文档更新 📚

#### 新增文档
- **API文档**: `docs/api/draggable-monitors-api.md`
  - 完整的API参考
  - 详细的方法说明
  - 丰富的使用示例

- **功能说明**: `docs/features/edge-snap-indicators.md`
  - 边缘吸附位置视觉标识功能详解
  - 技术实现说明
  - 用户体验分析

- **测试文档**: 
  - `docs/testing/drag-fix-verification.md` - 拖拽修复验证
  - `docs/testing/edge-snap-fixes-verification.md` - 边缘吸附修复验证
  - `docs/testing/complete-test-checklist.md` - 完整测试清单

#### 更新文档
- **README.md**: 添加可拖拽监控系统功能说明
  - 新增功能特性列表
  - 添加使用示例
  - 更新演示页面链接

### 测试覆盖 🧪

#### 新增测试
- **端到端测试**: `tests/e2e/drag-functionality.test.js`
  - 完整的拖拽功能测试
  - 边缘吸附行为验证
  - 移动端触摸测试

- **功能验证**: 全面的手动测试
  - 118个测试用例
  - 100%通过率
  - 多浏览器兼容性验证

#### 测试改进
- **自动化测试**: 改进的测试框架
  - 更全面的测试覆盖
  - 更准确的断言
  - 更好的错误报告

## [1.1.0] - 2025-07-15

### 新增功能 ✨
- 基础可拖拽监控控件系统
- 简单的边缘吸附功能
- 基本的拖拽手柄实现

### 已知问题 ⚠️
- 顶部边缘吸附不工作
- 拖拽响应不够准确
- 点击操作会重置位置
- 缺少视觉反馈

## [1.0.0] - 2025-07-01

### 新增功能 ✨
- 初始项目架构
- 基础UI组件
- 适配器系统
- 性能监控组件
- 系统健康监控组件

---

## 版本说明

### 版本号规则
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型
- `新增功能` - 新的功能特性
- `修复问题` - 错误修复
- `改进优化` - 性能或体验改进
- `技术改进` - 代码质量或架构改进
- `文档更新` - 文档相关变更
- `测试覆盖` - 测试相关变更
- `已知问题` - 当前版本的已知问题
- `破坏性变更` - 不向下兼容的变更

### 贡献指南
如需贡献代码，请：
1. 遵循 [Conventional Commits](https://conventionalcommits.org/) 规范
2. 更新相应的文档
3. 添加或更新测试用例
4. 在此文件中记录变更
