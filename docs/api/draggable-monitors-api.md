# 可拖拽监控系统 API 文档

## 概述

可拖拽监控系统提供了一套完整的拖拽、边缘吸附和视觉标识功能，支持智能初始位置计算和统一的边缘吸附行为。

## DraggableMixin

### 配置选项

#### snapConfig
边缘吸附配置对象

```javascript
snapConfig: {
  threshold: 50,           // 边缘检测阈值（像素）
  hiddenSize: 30,          // 吸附后显示的大小（像素）
  animationDuration: 300   // 动画持续时间（毫秒）
}
```

#### edgeIndicator
边缘指示器状态

```javascript
edgeIndicator: {
  visible: false,    // 指示器是否可见
  edge: null,        // 当前边缘 ('top', 'bottom', 'left', 'right')
  opacity: 0         // 指示器透明度 (0-1)
}
```

### 计算属性

#### draggableStyle
返回组件的拖拽样式对象

```javascript
computed: {
  draggableStyle() {
    return {
      position: 'fixed',
      transform: `translate(${this.position.x}px, ${this.position.y}px)`,
      transition: this.isDragging ? 'none' : `transform ${this.snapConfig.animationDuration}ms ease-out`,
      zIndex: this.isDragging ? 2000 : (this.position.isSnapped ? 1200 : 1500),
      opacity: this.isDragging ? 0.8 : (this.position.isSnapped ? 0.9 : 1),
      cursor: this.isDragging ? 'grabbing' : 'grab'
    }
  }
}
```

#### edgeIndicatorStyle
返回边缘指示器的样式对象

```javascript
computed: {
  edgeIndicatorStyle() {
    // 根据边缘位置计算指示器的位置和尺寸
    // 返回包含位置、尺寸、颜色等样式的对象
  }
}
```

#### triggerAreaStyle
返回触发区域的样式对象

```javascript
computed: {
  triggerAreaStyle() {
    // 计算吸附后触发区域的位置和尺寸
    // 返回触发区域的样式对象
  }
}
```

#### snapStatusStyle
返回吸附状态标识的样式对象

```javascript
computed: {
  snapStatusStyle() {
    // 计算吸附状态徽章的样式
    // 包含位置、颜色、动画等属性
  }
}
```

### 核心方法

#### setInitialPosition()
设置组件的智能初始位置

```javascript
setInitialPosition() {
  // 根据组件类型和屏幕尺寸计算最佳初始位置
  // 性能监控器：右上角
  // 系统健康监控器：右侧中间
  // 确保位置在可视区域内
}
```

#### updatePosition(clientX, clientY)
更新组件位置并触发边缘指示器更新

```javascript
updatePosition(clientX, clientY) {
  // 计算新位置
  // 限制在可视区域内
  // 更新边缘指示器
}
```

#### snapToEdge(edge)
将组件吸附到指定边缘

```javascript
snapToEdge(edge) {
  // 参数: edge - 'top', 'bottom', 'left', 'right'
  // 计算吸附后的位置（隐藏大部分控件）
  // 设置吸附状态
  // 触发 'snapped' 事件
}
```

#### unsnap()
取消边缘吸附

```javascript
unsnap() {
  // 将控件移动到边缘内的合理位置
  // 重置吸附状态
  // 触发 'unsnapped' 事件
}
```

#### updateEdgeIndicator()
更新边缘指示器显示

```javascript
updateEdgeIndicator() {
  // 检测最近的边缘
  // 计算动态透明度
  // 显示或隐藏指示器
}
```

#### showEdgeIndicator(edge, distance)
显示边缘指示器

```javascript
showEdgeIndicator(edge, distance) {
  // 参数: edge - 边缘位置, distance - 距离边缘的像素
  // 设置指示器可见性和透明度
  // 触发 'edge-indicator-show' 事件
}
```

#### hideEdgeIndicator()
隐藏边缘指示器

```javascript
hideEdgeIndicator() {
  // 隐藏指示器
  // 重置状态
  // 触发 'edge-indicator-hide' 事件
}
```

### 工具方法

#### getEdgeIndicatorColor(edge)
获取边缘指示器颜色

```javascript
getEdgeIndicatorColor(edge) {
  // 返回指定边缘的指示器颜色
  // top: 蓝色, bottom: 绿色, left: 紫色, right: 红色
}
```

#### getEdgeIndicatorBorderColor(edge)
获取边缘指示器边框颜色

```javascript
getEdgeIndicatorBorderColor(edge) {
  // 返回指定边缘的指示器边框颜色
}
```

#### getEdgeDisplayName(edge)
获取边缘显示名称

```javascript
getEdgeDisplayName(edge) {
  // 返回边缘的中文显示名称
  // top: '顶部', bottom: '底部', left: '左侧', right: '右侧'
}
```

### 事件

#### drag-start
拖拽开始事件

```javascript
// 触发时机：开始拖拽操作时
// 参数：{ x: number, y: number } - 起始位置
this.$emit('drag-start', { x: this.position.x, y: this.position.y })
```

