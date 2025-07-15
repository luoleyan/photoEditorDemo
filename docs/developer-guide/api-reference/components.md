# 组件API参考

本文档提供了 PhotoEditor Demo 项目中所有组件的详细API参考。

> 本文档基于原始的 COMPONENTS.md 整理而来，原文档已移除。

## 架构概览

项目采用三层架构模式：

1. **UI组件层**: Vue.js组件，负责用户界面
2. **统一API层**: 提供一致的接口规范
3. **适配器层**: 库特定的实现（Konva.js、Fabric.js、TUI Image Editor）

## 组件分类

### 高优先级组件

#### ImagePreview

高级图像预览组件，提供全面的导航和对比功能。

**属性 (Props):**

- `imageSrc` (String): 图像源URL
- `zoomEnabled` (Boolean): 启用缩放功能
- `panEnabled` (Boolean): 启用平移功能
- `showThumbnail` (Boolean): 显示缩略图导航
- `comparisonMode` (Boolean): 启用前后对比模式

**事件 (Events):**

- `zoom-change`: 缩放级别改变时触发
- `pan-change`: 平移位置改变时触发
- `image-load`: 图像加载成功时触发

**使用示例:**

```vue
<template>
  <image-preview
    :image-src="imageSrc"
    :zoom-enabled="true"
    :show-thumbnail="true"
    @zoom-change="handleZoomChange"
  />
</template>

<script>
export default {
  data() {
    return {
      imageSrc: '/path/to/image.jpg'
    }
  },
  methods: {
    handleZoomChange(zoomLevel) {
      console.log('Zoom level changed:', zoomLevel)
    }
  }
}
</script>
```

#### HistoryPanel

可视化撤销/重做系统，支持操作缩略图和搜索功能。

**属性 (Props):**

- `history` (Array): 历史操作数组
- `currentIndex` (Number): 当前历史位置
- `maxHistorySize` (Number): 最大历史记录数量
- `showThumbnails` (Boolean): 显示操作缩略图

**事件 (Events):**

- `undo`: 请求撤销操作时触发
- `redo`: 请求重做操作时触发
- `goto`: 跳转到特定历史点时触发

**使用示例:**

```vue
<template>
  <history-panel
    :history="editHistory"
    :current-index="currentHistoryIndex"
    :max-history-size="50"
    @undo="handleUndo"
    @redo="handleRedo"
  />
</template>
```

#### FilterPanel

实时滤镜预览面板，支持预设和自定义组合。

**属性 (Props):**

- `filters` (Array): 可用滤镜列表
- `presets` (Array): 滤镜预设
- `realTimePreview` (Boolean): 启用实时预览
- `allowCustom` (Boolean): 允许自定义滤镜组合

**事件 (Events):**

- `filter-apply`: 应用滤镜时触发
- `filter-preview`: 预览期间触发
- `preset-select`: 选择预设时触发

### 中优先级组件

#### LayerPanel

完整的图层管理组件，支持拖拽重排序和混合模式。

**属性 (Props):**

- `layers` (Array): 图层对象数组
- `selectedLayerIds` (Array): 当前选中的图层ID
- `allowReorder` (Boolean): 启用拖拽重排序
- `showBlendModes` (Boolean): 显示混合模式选项

**事件 (Events):**

- `layer-select`: 选择图层时触发
- `layer-visibility-change`: 可见性改变时触发
- `layers-reorder`: 图层重排序时触发
- `layer-delete`: 删除图层时触发

#### CropTool

灵活的裁剪工具，支持宽高比约束和参考线。

**属性 (Props):**

- `imageSrc` (String): 源图像URL
- `aspectRatio` (Number): 固定宽高比（可选）
- `showGrid` (Boolean): 显示网格线
- `showGuides` (Boolean): 显示参考线
- `minSize` (Object): 最小裁剪尺寸

**事件 (Events):**

- `crop-change`: 裁剪区域改变时触发
- `crop-apply`: 应用裁剪时触发
- `crop-cancel`: 取消裁剪时触发

#### TextTool

富文本编辑工具，支持字体、样式和效果。

**属性 (Props):**

- `textElements` (Array): 文本元素数组
- `fonts` (Array): 可用字体列表
- `allowEffects` (Boolean): 启用文本效果
- `backgroundImage` (String): 背景图像URL

**事件 (Events):**

- `text-add`: 添加文本时触发
- `text-edit`: 编辑文本时触发
- `text-delete`: 删除文本时触发
- `text-style-change`: 文本样式改变时触发

### 低优先级组件

#### ShapeTool

矢量形状创建工具，支持属性和变换。

**属性 (Props):**

- `shapes` (Array): 形状对象数组
- `selectedShapeType` (String): 当前选中的形状类型
- `allowGrouping` (Boolean): 启用形状分组
- `showGrid` (Boolean): 显示对齐网格

**事件 (Events):**

- `shape-add`: 添加形状时触发
- `shape-select`: 选择形状时触发
- `shapes-group`: 形状分组时触发
- `shapes-align`: 形状对齐时触发

#### BrushTool

高级绘画系统，支持多种笔刷类型和压感。

**属性 (Props):**

- `brushTypes` (Array): 可用笔刷类型
- `pressureSensitive` (Boolean): 启用压感
- `smoothing` (Number): 笔刷平滑级别
- `backgroundImage` (String): 背景图像URL

**事件 (Events):**

- `stroke-start`: 开始绘制时触发
- `stroke-end`: 结束绘制时触发
- `brush-change`: 笔刷设置改变时触发

#### ExportPanel

多格式导出面板，支持质量设置和批量处理。

**属性 (Props):**

- `formats` (Array): 可用导出格式
- `qualitySettings` (Object): 质量配置
- `batchMode` (Boolean): 启用批量导出
- `sourceCanvas` (HTMLCanvasElement): 源Canvas元素

**事件 (Events):**

- `export-start`: 开始导出时触发
- `export-complete`: 导出完成时触发
- `export-error`: 导出失败时触发

## 通用属性

所有组件都支持以下通用属性：

- `variant` (String): 视觉样式变体 ('default', 'minimal', 'compact')
- `disabled` (Boolean): 禁用组件交互
- `theme` (String): 颜色主题 ('light', 'dark')
- `customStyles` (Object): 自定义CSS属性

## 样式定制

组件使用CSS自定义属性进行主题化：

```css
.component {
  --primary-color: #1890ff;
  --background-color: #ffffff;
  --text-color: #333333;
  --border-color: #d9d9d9;
}
```

## 适配器集成

组件通过事件与适配器系统集成：

```javascript
// 示例适配器集成
methods: {
  handleFilterApply(filter) {
    this.imageAdapter.applyFilter(filter.type, filter.params);
  },
  
  handleCropApply(cropData) {
    this.imageAdapter.cropImage(cropData);
  }
}
```

## 性能考虑

- 组件使用懒加载处理重型操作
- 图像处理在可能的情况下使用Web Workers
- Canvas操作针对流畅交互进行优化
- 内存管理包括适当的资源清理

## 浏览器兼容性

所有组件在以下浏览器中测试并兼容：

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

---

*需要了解适配器API？查看 [适配器API参考](adapters.md)。*
