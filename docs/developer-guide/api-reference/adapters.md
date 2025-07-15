# 适配器API参考

本文档提供了 PhotoEditor Demo 项目中图像编辑适配器的详细API参考。

## 🏗️ 适配器架构

### 基础适配器接口

所有适配器都实现 `BaseImageEditorAdapter` 接口：

```typescript
interface BaseImageEditorAdapter {
  // 生命周期方法
  initialize(container: HTMLElement, options?: any): Promise<void>;
  destroy(): void;
  isInitialized(): boolean;
  
  // 图像操作
  loadImage(source: string | File | Blob): Promise<void>;
  getImageData(): ImageData | null;
  
  // 基础编辑操作
  resize(width: number, height: number): Promise<void>;
  crop(x: number, y: number, width: number, height: number): Promise<void>;
  rotate(angle: number): Promise<void>;
  flip(horizontal: boolean, vertical: boolean): Promise<void>;
  
  // 滤镜和调整
  setBrightness(value: number): Promise<void>;
  setContrast(value: number): Promise<void>;
  applyFilter(filterType: string, options?: any): Promise<void>;
  
  // 状态管理
  saveState(): string;
  restoreState(stateId: string): Promise<void>;
  reset(): Promise<void>;
  
  // 导出方法
  toDataURL(type?: string, quality?: number): Promise<string>;
  toBlob(type?: string, quality?: number): Promise<Blob>;
  
  // 事件处理
  on(eventName: string, callback: Function): void;
  off(eventName: string, callback: Function): void;
}
```

## 📚 具体适配器实现

### KonvaAdapter

基于 Konva.js 的高性能图形适配器。

#### 初始化

```javascript
const adapter = new KonvaAdapter();
await adapter.initialize(containerElement, {
  width: 800,
  height: 600
});
```

#### 特有方法

```javascript
// 添加图层
adapter.addLayer(layerConfig);

// 设置动画
adapter.animate(animationConfig);

// 获取舞台对象
const stage = adapter.getStage();
```

#### 事件

- `stage:click` - 舞台点击事件
- `layer:add` - 图层添加事件
- `object:transform` - 对象变换事件

### FabricAdapter

基于 Fabric.js 的Canvas操作适配器。

#### 初始化

```javascript
const adapter = new FabricAdapter();
await adapter.initialize(containerElement, {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff'
});
```

#### 特有方法

```javascript
// 添加对象
adapter.addObject(fabricObject);

// 设置选择模式
adapter.setSelectionMode(enabled);

// 获取Canvas对象
const canvas = adapter.getCanvas();

// 应用滤镜
adapter.applyImageFilter(filterName, options);
```

#### 事件

- `canvas:selection:created` - 选择创建事件
- `object:modified` - 对象修改事件
- `path:created` - 路径创建事件

### CropperAdapter

基于 Cropper.js 的专业裁剪适配器。

#### 初始化

```javascript
const adapter = new CropperAdapter();
await adapter.initialize(imageElement, {
  aspectRatio: 16 / 9,
  viewMode: 1,
  autoCropArea: 0.8
});
```

#### 特有方法

```javascript
// 设置裁剪比例
adapter.setAspectRatio(ratio);

// 获取裁剪数据
const cropData = adapter.getCropBoxData();

// 设置裁剪框
adapter.setCropBoxData(data);

// 缩放到指定比例
adapter.zoomTo(ratio);
```

#### 事件

- `cropstart` - 开始裁剪事件
- `cropmove` - 裁剪移动事件
- `cropend` - 结束裁剪事件

### TUIAdapter

基于 TUI Image Editor 的完整编辑器适配器。

#### 初始化

```javascript
const adapter = new TUIAdapter();
await adapter.initialize(containerElement, {
  includeUI: {
    theme: 'dark',
    menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter']
  }
});
```

#### 特有方法

```javascript
// 添加文本
adapter.addText('Hello World', {
  styles: {
    fontSize: 20,
    fill: '#000000'
  }
});

// 添加形状
adapter.addShape('rect', {
  fill: 'red',
  width: 100,
  height: 100
});

// 应用预设滤镜
adapter.applyPresetFilter('vintage');
```

#### 事件

- `addText` - 添加文本事件
- `addObject` - 添加对象事件
- `undoStackChanged` - 撤销栈变化事件

### JimpAdapter

基于 Jimp 的纯JavaScript图像处理适配器。

#### 初始化

