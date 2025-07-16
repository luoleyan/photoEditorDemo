# 图像编辑器统一UI组件库设计

> **📍 文档迁移提示**: 本文档已从根目录 `IMAGE_EDITOR_UI_COMPONENTS.md` 迁移到 `docs/developer-guide/architecture/ui-components.md`。

**✅ 更新状态**: UI组件与适配器集成已完善，支持多适配器兼容性和错误处理

## 1. 设计目标

创建一个统一的UI组件库，实现以下目标：

1. **一致的用户体验** - 提供统一的设计语言和交互模式
2. **响应式设计** - 适配不同设备和屏幕尺寸
3. **模块化结构** - 支持按需加载和自定义组合
4. **主题定制** - 支持自定义主题和样式
5. **无障碍支持** - 符合WCAG标准，支持键盘导航和屏幕阅读器
6. **高性能渲染** - 优化组件渲染性能，减少重绘和回流
7. **与适配器集成** - 与底层适配器和状态管理系统无缝集成 **（已实现）**
8. **多适配器兼容** - 支持Fabric、Konva、TUI、Cropper、Jimp等多种适配器 **（已实现）**
9. **智能错误处理** - 统一的错误处理和用户友好的错误恢复 **（已实现）**

## 2. 核心UI组件

### 2.1 编辑器布局组件

#### 2.1.1 EditorContainer

主容器组件，负责整体布局和响应式调整。

```vue
<template>
  <div class="editor-container" :class="{ 'mobile-view': isMobileView }">
    <slot name="header"></slot>
    <div class="editor-main">
      <slot name="sidebar-left"></slot>
      <div class="editor-content">
        <slot name="toolbar-top"></slot>
        <div class="canvas-container" ref="canvasContainer">
          <slot name="canvas"></slot>
          <slot name="canvas-overlay"></slot>
        </div>
        <slot name="toolbar-bottom"></slot>
      </div>
      <slot name="sidebar-right"></slot>
    </div>
    <slot name="footer"></slot>
  </div>
</template>

<script>
export default {
  name: 'EditorContainer',
  props: {
    mobileBreakpoint: {
      type: Number,
      default: 768
    }
  },
  data() {
    return {
      isMobileView: false,
      containerWidth: 0,
      containerHeight: 0
    }
  },
  mounted() {
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateDimensions);
  },
  methods: {
    updateDimensions() {
      this.containerWidth = this.$el.clientWidth;
      this.containerHeight = this.$el.clientHeight;
      this.isMobileView = this.containerWidth < this.mobileBreakpoint;
      this.$emit('dimensions-change', {
        width: this.containerWidth,
        height: this.containerHeight,
        isMobileView: this.isMobileView
      });
    },
    getCanvasContainer() {
      return this.$refs.canvasContainer;
    }
  }
}
</script>
```

#### 2.1.2 EditorToolbar

工具栏组件，支持分组和响应式调整。

```vue
<template>
  <div class="editor-toolbar" :class="{ 'vertical': vertical, 'collapsible': collapsible }">
    <div v-if="collapsible" class="toolbar-toggle" @click="toggleCollapsed">
      <i :class="collapsed ? 'icon-expand' : 'icon-collapse'"></i>
    </div>
    <div class="toolbar-content" :class="{ 'collapsed': collapsed }">
      <template v-for="(group, index) in toolGroups">
        <div :key="index" class="tool-group">
          <div v-if="group.title" class="group-title">{{ group.title }}</div>
          <div class="group-tools">
            <slot :name="group.name" :tools="group.tools"></slot>
          </div>
        </div>
        <div v-if="index < toolGroups.length - 1" :key="`divider-${index}`" class="tool-divider"></div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditorToolbar',
  props: {
    vertical: {
      type: Boolean,
      default: false
    },
    collapsible: {
      type: Boolean,
      default: false
    },
    toolGroups: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      collapsed: false
    }
  },
  methods: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      this.$emit('collapse-change', this.collapsed);
    }
  }
}
</script>
```

### 2.2 工具按钮组件

#### 2.2.1 ToolButton

基础工具按钮组件。

```vue
<template>
  <button
    class="tool-button"
    :class="{
      'active': active,
      'disabled': disabled,
      [`size-${size}`]: true
    }"
    :title="tooltip"
    :disabled="disabled"
    @click="handleClick"
  >
    <i v-if="icon" :class="`icon-${icon}`"></i>
    <span v-if="label && (showLabel || !icon)" class="button-label">{{ label }}</span>
  </button>
</template>

<script>
export default {
  name: 'ToolButton',
  props: {
    icon: String,
    label: String,
    tooltip: String,
    active: Boolean,
    disabled: Boolean,
    showLabel: Boolean,
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    }
  },
  methods: {
    handleClick(event) {
      if (!this.disabled) {
        this.$emit('click', event);
      }
    }
  }
}
</script>
```

