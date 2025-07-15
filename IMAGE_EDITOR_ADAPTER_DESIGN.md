# 图像编辑库统一适配器接口设计

## 1. 设计目标

创建一个统一的适配器接口系统，实现以下目标：

1. **抽象底层差异** - 屏蔽各图像编辑库的API差异，提供一致的接口
2. **智能库选择** - 根据操作类型自动选择最适合的库
3. **无缝切换** - 在不同库之间平滑切换，保持图像状态一致
4. **性能优化** - 按需加载库，减少初始加载时间和内存占用
5. **扩展性** - 支持轻松添加新的图像编辑库适配器

## 2. 核心适配器接口

### 2.1 基础适配器接口 (BaseImageEditorAdapter)

```typescript
interface BaseImageEditorAdapter {
  // 生命周期方法
  initialize(container: HTMLElement, options?: any): Promise<void>;
  destroy(): void;
  isInitialized(): boolean;
  
  // 图像加载方法
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
  removeFilter(filterType: string): Promise<void>;
  
  // 变换和选择
  setScale(scaleX: number, scaleY: number): Promise<void>;
  setPosition(x: number, y: number): Promise<void>;
  select(): void;
  deselect(): void;
  
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
  
  // 性能信息
  getPerformanceMetrics(): any;
}
```

### 2.2 扩展适配器接口

#### 2.2.1 文本编辑适配器 (TextEditingAdapter)

```typescript
interface TextEditingAdapter extends BaseImageEditorAdapter {
  addText(text: string, options?: any): Promise<string>; // 返回文本对象ID
  updateText(id: string, text: string, options?: any): Promise<void>;
  setTextStyle(id: string, style: any): Promise<void>;
  removeText(id: string): Promise<void>;
  getTexts(): Promise<Array<any>>;
}
```

#### 2.2.2 形状编辑适配器 (ShapeEditingAdapter)

```typescript
interface ShapeEditingAdapter extends BaseImageEditorAdapter {
  addShape(shapeType: string, options?: any): Promise<string>; // 返回形状对象ID
  updateShape(id: string, options?: any): Promise<void>;
  setShapeStyle(id: string, style: any): Promise<void>;
  removeShape(id: string): Promise<void>;
  getShapes(): Promise<Array<any>>;
}
```

#### 2.2.3 高级裁剪适配器 (AdvancedCroppingAdapter)

```typescript
interface AdvancedCroppingAdapter extends BaseImageEditorAdapter {
  startCropping(options?: any): Promise<void>;
  setCropAspectRatio(ratio: number | null): void;
  getCropData(): any;
  applyCrop(): Promise<void>;
  cancelCrop(): void;
}
```

#### 2.2.4 动画适配器 (AnimationAdapter)

```typescript
interface AnimationAdapter extends BaseImageEditorAdapter {
  animate(properties: any, duration: number, easing?: string): Promise<void>;
  stopAnimation(): void;
  createAnimation(config: any): any;
  playAnimation(animation: any): Promise<void>;
}
```

## 3. 具体库适配器实现

### 3.1 Fabric.js 适配器

```typescript
class FabricAdapter implements BaseImageEditorAdapter, TextEditingAdapter, ShapeEditingAdapter {
  private canvas: fabric.Canvas;
  private currentImage: fabric.Image | null = null;
  private states: Map<string, string> = new Map();
  
  async initialize(container: HTMLElement, options?: any): Promise<void> {
    // 创建Fabric.js Canvas实例
    const canvasElement = document.createElement('canvas');
    container.appendChild(canvasElement);
    this.canvas = new fabric.Canvas(canvasElement, options);
    
    // 设置Canvas尺寸
    this.canvas.setWidth(container.clientWidth);
    this.canvas.setHeight(container.clientHeight);
    
    // 初始化事件监听
    this.setupEventListeners();
    
    return Promise.resolve();
  }
  
  // 实现其他接口方法...
}
```

### 3.2 Konva.js 适配器

```typescript
class KonvaAdapter implements BaseImageEditorAdapter, AnimationAdapter {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private currentImage: Konva.Image | null = null;
  private states: Map<string, string> = new Map();
  
  async initialize(container: HTMLElement, options?: any): Promise<void> {
    // 创建Konva.js Stage实例
    this.stage = new Konva.Stage({
      container: container,
      width: container.clientWidth,
      height: container.clientHeight,
      ...options
    });
    
    // 创建图层
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    
    // 初始化事件监听
    this.setupEventListeners();
    
    return Promise.resolve();
  }
  
  // 实现其他接口方法...
}
```

### 3.3 Cropper.js 适配器

