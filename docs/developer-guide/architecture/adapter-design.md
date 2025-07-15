# 适配器设计

本文档详细介绍了 PhotoEditor Demo 项目中多库适配器架构的设计理念和实现方案。

> 本文档基于原始的 [IMAGE_EDITOR_ADAPTER_DESIGN.md](../../../IMAGE_EDITOR_ADAPTER_DESIGN.md) 整理而来。

## 🎯 设计目标

创建一个统一的适配器接口系统，实现以下目标：

1. **抽象底层差异** - 屏蔽各图像编辑库的API差异，提供一致的接口
2. **智能库选择** - 根据操作类型自动选择最适合的库
3. **无缝切换** - 在不同库之间平滑切换，保持图像状态一致
4. **性能优化** - 按需加载库，减少初始加载时间和内存占用
5. **扩展性** - 支持轻松添加新的图像编辑库适配器

## 🏗️ 核心适配器接口

### 基础适配器接口 (BaseImageEditorAdapter)

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

### 扩展适配器接口

#### 文本编辑适配器 (TextEditingAdapter)

```typescript
interface TextEditingAdapter extends BaseImageEditorAdapter {
  addText(text: string, options?: any): Promise<string>; // 返回文本对象ID
  updateText(id: string, text: string, options?: any): Promise<void>;
  setTextStyle(id: string, style: any): Promise<void>;
  removeText(id: string): Promise<void>;
  getTexts(): Promise<Array<any>>;
}
```

#### 形状编辑适配器 (ShapeEditingAdapter)

```typescript
interface ShapeEditingAdapter extends BaseImageEditorAdapter {
  addShape(shapeType: string, options?: any): Promise<string>; // 返回形状对象ID
  updateShape(id: string, options?: any): Promise<void>;
  setShapeStyle(id: string, style: any): Promise<void>;
  removeShape(id: string): Promise<void>;
  getShapes(): Promise<Array<any>>;
}
```

#### 高级裁剪适配器 (AdvancedCroppingAdapter)

```typescript
interface AdvancedCroppingAdapter extends BaseImageEditorAdapter {
  startCropping(options?: any): Promise<void>;
  setCropAspectRatio(ratio: number | null): void;
  getCropData(): any;
  applyCrop(): Promise<void>;
  cancelCrop(): void;
}
```

## 🔧 具体适配器实现

### Konva.js 适配器

```javascript
class KonvaAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.stage = null;
    this.layer = null;
    this.imageNode = null;
  }

  async initialize(container, options = {}) {
    this.stage = new Konva.Stage({
      container: container,
      width: options.width || 800,
      height: options.height || 600
    });
    
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    
    this.isReady = true;
  }

  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.onload = () => {
        this.imageNode = new Konva.Image({
          image: imageObj,
          x: 0,
          y: 0
        });
        this.layer.add(this.imageNode);
        this.layer.draw();
        resolve();
      };
      imageObj.onerror = reject;
      imageObj.src = source;
    });
  }

  async rotate(angle) {
    if (this.imageNode) {
      this.imageNode.rotation(angle);
      this.layer.draw();
    }
  }

  async setBrightness(value) {
    if (this.imageNode) {
      this.imageNode.filters([Konva.Filters.Brighten]);
      this.imageNode.brightness(value);
      this.imageNode.cache();
      this.layer.draw();
    }
  }
}
```

### Fabric.js 适配器

```javascript
class FabricAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.canvas = null;
    this.imageObject = null;
  }

  async initialize(container, options = {}) {
    const canvasElement = document.createElement('canvas');
    container.appendChild(canvasElement);
    
    this.canvas = new fabric.Canvas(canvasElement, {
      width: options.width || 800,
      height: options.height || 600
    });
    
    this.isReady = true;
  }

  async loadImage(source) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(source, (img) => {
        this.imageObject = img;
        this.canvas.add(img);
        this.canvas.renderAll();
        resolve();
      }, { crossOrigin: 'anonymous' });
    });
  }

  async rotate(angle) {
    if (this.imageObject) {
      this.imageObject.rotate(angle);
      this.canvas.renderAll();
    }
  }

  async setBrightness(value) {
    if (this.imageObject) {
      const filter = new fabric.Image.filters.Brightness({
        brightness: value
      });
      this.imageObject.filters.push(filter);
      this.imageObject.applyFilters();
      this.canvas.renderAll();
    }
  }
}
```

## 🎛️ 适配器管理器

### AdapterManager 类