#### 2.2.2 ToolToggleButton

可切换状态的工具按钮。

```vue
<template>
  <tool-button
    :icon="icon"
    :label="label"
    :tooltip="tooltip"
    :active="modelValue"
    :disabled="disabled"
    :showLabel="showLabel"
    :size="size"
    @click="toggle"
  />
</template>

<script>
import ToolButton from './ToolButton.vue';

export default {
  name: 'ToolToggleButton',
  components: {
    ToolButton
  },
  props: {
    modelValue: Boolean,
    icon: String,
    label: String,
    tooltip: String,
    disabled: Boolean,
    showLabel: Boolean,
    size: String
  },
  methods: {
    toggle() {
      this.$emit('update:modelValue', !this.modelValue);
    }
  }
}
</script>
```

### 2.3 控制面板组件

#### 2.3.1 ControlPanel

控制面板容器组件。

```vue
<template>
  <div class="control-panel" :class="{ 'collapsed': collapsed }">
    <div class="panel-header" @click="toggleCollapsed">
      <h3 class="panel-title">{{ title }}</h3>
      <button class="collapse-button">
        <i :class="collapsed ? 'icon-expand' : 'icon-collapse'"></i>
      </button>
    </div>
    <div class="panel-content" v-show="!collapsed">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ControlPanel',
  props: {
    title: String,
    initialCollapsed: Boolean
  },
  data() {
    return {
      collapsed: this.initialCollapsed
    }
  },
  methods: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      this.$emit('collapse-change', this.collapsed);
    }
  }
}
</script>
```

#### 2.3.2 SliderControl

滑块控制组件，用于调整数值参数。

```vue
<template>
  <div class="slider-control">
    <div class="slider-header">
      <label :for="id" class="slider-label">{{ label }}</label>
      <div class="slider-value">{{ displayValue }}</div>
    </div>
    <div class="slider-input-group">
      <input
        :id="id"
        type="range"
        class="slider-input"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="updateValue"
      />
      <button v-if="showReset" class="reset-button" @click="resetValue" :disabled="modelValue === defaultValue">
        <i class="icon-reset"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SliderControl',
  props: {
    id: {
      type: String,
      required: true
    },
    label: String,
    modelValue: Number,
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    },
    defaultValue: Number,
    showReset: {
      type: Boolean,
      default: true
    },
    valueFormat: {
      type: Function,
      default: value => value
    }
  },
  computed: {
    displayValue() {
      return this.valueFormat(this.modelValue);
    }
  },
  methods: {
    updateValue(event) {
      this.$emit('update:modelValue', Number(event.target.value));
    },
    resetValue() {
      this.$emit('update:modelValue', this.defaultValue);
    }
  }
}
</script>
```

### 2.4 预览组件

#### 2.4.1 ImagePreview

图像预览组件，显示编辑效果。

```vue
<template>
  <div class="image-preview" :style="previewStyle">
    <div class="preview-header">
      <h3 class="preview-title">{{ title }}</h3>
      <div class="preview-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="preview-content" ref="previewContainer">
      <img v-if="previewSrc" :src="previewSrc" class="preview-image" :alt="title" />
      <div v-else class="preview-placeholder">
        <i class="icon-image"></i>
        <p>{{ placeholderText }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagePreview',
  props: {
    title: {
      type: String,
      default: 'Preview'
    },
    previewSrc: String,
    placeholderText: {
      type: String,
      default: 'No preview available'
    },
    width: {
      type: [Number, String],
      default: '100%'
    },
    height: {
      type: [Number, String],
      default: '200px'
    }
  },
  computed: {
    previewStyle() {
      return {
        width: typeof this.width === 'number' ? `${this.width}px` : this.width,
        height: typeof this.height === 'number' ? `${this.height}px` : this.height
      };
    }
  }
}
</script>
```

## 8. 适配器集成架构 **（新增）**

### 8.1 集成设计原则

UI组件与适配器的集成遵循以下原则：

1. **适配器无关性** - 组件不依赖特定适配器实现
2. **统一接口** - 通过标准化接口与适配器交互
3. **错误隔离** - 适配器错误不影响UI组件稳定性
4. **性能优化** - 最小化适配器调用开销
5. **向后兼容** - 支持不完整的适配器实现

### 8.2 TextTool适配器集成

```vue
<template>
  <TextTool
    :adapter="currentAdapter"
    :adapter-type="adapterType"
    @error="handleTextToolError"
    @text-add="handleTextAdd"
    @text-update="handleTextUpdate"
  />
</template>

<script>
export default {
  data() {
    return {
      currentAdapter: null,
      adapterType: 'fabric'
    };
  },
  methods: {
    async handleTextAdd(textData) {
      // 文本添加成功，可以进行后续处理
      console.log('Text added:', textData);
    },

    handleTextToolError(error) {
      // 统一错误处理
      this.$emit('error', error);
    }
  }
};
</script>
```

