# PhotoEditor Demo 测试文档

## 测试概述

本项目使用 Jest 作为测试框架，为核心适配器和状态管理系统提供全面的单元测试覆盖。

## 测试结构

```
tests/
├── unit/                    # 单元测试
│   ├── adapters/           # 适配器测试
│   │   ├── BaseImageEditorAdapter.test.js
│   │   ├── FabricAdapter.test.js
│   │   ├── KonvaAdapter.test.js
│   │   └── AdapterManager.test.js
│   ├── state/              # 状态管理测试
│   │   ├── StateManager.test.js
│   │   └── HistoryManager.test.js
│   └── example.test.js     # 示例测试
├── setup.js                # 测试环境设置
└── README.md               # 本文件
```

## 运行测试

### 基础命令

```bash
# 运行所有测试
npm run test:unit

# 监视模式运行测试
npm run test:unit:watch

# 生成覆盖率报告
npm run test:unit:coverage

# CI 环境运行测试
npm run test:unit:ci
```

### 运行特定测试

```bash
# 运行适配器相关测试
npm run test:unit -- adapters

# 运行状态管理相关测试
npm run test:unit -- state

# 运行特定测试文件
npm run test:unit -- BaseImageEditorAdapter.test.js
```

## 测试覆盖范围

### 适配器系统测试

#### BaseImageEditorAdapter
- ✅ 初始化和销毁
- ✅ 图像操作（加载、调整大小、裁剪、旋转、翻转）
- ✅ 滤镜和调整（亮度、对比度、滤镜应用/移除）
- ✅ 变换操作（缩放、位置设置）
- ✅ 选择操作
- ✅ 状态管理
- ✅ 导出功能
- ✅ 事件系统
- ✅ 性能指标
- ✅ 错误处理

#### FabricAdapter
- ✅ Fabric.js 特定功能
- ✅ Canvas 操作
- ✅ 图像滤镜系统
- ✅ 对象管理
- ✅ 事件处理
- ✅ 性能优化

#### AdapterManager
- ✅ 适配器创建和管理
- ✅ 活动适配器切换
- ✅ 缓存管理
- ✅ 生命周期管理
- ✅ 事件系统
- ✅ 统计信息

### 状态管理系统测试

#### StateManager
- ✅ 状态创建和更新
- ✅ 状态查询和删除
- ✅ 状态序列化/反序列化
- ✅ 状态比较
- ✅ 事件系统
- ✅ 状态限制管理

## 测试配置

### Jest 配置 (jest.config.js)
- 测试环境：jsdom
- 覆盖率阈值：70%
- 模块映射：支持 @ 别名
- 转换配置：支持 Vue 文件和 ES6+

### 测试设置 (tests/setup.js)
- Canvas API Mock
- 图像处理 API Mock
- 存储 API Mock
- 全局对象 Mock
- 测试工具函数

## Mock 策略

### 第三方库 Mock
- **Fabric.js**: 完整的 Canvas 和滤镜 API Mock
- **Konva.js**: 基础渲染和事件 Mock
- **浏览器 API**: Canvas、Image、FileReader 等

### 测试数据
- 模拟图像数据
- 模拟 Canvas 元素
- 模拟文件对象
- 模拟事件对象

## 覆盖率目标

| 组件类型 | 目标覆盖率 | 当前状态 |
|---------|-----------|----------|
| 适配器系统 | 80%+ | ✅ 已实现 |
| 状态管理 | 85%+ | ✅ 已实现 |
| 工具函数 | 90%+ | 🔄 进行中 |
| UI 组件 | 70%+ | ⏳ 待实现 |

## 最佳实践

### 测试编写原则
1. **单一职责**: 每个测试只验证一个功能点
2. **独立性**: 测试之间不应相互依赖
3. **可读性**: 使用描述性的测试名称
4. **完整性**: 覆盖正常流程和异常情况

### 命名规范
- 测试文件：`*.test.js`
- 测试套件：使用组件/模块名称
- 测试用例：使用 "应该..." 的描述格式

### Mock 使用指南
1. 优先使用 Jest 内置 Mock 功能
2. 为复杂的第三方库创建专门的 Mock
3. 保持 Mock 的简单性和一致性
4. 在测试间正确清理 Mock 状态

## 持续集成

### CI 配置
- 自动运行测试套件
- 生成覆盖率报告
- 覆盖率阈值检查
- 测试结果通知

### 质量门禁
- 所有测试必须通过
- 覆盖率不得低于设定阈值
- 不允许跳过测试（除非有充分理由）

## 故障排除

### 常见问题

#### 1. Canvas API 错误
```javascript
// 解决方案：确保在 setup.js 中正确 Mock Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({...}));
```

#### 2. 异步测试超时
```javascript
// 解决方案：增加超时时间或使用 async/await
test('异步操作', async () => {
  await expect(asyncFunction()).resolves.toBe(expected);
}, 10000); // 10秒超时
```

#### 3. Mock 不生效
```javascript
// 解决方案：在 beforeEach 中重置 Mock
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 扩展测试

### 添加新测试
1. 在相应目录创建 `.test.js` 文件
2. 遵循现有的测试结构和命名规范
3. 添加必要的 Mock 和设置
4. 更新覆盖率目标

### 集成测试
未来可以考虑添加：
- 端到端测试 (E2E)
- 视觉回归测试
- 性能测试
- 兼容性测试

## 参考资源

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [Vue Test Utils](https://vue-test-utils.vuejs.org/)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
