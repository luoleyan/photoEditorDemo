# PhotoEditor Demo

A comprehensive Vue.js image editor demonstration showcasing professional image editing components with enterprise-grade multi-library adapter architecture, advanced performance optimization, mobile support, and intelligent error handling.

## 📚 文档导航

本项目的文档已重新组织，请访问 **[文档中心](docs/README.md)** 获取完整的文档导航。

### 🚀 快速链接

- **[快速开始](docs/user-guide/getting-started.md)** - 安装和基本使用
- **[使用指南](docs/user-guide/usage-guide.md)** - 详细功能说明
- **[开发者指南](docs/developer-guide/README.md)** - 技术文档和API参考
- **[部署指南](docs/deployment/README.md)** - 项目部署相关
- **[故障排除](docs/troubleshooting/README.md)** - 问题解决方案

## 🌟 核心特性

### 🏗️ 企业级架构
- **多库适配器系统**: 无缝集成 Konva.js、Fabric.js 和 TUI Image Editor
- **统一API层**: 跨不同渲染引擎的一致接口
- **智能性能优化**: 基于操作类型的自动库选择和内存管理
- **模块化设计**: 可插拔组件，最大化灵活性
- **完整测试覆盖**: Jest测试框架，70%+代码覆盖率

### 📱 移动端支持
- **响应式设计**: 完美适配移动设备和平板
- **触摸手势**: 原生触摸操作支持（缩放、平移、旋转）
- **移动端工具栏**: 专为触摸优化的界面
- **性能优化**: 移动设备专用的性能配置
- **自适应布局**: 智能布局调整和组件重排

### 🛡️ 智能错误处理
- **统一错误管理**: 全局错误捕获和分类处理
- **自动错误恢复**: 智能错误恢复策略和系统稳定性保障
- **用户友好提示**: 技术错误转换为用户可理解的消息
- **系统健康监控**: 实时系统状态监控和性能指标
- **错误报告系统**: 完整的错误日志和分析功能

### ⚡ 性能优化
- **内存管理**: 智能内存监控、清理和泄漏防护
- **性能监控**: 实时性能指标监控和优化建议
- **资源优化**: 图像压缩、缓存管理和懒加载
- **渲染优化**: 高效的Canvas渲染和更新策略
- **移动端优化**: 专门的移动设备性能配置

### 🎯 可拖拽监控系统
- **智能边缘吸附**: 四边缘统一吸附行为，自动隐藏到边缘外
- **边缘位置视觉标识**: 彩色指示器实时预览吸附位置，支持四个方向
- **智能初始位置**: 根据组件类型和屏幕尺寸自动计算最佳位置
- **吸附状态标识**: 明确显示当前吸附边缘，提供位置提示
- **触发区域增强**: 吸附后显示触发区域，支持点击展开和位置提示

### 🎨 高级编辑功能
- **ImagePreview**: 高级图像查看，支持缩放、平移、缩略图导航和对比模式
- **HistoryPanel**: 可视化撤销/重做系统，操作缩略图和搜索功能
- **FilterPanel**: 实时滤镜预览，预设和自定义组合
- **LayerPanel**: 完整图层管理，拖拽重排、混合模式和透明度控制
- **CropTool**: 灵活裁剪，宽高比约束、网格线和参考指南
- **TextTool**: 富文本编辑，字体、样式、效果和变换

## 🚀 快速开始

### 📋 系统要求
- **Node.js**: 14.x 或更高版本
- **包管理器**: yarn (推荐) 或 npm
- **浏览器**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

### 📦 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/LuoLeYan/photoEditorDemo.git
cd photoEditorDemo

# 2. 安装依赖 (推荐使用 yarn)
yarn install
# 或使用 npm
npm install

# 3. 启动开发服务器
yarn serve
# 或使用 npm
npm run serve

# 4. 访问应用
# 打开浏览器访问 http://localhost:8080
```

### 🏗️ 构建和部署

```bash
# 生产环境构建
yarn build