```javascript
const adapter = new JimpAdapter();
await adapter.initialize(null, {
  quality: 90,
  format: 'png'
});
```

#### 特有方法

```javascript
// 批量处理
adapter.batchProcess(operations);

// 获取图像信息
const info = adapter.getImageInfo();

// 应用复合滤镜
adapter.applyCompositeFilter([
  { type: 'blur', radius: 2 },
  { type: 'brightness', value: 0.2 }
]);
```

#### 事件

- `process:start` - 处理开始事件
- `process:complete` - 处理完成事件
- `process:error` - 处理错误事件

## 🔧 适配器管理

### AdapterManager

管理多个适配器的生命周期和切换。

```javascript
import { AdapterManager } from '@/adapters';

const manager = new AdapterManager();

// 创建适配器
const konvaAdapter = await manager.createAdapter('konva');

// 切换适配器
const fabricAdapter = await manager.switchAdapter('fabric', {
  preserveState: true
});

// 获取当前适配器
const currentAdapter = manager.getCurrentAdapter();

// 销毁所有适配器
manager.destroyAll();
```

### AdapterFactory

创建和注册适配器的工厂类。

```javascript
import { AdapterFactory } from '@/adapters';

const factory = new AdapterFactory();

// 注册自定义适配器
factory.registerAdapter('custom', CustomAdapter);

// 创建适配器实例
const adapter = await factory.createAdapter('custom');

// 检查适配器是否可用
const isAvailable = factory.isAdapterAvailable('konva');
```

## 📊 性能监控

### 性能指标

所有适配器都提供性能监控接口：

```javascript
// 获取性能指标
const metrics = adapter.getPerformanceMetrics();

console.log(metrics);
// {
//   initTime: 150,        // 初始化时间(ms)
//   renderTime: 16,       // 渲染时间(ms)
//   memoryUsage: 25.6,    // 内存使用(MB)
//   operationCount: 42    // 操作次数
// }
```

### 性能优化建议

1. **Konva适配器**
   - 使用图层缓存提高渲染性能
   - 避免频繁的舞台重绘
   - 合理使用事件委托

2. **Fabric适配器**
   - 启用对象缓存
   - 使用静态Canvas减少重绘
   - 优化复杂路径的渲染

3. **Cropper适配器**
   - 限制图片大小避免内存溢出
   - 使用合适的视图模式
   - 避免频繁的裁剪框更新

## 🔄 状态转换

### 状态格式

统一的状态格式定义：

```typescript
interface EditorState {
  version: string;
  timestamp: number;
  adapter: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  transforms: {
    rotation: number;
    scale: { x: number; y: number };
    position: { x: number; y: number };
  };
  filters: Array<{
    type: string;
    params: any;
  }>;
  objects: Array<any>;
}
```

### 状态转换器

```javascript
import { StateConverter } from '@/adapters';

const converter = new StateConverter();

// 转换状态格式
const fabricState = converter.convert('konva', 'fabric', konvaState);

// 验证状态格式
const isValid = converter.validateState(state);

// 合并状态
const mergedState = converter.mergeStates(state1, state2);
```

## 🧪 测试

### 单元测试示例

```javascript
import { KonvaAdapter } from '@/adapters';

describe('KonvaAdapter', () => {
  let adapter;
  let container;

  beforeEach(() => {
    adapter = new KonvaAdapter();
    container = document.createElement('div');
  });

  afterEach(() => {
    if (adapter.isInitialized()) {
      adapter.destroy();
    }
  });

  test('should initialize correctly', async () => {
    await adapter.initialize(container);
    expect(adapter.isInitialized()).toBe(true);
  });

  test('should load image', async () => {
    await adapter.initialize(container);
    await adapter.loadImage('/test-image.jpg');
    expect(adapter.getImageData()).toBeTruthy();
  });
});
```

## 📞 获取帮助

### 常见问题

1. **适配器初始化失败**
   - 检查容器元素是否存在
   - 确认库文件已正确加载
   - 查看控制台错误信息

2. **状态转换异常**
   - 验证状态格式是否正确
   - 检查适配器兼容性
   - 使用调试模式查看详细信息

3. **性能问题**
   - 监控内存使用情况
   - 优化图片大小和质量
   - 减少不必要的重绘操作

### 相关文档

- [组件API参考](components.md) - UI组件接口文档
- [架构设计](../architecture/README.md) - 项目架构说明
- [故障排除](../../troubleshooting/README.md) - 问题解决方案

---

*需要了解组件API？查看 [组件API参考](components.md)。*