#### 支持的适配器方法

| 方法 | Fabric | Konva | TUI | 说明 |
|------|--------|-------|-----|------|
| `addText` | ✅ | ✅ | ✅ | 添加文本对象 |
| `removeText` | ✅ | ✅ | ✅ | 删除文本对象 |
| `updateText` | ✅ | ✅ | ✅ | 更新文本属性 |
| `removeObject` | ✅ | ✅ | ❌ | 通用对象删除（备选） |
| `updateObject` | ✅ | ✅ | ❌ | 通用对象更新（备选） |

### 8.3 BrushTool适配器集成

```vue
<template>
  <BrushTool
    :adapter="currentAdapter"
    :adapter-type="adapterType"
    @error="handleBrushToolError"
    @stroke-add="handleStrokeAdd"
  />
</template>
```

#### 支持的适配器方法

| 方法 | Fabric | Konva | TUI | 说明 |
|------|--------|-------|-----|------|
| `enableDrawingMode` | ✅ | ❌ | ❌ | 启用绘制模式 |
| `startDrawing` | ❌ | ✅ | ✅ | 开始绘制 |
| `addPath` | ✅ | ❌ | ❌ | 添加SVG路径 |
| `addLine` | ❌ | ✅ | ❌ | 添加线条 |
| `addDrawingPath` | ❌ | ❌ | ✅ | 添加绘制路径 |

### 8.4 适配器兼容性处理

```javascript
// 智能方法检测和回退
async _addTextToAdapter(textData) {
  if (!this.adapter) return null;

  try {
    // 优先使用专用方法
    if (typeof this.adapter.addText === 'function') {
      return await this.adapter.addText(textData.content, textData.x, textData.y, options);
    }

    // 回退到通用方法
    if (typeof this.adapter.addObject === 'function') {
      return await this.adapter.addObject('text', { ...textData, ...options });
    }

    console.warn('Adapter does not support text operations');
    return null;
  } catch (error) {
    console.error('Failed to add text to adapter:', error);
    throw error;
  }
}
```

### 8.5 错误处理策略

```javascript
// 统一错误处理
async handleAdapterOperation(operation, params) {
  try {
    return await operation(params);
  } catch (error) {
    // 错误分类和处理
    const errorType = this._classifyError(error);

    switch (errorType) {
      case 'method-not-supported':
        console.warn('Method not supported by current adapter');
        return null;

      case 'invalid-parameters':
        this.$emit('error', {
          type: 'parameter-error',
          message: '参数无效',
          error
        });
        break;

      case 'adapter-error':
        this.$emit('error', {
          type: 'adapter-error',
          message: '适配器操作失败',
          error
        });
        break;

      default:
        this.$emit('error', {
          type: 'unknown-error',
          message: '未知错误',
          error
        });
    }

    throw error;
  }
}
```

### 8.6 性能优化

1. **批量操作** - 合并多个适配器调用
2. **异步处理** - 避免阻塞UI线程
3. **缓存机制** - 缓存适配器能力检测结果
4. **懒加载** - 按需加载适配器功能

```javascript
// 适配器能力缓存
const adapterCapabilities = new Map();

function getAdapterCapabilities(adapter) {
  const cacheKey = adapter.constructor.name;

  if (!adapterCapabilities.has(cacheKey)) {
    const capabilities = {
      supportsText: typeof adapter.addText === 'function',
      supportsDrawing: typeof adapter.enableDrawingMode === 'function',
      supportsPath: typeof adapter.addPath === 'function'
    };

    adapterCapabilities.set(cacheKey, capabilities);
  }

  return adapterCapabilities.get(cacheKey);
}
```

## 9. 测试策略

### 9.1 单元测试

- ✅ 组件渲染测试
- ✅ 适配器集成测试
- ✅ 错误处理测试
- ✅ 兼容性测试

### 9.2 集成测试

- ✅ 多适配器切换测试
- ✅ 状态同步测试
- ✅ 性能基准测试

## 10. 使用示例

```vue
<template>
  <div class="photo-editor">
    <TextTool
      :adapter="currentAdapter"
      :adapter-type="adapterType"
      @error="handleError"
    />
    <BrushTool
      :adapter="currentAdapter"
      :adapter-type="adapterType"
      @error="handleError"
    />
  </div>
</template>

<script>
import TextTool from '@/components/ui/TextTool.vue';
import BrushTool from '@/components/ui/BrushTool.vue';

export default {
  components: {
    TextTool,
    BrushTool
  },
  props: {
    adapter: Object,
    adapterType: String
  },
  computed: {
    currentAdapter() {
      return this.adapter;
    }
  },
  methods: {
    handleError(error) {
      console.error('UI Component Error:', error);
      // 显示用户友好的错误提示
    }
  }
};
</script>
```