# 运行测试
yarn test:unit

# 测试覆盖率报告
yarn test:unit:coverage

# 监视模式运行测试
yarn test:unit:watch
```

### 🧪 测试命令

```bash
# 运行所有单元测试
yarn test:unit

# 生成覆盖率报告
yarn test:unit:coverage

# 监视模式（开发时使用）
yarn test:unit:watch

# CI环境测试
yarn test:unit:ci
```

## 📖 使用指南

### 🔧 基础配置

```javascript
import { AdapterManager } from '@/utils/AdapterManager'
import { BaseImageEditorAdapter } from '@/components/adapters/BaseImageEditorAdapter'
import UnifiedEditorDemo from '@/views/UnifiedEditorDemo.vue'

// 初始化适配器管理器
const adapterManager = new AdapterManager({
  enablePerformanceMonitoring: true,
  enableErrorHandling: true,
  mobileOptimization: true
})

// 创建适配器实例
const adapter = await adapterManager.getAdapter('fabric') // 或 'konva'

// 在组件中使用
export default {
  components: { UnifiedEditorDemo },
  data() {
    return {
      currentAdapter: adapter,
      imageSrc: 'path/to/image.jpg'
    }
  }
}
```

### 🎨 组件示例

#### 统一编辑器（推荐）
```vue
<template>
  <unified-editor-demo
    :initial-adapter="'fabric'"
    :enable-mobile-support="true"
    :enable-performance-monitoring="true"
    @adapter-switched="handleAdapterSwitch"
    @image-processed="handleImageProcessed"
  />
</template>
```

#### 移动端工具栏
```vue
<template>
  <mobile-toolbar
    :current-adapter="currentAdapter"
    :has-image="hasImage"
    :is-mobile="isMobile"
    @mobile-action="handleMobileAction"
    @tool-select="handleToolSelect"
  />
</template>
```

#### 性能监控
```vue
<template>
  <performance-monitor
    :adapter="currentAdapter"
    :show-details="showPerformanceDetails"
    @memory-warning="handleMemoryWarning"
    @performance-issue="handlePerformanceIssue"
  />
</template>
```

#### 错误处理通知
```vue
<template>
  <error-notification
    @error-action="handleErrorAction"
    @info-message="handleInfoMessage"
    @report-error="handleReportError"
  />
</template>
```

#### 系统健康监控
```vue
<template>
  <system-health-monitor
    @health-updated="handleHealthUpdated"
    @action-request="handleSystemAction"
    @recommendation-executed="handleRecommendationExecuted"
  />
</template>
```

#### 可拖拽监控系统
```vue
<template>
  <div>
    <!-- 性能监控器 - 支持拖拽和边缘吸附 -->
    <performance-monitor
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @snapped="handleSnapped"
      @edge-indicator-show="handleEdgeIndicatorShow"
    />

    <!-- 系统健康监控器 - 智能初始位置 -->
    <system-health-monitor
      @health-updated="handleHealthUpdated"
      @edge-indicator-hide="handleEdgeIndicatorHide"
    />
  </div>
</template>