```typescript
class CropperAdapter implements BaseImageEditorAdapter, AdvancedCroppingAdapter {
  private container: HTMLElement;
  private imageElement: HTMLImageElement;
  private cropper: Cropper;
  private originalImageSrc: string;
  
  async initialize(container: HTMLElement, options?: any): Promise<void> {
    this.container = container;
    
    // 创建图像元素
    this.imageElement = document.createElement('img');
    this.container.appendChild(this.imageElement);
    
    // 设置默认选项
    const defaultOptions = {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      modal: true,
      guides: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false
    };
    
    // 合并选项
    const cropperOptions = { ...defaultOptions, ...options };
    
    // 初始化Cropper实例（延迟到loadImage）
    
    return Promise.resolve();
  }
  
  // 实现其他接口方法...
}
```

### 3.4 Jimp 适配器

```typescript
class JimpAdapter implements BaseImageEditorAdapter {
  private jimpInstance: any; // Jimp实例
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private states: Map<string, any> = new Map();
  
  async initialize(container: HTMLElement, options?: any): Promise<void> {
    this.container = container;
    
    // 创建Canvas用于显示
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // 设置Canvas尺寸
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    return Promise.resolve();
  }
  
  // 实现其他接口方法...
}
```

### 3.5 TUI Image Editor 适配器

```typescript
class TuiImageEditorAdapter implements BaseImageEditorAdapter, TextEditingAdapter, ShapeEditingAdapter {
  private editor: any; // TUI Image Editor实例
  private container: HTMLElement;
  private states: Map<string, string> = new Map();
  
  async initialize(container: HTMLElement, options?: any): Promise<void> {
    this.container = container;
    
    // 设置默认选项
    const defaultOptions = {
      includeUI: {
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'filter'],
        initMenu: 'filter',
        uiSize: {
          width: '100%',
          height: '100%'
        },
        menuBarPosition: 'bottom'
      },
      cssMaxWidth: container.clientWidth,
      cssMaxHeight: container.clientHeight,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      }
    };
    
    // 合并选项
    const editorOptions = { ...defaultOptions, ...options };
    
    // 初始化TUI Image Editor
    this.editor = new ImageEditor(container, editorOptions);
    
    // 初始化事件监听
    this.setupEventListeners();
    
    return Promise.resolve();
  }
  
  // 实现其他接口方法...
}
```

## 4. 适配器工厂和管理器

### 4.1 适配器工厂 (AdapterFactory)

```typescript
class AdapterFactory {
  static createAdapter(type: string, container: HTMLElement, options?: any): Promise<BaseImageEditorAdapter> {
    switch (type.toLowerCase()) {
      case 'fabric':
        return this.createFabricAdapter(container, options);
      case 'konva':
        return this.createKonvaAdapter(container, options);
      case 'cropper':
        return this.createCropperAdapter(container, options);
      case 'jimp':
        return this.createJimpAdapter(container, options);
      case 'tui':
        return this.createTuiAdapter(container, options);
      default:
        throw new Error(`Unsupported adapter type: ${type}`);
    }
  }
  
  private static async createFabricAdapter(container: HTMLElement, options?: any): Promise<FabricAdapter> {
    // 动态加载Fabric.js
    if (!window.fabric) {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js');
    }
    
    const adapter = new FabricAdapter();
    await adapter.initialize(container, options);
    return adapter;
  }
  
  // 其他适配器创建方法...
  
  private static loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }
}
```

### 4.2 适配器管理器 (AdapterManager)

```typescript
class AdapterManager {
  private adapters: Map<string, BaseImageEditorAdapter> = new Map();
  private activeAdapter: BaseImageEditorAdapter | null = null;
  private container: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  async getAdapter(type: string, options?: any): Promise<BaseImageEditorAdapter> {
    // 检查是否已有此类型的适配器
    if (this.adapters.has(type)) {
      return this.adapters.get(type);
    }
    
    // 创建新适配器
    const adapter = await AdapterFactory.createAdapter(type, this.container, options);
    this.adapters.set(type, adapter);
    return adapter;
  }
  
  async setActiveAdapter(type: string, options?: any): Promise<BaseImageEditorAdapter> {
    const adapter = await this.getAdapter(type, options);
    this.activeAdapter = adapter;
    return adapter;
  }
  
  getActiveAdapter(): BaseImageEditorAdapter | null {
    return this.activeAdapter;
  }
  
  async transferState(fromType: string, toType: string): Promise<void> {
    const sourceAdapter = await this.getAdapter(fromType);
    const targetAdapter = await this.getAdapter(toType);
    
    // 获取源适配器的图像数据
    const imageData = sourceAdapter.getImageData();
    if (!imageData) {
      throw new Error('No image data available to transfer');
    }
    
    // 将图像数据应用到目标适配器
    // 这里需要实现具体的状态转换逻辑
    // ...
    
    return Promise.resolve();
  }
  
  async destroyAdapter(type: string): Promise<void> {
    if (this.adapters.has(type)) {
      const adapter = this.adapters.get(type);
      adapter.destroy();
      this.adapters.delete(type);
    }
  }
  
  async destroyAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      adapter.destroy();
    }
    this.adapters.clear();
    this.activeAdapter = null;
  }
}
```