```javascript
class AdapterManager {
  constructor() {
    this.adapters = new Map();
    this.currentAdapter = null;
    this.adapterFactory = new AdapterFactory();
  }

  async switchAdapter(libraryName, container, options) {
    // 清理当前适配器
    if (this.currentAdapter) {
      this.currentAdapter.destroy();
    }

    // 创建新适配器
    const adapter = await this.adapterFactory.createAdapter(libraryName);
    await adapter.initialize(container, options);
    
    this.currentAdapter = adapter;
    this.adapters.set(libraryName, adapter);
    
    return adapter;
  }

  getCurrentAdapter() {
    return this.currentAdapter;
  }

  async transferState(fromAdapter, toAdapter) {
    const state = fromAdapter.saveState();
    await toAdapter.restoreState(state);
  }
}
```

### AdapterFactory 类

```javascript
class AdapterFactory {
  constructor() {
    this.adapterClasses = new Map([
      ['konva', KonvaAdapter],
      ['fabric', FabricAdapter],
      ['cropper', CropperAdapter],
      ['tui', TUIAdapter],
      ['jimp', JimpAdapter]
    ]);
  }

  async createAdapter(libraryName) {
    const AdapterClass = this.adapterClasses.get(libraryName);
    if (!AdapterClass) {
      throw new Error(`Unknown adapter: ${libraryName}`);
    }

    // 动态加载库（如果需要）
    await this.loadLibrary(libraryName);
    
    return new AdapterClass();
  }

  async loadLibrary(libraryName) {
    // 实现动态加载逻辑
    switch (libraryName) {
      case 'konva':
        if (!window.Konva) {
          await import('konva');
        }
        break;
      case 'fabric':
        if (!window.fabric) {
          await import('fabric');
        }
        break;
      // ... 其他库的加载逻辑
    }
  }

  registerAdapter(name, adapterClass) {
    this.adapterClasses.set(name, adapterClass);
  }
}
```

## 🔄 状态转换系统

### StateConverter 类

```javascript
class StateConverter {
  constructor() {
    this.converters = new Map();
    this.setupConverters();
  }

  setupConverters() {
    // Konva 到 Fabric 的转换
    this.converters.set('konva->fabric', (konvaState) => {
      return {
        objects: konvaState.children.map(child => ({
          type: 'image',
          left: child.x,
          top: child.y,
          angle: child.rotation,
          scaleX: child.scaleX,
          scaleY: child.scaleY
        }))
      };
    });

    // Fabric 到 Konva 的转换
    this.converters.set('fabric->konva', (fabricState) => {
      return {
        children: fabricState.objects.map(obj => ({
          className: 'Image',
          x: obj.left,
          y: obj.top,
          rotation: obj.angle,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY
        }))
      };
    });
  }

  convert(fromLibrary, toLibrary, state) {
    const converterKey = `${fromLibrary}->${toLibrary}`;
    const converter = this.converters.get(converterKey);
    
    if (!converter) {
      throw new Error(`No converter found for ${converterKey}`);
    }
    
    return converter(state);
  }
}
```

## 🚀 性能优化策略

### 懒加载实现

```javascript
class LazyAdapterLoader {
  constructor() {
    this.loadedLibraries = new Set();
    this.loadingPromises = new Map();
  }

  async loadAdapter(libraryName) {
    if (this.loadedLibraries.has(libraryName)) {
      return;
    }

    if (this.loadingPromises.has(libraryName)) {
      return this.loadingPromises.get(libraryName);
    }

    const loadPromise = this.doLoad(libraryName);
    this.loadingPromises.set(libraryName, loadPromise);

    try {
      await loadPromise;
      this.loadedLibraries.add(libraryName);
    } finally {
      this.loadingPromises.delete(libraryName);
    }
  }

  async doLoad(libraryName) {
    switch (libraryName) {
      case 'konva':
        return import(/* webpackChunkName: "konva" */ 'konva');
      case 'fabric':
        return import(/* webpackChunkName: "fabric" */ 'fabric');
      // ... 其他库
    }
  }
}
```

## 📊 架构优势

### 1. 统一接口
- 所有图像编辑库通过相同的API访问
- 简化了上层组件的实现
- 降低了学习成本

### 2. 灵活切换
- 运行时动态切换编辑库
- 保持编辑状态的一致性
- 根据需求选择最优库

### 3. 性能优化
- 按需加载减少初始包大小
- 智能库选择优化操作性能
- 资源复用减少内存占用

### 4. 易于扩展
- 新增库只需实现适配器接口
- 不影响现有代码
- 支持插件化扩展

---

*想了解状态管理系统？查看 [状态管理](state-management.md) 文档。*