#### drag-end
拖拽结束事件

```javascript
// 触发时机：拖拽操作结束时
// 参数：{ x: number, y: number } - 结束位置
this.$emit('drag-end', { x: this.position.x, y: this.position.y })
```

#### snapped
边缘吸附事件

```javascript
// 触发时机：组件吸附到边缘时
// 参数：edge - 吸附的边缘位置
this.$emit('snapped', edge)
```

#### unsnapped
取消吸附事件

```javascript
// 触发时机：取消边缘吸附时
// 参数：无
this.$emit('unsnapped')
```

#### edge-indicator-show
边缘指示器显示事件

```javascript
// 触发时机：显示边缘指示器时
// 参数：{ edge: string, distance: number, opacity: number }
this.$emit('edge-indicator-show', { edge, distance, opacity })
```

#### edge-indicator-hide
边缘指示器隐藏事件

```javascript
// 触发时机：隐藏边缘指示器时
// 参数：无
this.$emit('edge-indicator-hide')
```

#### trigger-hover
触发区域悬停事件

```javascript
// 触发时机：鼠标悬停在触发区域时
// 参数：无
this.$emit('trigger-hover')
```

## PerformanceMonitor 组件

### 属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| adapter | Object | null | 当前适配器实例 |
| showDetails | Boolean | false | 是否显示详细信息 |

### 方法

#### getEdgeIcon(edge)
获取边缘图标

```javascript
getEdgeIcon(edge) {
  // 返回指定边缘的图标
  // top: '⬆️', bottom: '⬇️', left: '⬅️', right: '➡️'
}
```

### 事件

继承自 DraggableMixin 的所有事件，另外包括：

- `memory-warning` - 内存警告
- `performance-issue` - 性能问题
- `cleanup-performed` - 清理完成
- `metrics-reset` - 指标重置
- `report-exported` - 报告导出

## SystemHealthMonitor 组件

### 属性

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| autoCheck | Boolean | true | 是否自动检查系统健康 |
| checkInterval | Number | 30000 | 检查间隔（毫秒） |

### 方法

#### getEdgeIcon(edge)
获取边缘图标（同 PerformanceMonitor）

### 事件

继承自 DraggableMixin 的所有事件，另外包括：

- `health-updated` - 健康状态更新
- `action-request` - 操作请求
- `recommendation-executed` - 建议执行
- `report-exported` - 报告导出

## 使用示例

### 基础使用

```vue
<template>
  <div>
    <performance-monitor
      :adapter="currentAdapter"
      @drag-start="handleDragStart"
      @snapped="handleSnapped"
      @edge-indicator-show="handleEdgeIndicatorShow"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentAdapter: null
    }
  },
  methods: {
    handleDragStart(position) {
      console.log('开始拖拽:', position)
    },
    handleSnapped(edge) {
      console.log('吸附到边缘:', edge)
    },
    handleEdgeIndicatorShow({ edge, distance, opacity }) {
      console.log(`显示${edge}边缘指示器，距离: ${distance}px，透明度: ${opacity}`)
    }
  }
}
</script>
```

### 高级配置

```vue
<template>
  <system-health-monitor
    :auto-check="true"
    :check-interval="60000"
    @health-updated="handleHealthUpdated"
    @edge-indicator-hide="handleEdgeIndicatorHide"
  />
</template>

<script>
export default {
  methods: {
    handleHealthUpdated(healthData) {
      console.log('系统健康状态更新:', healthData)
    },
    handleEdgeIndicatorHide() {
      console.log('边缘指示器已隐藏')
    }
  }
}
</script>
```

## 样式定制

### CSS 类名

- `.performance-monitor` - 性能监控器容器
- `.system-health-monitor` - 系统健康监控器容器
- `.edge-indicator` - 边缘指示器
- `.snap-status-badge` - 吸附状态徽章
- `.snap-trigger-area` - 触发区域
- `.trigger-hint` - 触发提示

### 自定义样式

```css
/* 自定义边缘指示器颜色 */
.performance-monitor .edge-indicator {
  border-left: 4px solid #007bff;
}

.system-health-monitor .edge-indicator {
  border-left: 4px solid #28a745;
}

/* 自定义吸附状态徽章 */
.performance-monitor .snap-status-badge {
  background: linear-gradient(135deg, #007bff 0%, #6610f2 100%);
}

.system-health-monitor .snap-status-badge {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}
```

## 配置选项

### 全局配置

```javascript
// 在 main.js 中配置
Vue.mixin({
  data() {
    return {
      snapConfig: {
        threshold: 50,
        hiddenSize: 30,
        animationDuration: 300
      }
    }
  }
})
```

### 组件级配置

```vue
<script>
export default {
  data() {
    return {
      snapConfig: {
        threshold: 60,        // 自定义阈值
        hiddenSize: 40,       // 自定义隐藏大小
        animationDuration: 400 // 自定义动画时长
      }
    }
  }
}
</script>
```