## 5. 智能库选择器

```typescript
class SmartLibrarySelector {
  private adapterManager: AdapterManager;
  
  constructor(adapterManager: AdapterManager) {
    this.adapterManager = adapterManager;
  }
  
  async selectBestLibraryForOperation(operation: string, imageInfo?: any): Promise<BaseImageEditorAdapter> {
    // 根据操作类型和图像信息选择最佳库
    switch (operation) {
      case 'crop':
        return this.adapterManager.getAdapter('cropper');
        
      case 'rotate':
      case 'scale':
      case 'animation':
        return this.adapterManager.getAdapter('konva');
        
      case 'filter':
      case 'text':
      case 'shape':
        return this.adapterManager.getAdapter('fabric');
        
      case 'batchProcessing':
        return this.adapterManager.getAdapter('jimp');
        
      case 'fullUI':
        return this.adapterManager.getAdapter('tui');
        
      default:
        // 默认使用Fabric.js作为通用库
        return this.adapterManager.getAdapter('fabric');
    }
  }
  
  // 根据图像大小和复杂度选择最佳库
  async selectBestLibraryForImage(imageInfo: any): Promise<BaseImageEditorAdapter> {
    const { width, height, fileSize, hasTransparency } = imageInfo;
    
    // 大图像使用性能更好的库
    if (width * height > 4000 * 3000 || fileSize > 5 * 1024 * 1024) {
      return this.adapterManager.getAdapter('konva');
    }
    
    // 带透明度的图像
    if (hasTransparency) {
      return this.adapterManager.getAdapter('fabric');
    }
    
    // 默认使用功能最全面的库
    return this.adapterManager.getAdapter('fabric');
  }
}
```

## 6. 使用示例

```typescript
// 创建统一图像编辑器
async function createUnifiedImageEditor(container: HTMLElement) {
  // 创建适配器管理器
  const adapterManager = new AdapterManager(container);
  
  // 创建智能库选择器
  const librarySelector = new SmartLibrarySelector(adapterManager);
  
  // 初始化默认适配器
  await adapterManager.setActiveAdapter('fabric');
  
  // 加载图像
  async function loadImage(source: string | File) {
    const adapter = adapterManager.getActiveAdapter();
    await adapter.loadImage(source);
  }
  
  // 执行编辑操作
  async function performOperation(operation: string, params: any) {
    // 选择最佳库
    const bestAdapter = await librarySelector.selectBestLibraryForOperation(operation);
    
    // 如果需要切换适配器
    if (bestAdapter !== adapterManager.getActiveAdapter()) {
      // 转移状态
      await adapterManager.transferState(
        adapterManager.getActiveAdapter().constructor.name.toLowerCase(),
        bestAdapter.constructor.name.toLowerCase()
      );
      
      // 设置新的活动适配器
      await adapterManager.setActiveAdapter(bestAdapter.constructor.name.toLowerCase());
    }
    
    // 执行操作
    const adapter = adapterManager.getActiveAdapter();
    switch (operation) {
      case 'crop':
        return adapter.crop(params.x, params.y, params.width, params.height);
      case 'rotate':
        return adapter.rotate(params.angle);
      case 'brightness':
        return adapter.setBrightness(params.value);
      case 'contrast':
        return adapter.setContrast(params.value);
      // 其他操作...
    }
  }
  
  // 导出结果
  async function exportImage(type = 'image/png', quality = 0.9) {
    const adapter = adapterManager.getActiveAdapter();
    return adapter.toDataURL(type, quality);
  }
  
  // 返回公共API
  return {
    loadImage,
    performOperation,
    exportImage,
    getAdapterManager: () => adapterManager
  };
}
```

## 7. 下一步实现计划

1. **完善适配器接口** - 添加更多专业功能和细节
2. **实现具体适配器** - 完成每个库的适配器实现
3. **开发状态转换系统** - 实现不同库之间的状态无缝转换
4. **创建统一UI层** - 设计与适配器系统配合的UI组件
5. **性能优化** - 实现懒加载和资源管理
6. **测试和文档** - 编写单元测试和使用文档