<script>
export default {
  methods: {
    handleDragStart(monitorType) {
      console.log(`${monitorType} 监控器开始拖拽`)
    },
    handleSnapped(monitorType, { edge }) {
      console.log(`${monitorType} 监控器吸附到${edge}边缘`)
    },
    handleEdgeIndicatorShow(monitorType, { edge, distance }) {
      console.log(`显示${edge}边缘指示器，距离: ${distance}px`)
    }
  }
}
</script>
```

## 🏗️ 系统架构

### 企业级适配器架构
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Mobile UI   │ │ Desktop UI  │ │ Error Notifications │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Unified API Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ State Mgmt  │ │ Event Bus   │ │ Performance Monitor │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                  Adapter System                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Fabric.js   │ │ Konva.js    │ │ Error Recovery      │   │
│  │ Adapter     │ │ Adapter     │ │ Manager             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   Utility Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Memory Mgmt │ │ Mobile      │ │ Performance         │   │
│  │             │ │ Adapter     │ │ Optimizer           │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件层次
- **UI组件层**: 用户界面元素和交互组件
- **统一API层**: 跨适配器的一致接口和状态管理
- **适配器系统**: 库特定的实现和错误恢复
- **工具层**: 性能优化、内存管理和移动端支持

## 📱 演示页面

访问以下路由探索不同的组件功能：

- `/unified-editor` - **统一编辑器** (推荐) - 完整的图像编辑体验
- `/draggable-monitors` - **可拖拽监控系统** - 边缘吸附和视觉标识演示
- `/basic-components` - 基础UI组件和适配器
- `/advanced-components` - 高级编辑功能
- `/mid-priority-components` - 图层、裁剪和文本工具
- `/low-priority-components` - 形状、画笔和导出工具

## 🛠️ 开发指南

### 📁 项目结构
```
src/
├── components/
│   ├── adapters/           # 适配器实现
│   │   ├── BaseImageEditorAdapter.js
│   │   ├── FabricAdapter.js
│   │   ├── KonvaAdapter.js
│   │   └── AdapterFactory.js
│   ├── state/              # 状态管理
│   │   ├── StateManager.js
│   │   └── HistoryManager.js
│   └── ui/                 # UI组件
│       ├── ErrorNotification.vue
│       ├── MobileToolbar.vue
│       ├── PerformanceMonitor.vue
│       └── SystemHealthMonitor.vue
├── utils/                  # 工具类
│   ├── ErrorHandler.js
│   ├── ErrorRecoveryManager.js
│   ├── MemoryManager.js
│   ├── MobileAdapter.js
│   └── PerformanceOptimizer.js
├── styles/                 # 样式文件
│   └── mobile.css
├── views/                  # 页面组件
│   └── UnifiedEditorDemo.vue
└── tests/                  # 测试文件
    ├── unit/
    └── setup.js
