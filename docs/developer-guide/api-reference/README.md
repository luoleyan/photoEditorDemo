# API参考

本目录包含了 PhotoEditor Demo 项目的完整API文档，为开发者提供详细的接口说明和使用示例。

## 📋 目录

- [组件API](components.md) - UI组件接口文档
- [适配器API](adapters.md) - 图像编辑适配器接口文档

## 🎯 API设计原则

### 1. 一致性
- 所有API遵循统一的命名规范
- 参数格式和返回值保持一致
- 错误处理方式统一

### 2. 易用性
- 提供清晰的方法名和参数名
- 合理的默认值设置
- 详细的文档和示例

### 3. 扩展性
- 支持可选参数和配置
- 预留扩展接口
- 向后兼容性保证

### 4. 类型安全
- 使用TypeScript接口定义
- 运行时类型检查
- 详细的类型文档

## 🏗️ API架构

### 分层结构

```
┌─────────────────────────────────────────┐
│              UI Components              │  Vue组件API
├─────────────────────────────────────────┤
│            Business Logic               │  业务逻辑API
├─────────────────────────────────────────┤
│            Unified Adapter              │  统一适配器API
├─────────────────────────────────────────┤
│          Library Adapters              │  库特定适配器API
└─────────────────────────────────────────┘
```

### 核心接口

#### 1. 组件接口
- **Props**: 组件属性定义
- **Events**: 组件事件定义
- **Methods**: 组件方法定义
- **Slots**: 插槽定义

#### 2. 适配器接口
- **BaseAdapter**: 基础适配器接口
- **ImageAdapter**: 图像处理接口
- **StateAdapter**: 状态管理接口
- **EventAdapter**: 事件处理接口

## 📚 快速参考

### 常用组件

