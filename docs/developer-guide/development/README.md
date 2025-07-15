# 开发指南

本目录包含了 PhotoEditor Demo 项目的开发相关文档，帮助开发者快速上手项目开发。

## 📋 目录

- [开发环境设置](setup.md) - 开发环境配置指南
- [贡献指南](contributing.md) - 如何参与项目开发
- [开发路线图](roadmap.md) - 项目发展规划

## 🚀 快速开始

### 环境要求

- **Node.js**: 14.0 或更高版本
- **npm**: 6.0 或更高版本
- **Git**: 用于版本控制
- **现代浏览器**: 用于测试

### 获取代码

```bash
# 克隆仓库
git clone https://github.com/LuoLeYan/photoEditorDemo.git
cd photoEditorDemo

# 安装依赖
npm install

# 启动开发服务器
npm run serve
```

## 🏗️ 项目结构

```
src/
├── adapters/           # 图像编辑适配器
│   ├── ImageAdapter.js
│   ├── KonvaAdapter.js
│   ├── FabricAdapter.js
│   └── TUIAdapter.js
├── components/
│   └── ui/            # UI组件
├── views/             # 页面组件
├── utils/             # 工具函数
├── router/            # 路由配置
└── store/             # 状态管理
```

## 🛠️ 开发工作流

### 1. 功能开发

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发功能
# ... 编写代码

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature
```

### 2. 代码规范

项目使用以下代码规范：

- **ESLint**: JavaScript代码检查
- **Prettier**: 代码格式化
- **Vue Style Guide**: Vue.js代码规范

```bash
# 运行代码检查
npm run lint

# 自动修复代码格式
npm run lint:fix
```

### 3. 测试

```bash
# 运行单元测试
npm run test:unit

# 运行端到端测试
npm run test:e2e

# 生成测试覆盖率报告
npm run test:coverage
```

## 🔧 开发工具

### 推荐的IDE和扩展

#### Visual Studio Code
- **Vue Language Features (Volar)**: Vue.js支持
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **GitLens**: Git增强
- **Auto Rename Tag**: 标签自动重命名

#### WebStorm
- 内置Vue.js支持
- 强大的调试功能
- 集成的版本控制

### 浏览器开发工具

- **Vue DevTools**: Vue.js调试
- **Chrome DevTools**: 性能分析
- **Firefox Developer Tools**: 网络分析

## 📚 技术栈

### 核心技术

- **Vue.js 2.6+**: 前端框架
- **Vue Router**: 路由管理
- **Vuex**: 状态管理（可选）
- **Webpack**: 构建工具

### 图像编辑库

- **Konva.js**: 高性能2D图形
- **Fabric.js**: Canvas操作
- **TUI Image Editor**: 完整编辑器
- **Cropper.js**: 图片裁剪
- **Jimp**: 图片处理

### 开发工具

- **Vue CLI**: 项目脚手架
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Jest**: 单元测试
- **Cypress**: 端到端测试

## 🎯 开发最佳实践

### 1. 组件开发

```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script>
export default {
  name: 'ComponentName',
  props: {
    // 定义属性
  },
  data() {
    return {
      // 组件数据
    }
  },
  methods: {
    // 组件方法
  }
}
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
```

### 2. 适配器开发

```javascript
class NewAdapter extends BaseImageEditorAdapter {
  constructor() {
    super()
    this.library = null
  }

  async initialize(container, options) {
    // 初始化逻辑
  }

  async loadImage(source) {
    // 图片加载逻辑
  }

  // 实现其他必需方法
}
```

### 3. 错误处理

```javascript
try {
  await adapter.loadImage(imageSrc)
} catch (error) {
  console.error('Failed to load image:', error)
  this.$emit('error', error)
}
```

## 🧪 测试策略

### 单元测试

```javascript
import { mount } from '@vue/test-utils'
import Component from '@/components/Component.vue'

describe('Component', () => {
  test('should render correctly', () => {
    const wrapper = mount(Component)
    expect(wrapper.exists()).toBe(true)
  })
})
```

### 集成测试

```javascript
describe('Adapter Integration', () => {
  test('should switch adapters seamlessly', async () => {
    // 测试适配器切换
  })
})
```

### 端到端测试

```javascript
describe('Image Editor E2E', () => {
  it('should load and edit image', () => {
    cy.visit('/')
    cy.get('[data-cy=upload-button]').click()
    // ... 测试步骤
  })
})
```

## 📊 性能优化

### 1. 代码分割

```javascript
// 路由懒加载
const Editor = () => import('@/views/Editor.vue')

// 组件懒加载
const HeavyComponent = () => import('@/components/HeavyComponent.vue')
```

### 2. 资源优化

```javascript
// webpack配置
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
}
```

### 3. 内存管理

```javascript
// 组件销毁时清理资源
beforeDestroy() {
  if (this.adapter) {
    this.adapter.destroy()
  }
}
```

## 🔄 持续集成

### GitHub Actions

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '16'
    - run: npm ci
    - run: npm run test
    - run: npm run build
```

## 📞 开发支持

### 获取帮助

- 查看 [开发环境设置](setup.md) 了解详细配置
- 查看 [贡献指南](contributing.md) 了解贡献流程
- 在 GitHub 上提交 Issue 或 Discussion

### 社区资源

- **GitHub Repository**: 源代码和问题跟踪
- **Documentation**: 完整的项目文档
- **Examples**: 示例代码和最佳实践

---

*准备开始开发？从 [开发环境设置](setup.md) 开始吧！*