```

### 🔧 技术栈

#### 核心框架
- **Vue.js 2.6.14** - 渐进式JavaScript框架
- **Vue Router 3.5.1** - 官方路由管理器
- **Vuex 3.6.2** - 状态管理模式

#### 图像处理库
- **Fabric.js 5.3.0** - 交互式Canvas库
- **Konva.js 9.2.0** - 2D Canvas库
- **Jimp 0.22.10** - 纯JavaScript图像处理
- **CropperJS 1.6.1** - 图像裁剪库

#### 测试框架
- **Jest 27.5.1** - JavaScript测试框架
- **@vue/test-utils 1.3.6** - Vue组件测试工具
- **Jest Environment JSDOM 27.5.1** - DOM测试环境

#### 开发工具
- **Vue CLI 5.0** - Vue.js开发工具链
- **Babel** - JavaScript编译器
- **Webpack** - 模块打包器

### 🚀 添加新组件

1. **创建组件文件**
   ```bash
   # 在 src/components/ui/ 目录下创建新组件
   touch src/components/ui/NewComponent.vue
   ```

2. **遵循Vue 2语法和命名规范**
   ```vue
   <template>
     <div class="new-component">
       <!-- 组件内容 -->
     </div>
   </template>

   <script>
   export default {
     name: 'NewComponent',
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
   ```

3. **实现适配器集成**
   ```javascript
   // 在组件中使用适配器
   methods: {
     async processWithAdapter(operation, params) {
       if (!this.currentAdapter) return;

       try {
         const result = await this.currentAdapter[operation](params);
         return result;
       } catch (error) {
         this.$emit('error', error);
       }
     }
   }
   ```

4. **添加到演示页面**
   ```javascript
   // 在相应的演示页面中导入和使用
   import NewComponent from '@/components/ui/NewComponent.vue'

   export default {
     components: {
       NewComponent
     }
   }
   ```

5. **编写测试**
   ```javascript
   // 在 tests/unit/ 目录下创建测试文件
   import { mount } from '@vue/test-utils'
   import NewComponent from '@/components/ui/NewComponent.vue'

   describe('NewComponent', () => {
     test('应该正确渲染', () => {
       const wrapper = mount(NewComponent)
       expect(wrapper.exists()).toBe(true)
     })
   })
   ```

6. **更新文档**
   - 更新README.md
   - 添加组件API文档
   - 更新使用示例

## 🎨 自定义配置

### 🎭 主题系统
组件支持多种主题配置：
- `default`: 标准外观
- `minimal`: 简洁设计
- `compact`: 紧凑布局
- `mobile`: 移动端优化

### 🎨 样式定制
```vue
<template>
  <unified-editor-demo
    variant="minimal"
    :theme="currentTheme"
    :custom-styles="customStyles"
    :mobile-optimized="true"
  />
</template>

<script>
export default {
  data() {
    return {
      currentTheme: 'default',
      customStyles: {
        primaryColor: '#007bff',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }
    }
  }
}
</script>
```

### 📱 移动端配置
```javascript
// 移动端特定配置
const mobileConfig = {
  touchSensitivity: 1.2,
  gestureThreshold: 10,
  compressionQuality: 0.8,
  maxImageSize: 2048,
  enableHapticFeedback: true
}
```

## 📋 API参考

### 🔧 BaseImageEditorAdapter
核心适配器基类，提供统一的图像编辑接口：

```javascript
// 基础操作
await adapter.initialize(container)
await adapter.loadImage(imageSource)
await adapter.destroy()

// 图像操作
await adapter.resize(width, height)
await adapter.crop(x, y, width, height)
await adapter.rotate(angle)
await adapter.flip(direction)

// 滤镜和调整
await adapter.applyFilter(filterType, params)
await adapter.adjustBrightness(value)
await adapter.adjustContrast(value)

// 状态管理
const state = await adapter.getState()
await adapter.setState(state)
await adapter.reset()

// 导出
const imageData = await adapter.exportImage(format, quality)
```

### 🛠️ 工具类API

#### ErrorHandler
```javascript
import { errorHandler } from '@/utils/ErrorHandler.js'

// 注册错误处理
errorHandler.onError('adapter', (errorInfo, recoveryResult) => {
  console.log('适配器错误:', errorInfo)
})

// 手动处理错误
errorHandler.handleError(error, context, category, severity)
```

#### MemoryManager
```javascript
import { memoryManager } from '@/utils/MemoryManager.js'

// 获取内存使用情况
const usage = memoryManager.getMemoryUsage()

// 执行内存清理
memoryManager.forceCleanup()

// 监听内存警告
memoryManager.addCleanupCallback(() => {
  console.log('内存清理完成')
})
```

#### MobileAdapter
```javascript
import { mobileAdapter } from '@/utils/MobileAdapter.js'

// 检测移动设备
const isMobile = mobileAdapter.isMobileDevice()

// 初始化移动端支持
mobileAdapter.initializeMobileSupport(container)

// 处理触摸事件
mobileAdapter.handleTouchGesture(gestureType, params)
```

### 🎛️ 组件属性

#### 通用属性
所有组件都支持以下属性：
- `variant`: 视觉样式变体 (`default` | `minimal` | `compact`)
- `disabled`: 禁用组件 (Boolean)
- `theme`: 颜色主题 (String)
- `customStyles`: 自定义CSS属性 (Object)
- `mobileOptimized`: 移动端优化 (Boolean)

#### UnifiedEditorDemo 特有属性
- `initialAdapter`: 初始适配器类型 (`'fabric'` | `'konva'`)
- `enablePerformanceMonitoring`: 启用性能监控 (Boolean)
- `enableErrorHandling`: 启用错误处理 (Boolean)
- `mobileConfig`: 移动端配置对象 (Object)

## 🧪 测试

### 🔬 测试覆盖率
项目包含完整的测试套件，覆盖率目标为70%+：

```bash
# 运行所有测试
yarn test:unit

# 查看覆盖率报告
yarn test:unit:coverage
open coverage/lcov-report/index.html
```

### 📊 测试结构
```
tests/
├── unit/
│   ├── adapters/           # 适配器测试
│   │   ├── BaseImageEditorAdapter.test.js
│   │   ├── FabricAdapter.test.js
│   │   └── AdapterManager.test.js
│   ├── state/              # 状态管理测试
│   │   └── StateManager.test.js
│   └── example.test.js     # 示例测试
├── setup.js                # 测试环境配置
└── README.md              # 测试文档
```

## 🤝 贡献指南

### 🚀 参与贡献

1. **Fork 仓库**
   ```bash
   # 在GitHub上Fork项目
   # 然后克隆你的Fork
   git clone https://github.com/YOUR_USERNAME/photoEditorDemo.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **开发和测试**
   ```bash
   # 安装依赖
   yarn install

   # 运行开发服务器
   yarn serve

   # 运行测试
   yarn test:unit
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m 'feat: add amazing feature'
   ```

5. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **创建Pull Request**
   - 在GitHub上创建PR
   - 描述你的更改
   - 等待代码审查

### 📝 提交规范
使用[Conventional Commits](https://conventionalcommits.org/)规范：

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式化
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**LuoLeYan**
- GitHub: [@LuoLeYan](https://github.com/LuoLeYan)
- 项目主页: [photoEditorDemo](https://github.com/LuoLeYan/photoEditorDemo)

## 🙏 致谢

### 核心依赖
- **[Vue.js](https://vuejs.org/)** - 渐进式JavaScript框架
- **[Fabric.js](http://fabricjs.com/)** - 交互式Canvas库
- **[Konva.js](https://konvajs.org/)** - 2D Canvas库
- **[Jimp](https://github.com/oliver-moran/jimp)** - 纯JavaScript图像处理

### 测试和工具
- **[Jest](https://jestjs.io/)** - JavaScript测试框架
- **[Vue Test Utils](https://vue-test-utils.vuejs.org/)** - Vue组件测试工具
- **[Vue CLI](https://cli.vuejs.org/)** - Vue.js开发工具链

## 📊 浏览器支持

| 浏览器 | 版本 | 状态 |
|--------|------|------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| Mobile Safari | iOS 12+ | ✅ 移动端优化 |
| Chrome Mobile | Android 7+ | ✅ 移动端优化 |

## ⚙️ 配置

### 🔧 Vue CLI配置
查看 [Vue CLI配置参考](https://cli.vuejs.org/config/) 了解构建自定义选项。

### 📱 移动端配置
```javascript
// vue.config.js
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/styles/mobile.css";`
      }
    }
  },
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  }
}
```

---

## 📖 完整文档

本 README 提供了项目的基本概览。要获取完整的文档，请访问：

### 📚 [文档中心](docs/README.md)
完整的文档导航和索引，包含所有详细信息。

### 👥 用户文档
- **[快速开始](docs/user-guide/getting-started.md)** - 项目安装和基本使用
- **[使用指南](docs/user-guide/usage-guide.md)** - 详细的功能使用说明
- **[浏览器兼容性](docs/user-guide/browser-compatibility.md)** - 支持的浏览器和版本

### 👨‍💻 开发者文档
- **[开发者指南](docs/developer-guide/README.md)** - 完整的开发者文档
- **[架构设计](docs/developer-guide/architecture/README.md)** - 项目架构和设计理念
- **[API参考](docs/developer-guide/api-reference/README.md)** - 详细的API文档

### 🚀 部署文档
- **[部署指南](docs/deployment/README.md)** - 项目部署相关文档
- **[GitHub设置](docs/deployment/github-setup.md)** - GitHub仓库设置和发布

### 🔧 故障排除
- **[故障排除](docs/troubleshooting/README.md)** - 问题解决和优化指南
- **[修复记录](docs/troubleshooting/bug-fixes/README.md)** - 历史问题修复记录

> 💡 **提示**: 如果您是第一次使用，建议从 [快速开始](docs/user-guide/getting-started.md) 开始。