| 组件名 | 用途 | 文档链接 |
|--------|------|----------|
| `ImagePreview` | 图像预览和导航 | [组件API](components.md#imagepreview) |
| `HistoryPanel` | 历史记录管理 | [组件API](components.md#historypanel) |
| `FilterPanel` | 滤镜应用 | [组件API](components.md#filterpanel) |
| `LayerPanel` | 图层管理 | [组件API](components.md#layerpanel) |
| `CropTool` | 图像裁剪 | [组件API](components.md#croptool) |

### 常用适配器

| 适配器名 | 用途 | 文档链接 |
|----------|------|----------|
| `KonvaAdapter` | Konva.js集成 | [适配器API](adapters.md#konvaadapter) |
| `FabricAdapter` | Fabric.js集成 | [适配器API](adapters.md#fabricadapter) |
| `CropperAdapter` | Cropper.js集成 | [适配器API](adapters.md#cropperadapter) |
| `TUIAdapter` | TUI Image Editor集成 | [适配器API](adapters.md#tuiadapter) |
| `JimpAdapter` | Jimp集成 | [适配器API](adapters.md#jimpadapter) |

## 🔧 使用示例

### 基本组件使用

```vue
<template>
  <div class="editor-container">
    <!-- 图像预览组件 -->
    <image-preview
      :image-src="imageSrc"
      :zoom-enabled="true"
      :pan-enabled="true"
      @zoom-change="handleZoomChange"
      @image-load="handleImageLoad"
    />
    
    <!-- 历史记录面板 -->
    <history-panel
      :history="editHistory"
      :current-index="currentHistoryIndex"
      @undo="handleUndo"
      @redo="handleRedo"
    />
  </div>
</template>

<script>
import { ImagePreview, HistoryPanel } from '@/components/ui'

export default {
  components: {
    ImagePreview,
    HistoryPanel
  },
  data() {
    return {
      imageSrc: '',
      editHistory: [],
      currentHistoryIndex: -1
    }
  },
  methods: {
    handleZoomChange(zoomLevel) {
      console.log('Zoom changed:', zoomLevel)
    },
    handleImageLoad(imageData) {
      console.log('Image loaded:', imageData)
    },
    handleUndo() {
      // 撤销逻辑
    },
    handleRedo() {
      // 重做逻辑
    }
  }
}
</script>
```

### 适配器使用

```javascript
import { AdapterManager } from '@/adapters'

// 创建适配器管理器
const adapterManager = new AdapterManager()

// 初始化Konva适配器
const konvaAdapter = await adapterManager.createAdapter('konva')
await konvaAdapter.initialize(containerElement)

// 加载图像
await konvaAdapter.loadImage('/path/to/image.jpg')

// 应用滤镜
await konvaAdapter.applyFilter('brightness', { value: 0.2 })

// 旋转图像
await konvaAdapter.rotate(45)

// 导出结果
const dataURL = await konvaAdapter.toDataURL('image/png', 0.9)
```

## 📖 API文档规范

### 方法文档格式

```javascript
/**
 * 方法描述
 * @param {Type} paramName - 参数描述
 * @param {Type} [optionalParam] - 可选参数描述
 * @returns {Promise<Type>} 返回值描述
 * @throws {Error} 错误情况描述
 * @example
 * // 使用示例
 * const result = await method(param1, param2)
 */
async method(paramName, optionalParam) {
  // 方法实现
}
```

### 事件文档格式

```javascript
/**
 * 事件名称
 * @event ComponentName#eventName
 * @type {Object}
 * @property {Type} property1 - 属性描述
 * @property {Type} property2 - 属性描述
 * @example
 * // 监听事件
 * component.$on('eventName', (eventData) => {
 *   console.log(eventData.property1)
 * })
 */
```

## 🧪 API测试

### 单元测试

```javascript
import { mount } from '@vue/test-utils'
import ImagePreview from '@/components/ui/ImagePreview.vue'

describe('ImagePreview API', () => {
  test('should emit zoom-change event', async () => {
    const wrapper = mount(ImagePreview, {
      propsData: {
        imageSrc: '/test-image.jpg',
        zoomEnabled: true
      }
    })
    
    await wrapper.vm.setZoom(2.0)
    
    expect(wrapper.emitted('zoom-change')).toBeTruthy()
    expect(wrapper.emitted('zoom-change')[0][0]).toBe(2.0)
  })
})
```

### 集成测试

```javascript
import { AdapterManager } from '@/adapters'

describe('Adapter API Integration', () => {
  test('should switch between adapters seamlessly', async () => {
    const manager = new AdapterManager()
    
    // 初始化Konva适配器
    const konvaAdapter = await manager.createAdapter('konva')
    await konvaAdapter.initialize(document.createElement('div'))
    await konvaAdapter.loadImage('/test-image.jpg')
    
    // 切换到Fabric适配器
    const fabricAdapter = await manager.switchAdapter('fabric')
    
    // 验证状态是否正确转移
    expect(fabricAdapter.getImageData()).toBeTruthy()
  })
})
```

## 📊 性能考虑

### API性能优化

1. **懒加载**: 按需加载适配器和组件
2. **缓存**: 缓存频繁访问的数据
3. **防抖**: 对频繁调用的方法进行防抖处理
4. **异步**: 使用异步方法避免阻塞UI

### 内存管理

1. **资源清理**: 及时释放不用的资源
2. **事件解绑**: 组件销毁时解绑事件监听器
3. **弱引用**: 使用WeakMap避免内存泄漏

## 🔄 版本兼容性

### API版本策略

- **主版本**: 不兼容的API变更
- **次版本**: 向后兼容的功能添加
- **修订版本**: 向后兼容的问题修复

### 废弃API处理

```javascript
/**
 * @deprecated 自版本1.2.0起废弃，请使用newMethod替代
 * @see {@link newMethod}
 */
oldMethod() {
  console.warn('oldMethod is deprecated, use newMethod instead')
  return this.newMethod()
}
```

## 📞 获取帮助

### API问题

- 查看具体的API文档：[组件API](components.md) 或 [适配器API](adapters.md)
- 查看示例代码和测试用例
- 在GitHub上提交Issue

### 社区支持

- GitHub Discussions
- 开发者论坛
- 技术交流群

---

*准备深入了解API？从 [组件API](components.md) 或 [适配器API](adapters.md) 开始吧！*
