# 图像编辑器统一状态管理系统设计

> **📍 文档迁移提示**: 本文档已从根目录 `IMAGE_EDITOR_STATE_MANAGEMENT.md` 迁移到 `docs/developer-guide/architecture/state-management.md`。

## 1. 设计目标

创建一个强大的状态管理系统，实现以下目标：

1. **统一状态表示** - 使用标准格式表示图像编辑状态，独立于具体库实现
2. **状态转换** - 在不同图像编辑库之间无缝转换状态
3. **历史记录** - 支持撤销/重做功能，记录编辑历史
4. **状态持久化** - 支持保存和恢复编辑状态
5. **状态分离** - 将UI状态与图像编辑状态分离
6. **性能优化** - 高效处理大型状态对象和历史记录

## 2. 核心状态模型

### 2.1 图像编辑状态 (ImageEditorState)

```typescript
interface ImageEditorState {
  // 基本信息
  id: string;                    // 状态唯一标识符
  timestamp: number;             // 状态创建时间戳
  libraryType: string;           // 创建此状态的库类型
  
  // 图像基本信息
  imageData: {
    originalSrc: string;         // 原始图像源
    currentSrc?: string;         // 当前图像源（可能是处理后的）
    width: number;               // 当前宽度
    height: number;              // 当前高度
    originalWidth: number;       // 原始宽度
    originalHeight: number;      // 原始高度
    fileType: string;            // 文件类型 (jpg, png, etc.)
    hasAlpha: boolean;           // 是否有透明通道
  };
  
  // 变换状态
  transform: {
    position: { x: number, y: number };  // 位置
    scale: { x: number, y: number };     // 缩放
    rotation: number;                    // 旋转角度（度）
    flipX: boolean;                      // 水平翻转
    flipY: boolean;                      // 垂直翻转
    cropData?: {                         // 裁剪数据
      x: number;
      y: number;
      width: number;
      height: number;
      aspectRatio?: number;
    };
  };
  
  // 滤镜和调整
  filters: Array<{
    type: string;                // 滤镜类型
    options: any;                // 滤镜参数
    enabled: boolean;            // 是否启用
  }>;
  
  // 对象状态（文本、形状等）
  objects: Array<{
    id: string;                  // 对象ID
    type: string;                // 对象类型 (text, rect, circle, etc.)
    properties: any;             // 对象属性
    position: { x: number, y: number };  // 位置
    scale: { x: number, y: number };     // 缩放
    rotation: number;            // 旋转角度
    zIndex: number;              // 层级
    visible: boolean;            // 是否可见
  }>;
  
  // 图层信息
  layers?: Array<{
    id: string;                  // 图层ID
    name: string;                // 图层名称
    visible: boolean;            // 是否可见
    opacity: number;             // 不透明度
    objectIds: string[];         // 图层包含的对象ID
  }>;
  
  // 库特定数据（用于存储特定库的额外状态）
  librarySpecificData?: {
    [key: string]: any;
  };
}
```

### 2.2 编辑历史记录 (EditHistory)

```typescript
interface EditHistoryEntry {
  id: string;                    // 历史记录ID
  timestamp: number;             // 时间戳
  stateId: string;               // 对应的状态ID
  actionType: string;            // 操作类型
  actionDescription: string;     // 操作描述
  actionParams?: any;            // 操作参数
  libraryType: string;           // 使用的库类型
}

class EditHistory {
  private entries: EditHistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxEntries: number = 50;  // 最大历史记录数
  
  // 添加历史记录
  addEntry(entry: EditHistoryEntry): void {
    // 如果当前不在最新状态，删除后面的历史
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }
    
    // 添加新记录
    this.entries.push(entry);
    this.currentIndex = this.entries.length - 1;
    
    // 限制历史记录数量
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
      this.currentIndex--;
    }
  }
  
  // 获取当前历史记录
  getCurrentEntry(): EditHistoryEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.entries.length) {
      return this.entries[this.currentIndex];
    }
    return null;
  }
  
  // 撤销
  undo(): EditHistoryEntry | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.entries[this.currentIndex];
    }
    return null;
  }
  
  // 重做
  redo(): EditHistoryEntry | null {
    if (this.currentIndex < this.entries.length - 1) {
      this.currentIndex++;
      return this.entries[this.currentIndex];
    }
    return null;
  }
  
  // 获取所有历史记录
  getAllEntries(): EditHistoryEntry[] {
    return [...this.entries];
  }
  
  // 清空历史记录
  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }
  
  // 序列化历史记录
  serialize(): string {
    return JSON.stringify({
      entries: this.entries,
      currentIndex: this.currentIndex
    });
  }
  
  // 反序列化历史记录
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.entries = parsed.entries;
    this.currentIndex = parsed.currentIndex;
  }
}
```

## 3. 状态管理器 (StateManager)

```typescript
class StateManager {
  private states: Map<string, ImageEditorState> = new Map();
  private history: EditHistory = new EditHistory();
  private currentStateId: string | null = null;
  private stateChangeCallbacks: Function[] = [];
  
  // 创建新状态
  createState(libraryType: string, imageData: any): string {
    const id = this.generateUniqueId();
    const timestamp = Date.now();
    
    const newState: ImageEditorState = {
      id,
      timestamp,
      libraryType,
      imageData: {
        originalSrc: imageData.src,
        width: imageData.width,
        height: imageData.height,
        originalWidth: imageData.width,
        originalHeight: imageData.height,
        fileType: this.getFileTypeFromSrc(imageData.src),
        hasAlpha: imageData.hasAlpha || false
      },
      transform: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        flipX: false,
        flipY: false
      },
      filters: [],
      objects: []
    };
    
    this.states.set(id, newState);
    this.currentStateId = id;
    
    // 添加到历史记录
    this.history.addEntry({
      id: this.generateUniqueId(),
      timestamp,
      stateId: id,
      actionType: 'create',
      actionDescription: 'Initial state',
      libraryType
    });
    
    // 触发状态变更回调
    this.notifyStateChange();
    
    return id;
  }
  
  // 更新状态
  updateState(stateUpdate: Partial<ImageEditorState>, actionType: string, actionDescription: string): string {
    if (!this.currentStateId) {
      throw new Error('No current state to update');
    }
    
    const currentState = this.getState(this.currentStateId);
    if (!currentState) {
      throw new Error(`Current state not found: ${this.currentStateId}`);
    }
    
    // 创建新状态ID
    const newId = this.generateUniqueId();
    const timestamp = Date.now();
    
    // 深度合并状态
    const newState = this.deepMerge({}, currentState, stateUpdate) as ImageEditorState;
    newState.id = newId;
    newState.timestamp = timestamp;
    
    // 保存新状态
    this.states.set(newId, newState);
    this.currentStateId = newId;
    
    // 添加到历史记录
    this.history.addEntry({
      id: this.generateUniqueId(),
      timestamp,
      stateId: newId,
      actionType,
      actionDescription,
      actionParams: stateUpdate,
      libraryType: newState.libraryType
    });
    
    // 触发状态变更回调
    this.notifyStateChange();
    
    return newId;
  }
  
  // 获取状态
  getState(id: string): ImageEditorState | null {
    return this.states.get(id) || null;
  }
  
  // 获取当前状态
  getCurrentState(): ImageEditorState | null {
    if (!this.currentStateId) return null;
    return this.getState(this.currentStateId);
  }
  
  // 撤销操作
  undo(): ImageEditorState | null {
    const previousEntry = this.history.undo();
    if (previousEntry) {
      this.currentStateId = previousEntry.stateId;
      this.notifyStateChange();
      return this.getState(previousEntry.stateId);
    }
    return null;
  }
  
  // 重做操作
  redo(): ImageEditorState | null {
    const nextEntry = this.history.redo();
    if (nextEntry) {
      this.currentStateId = nextEntry.stateId;
      this.notifyStateChange();
      return this.getState(nextEntry.stateId);
    }
    return null;
  }
  
  // 转换状态到特定库格式
  convertStateToLibraryFormat(stateId: string, targetLibrary: string): any {
    const state = this.getState(stateId);
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }
    
    // 根据目标库类型转换状态
    switch (targetLibrary) {
      case 'fabric':
        return this.convertStateToFabricFormat(state);
      case 'konva':
        return this.convertStateToKonvaFormat(state);
      case 'cropper':
        return this.convertStateToCropperFormat(state);
      case 'jimp':
        return this.convertStateToJimpFormat(state);
      case 'tui':
        return this.convertStateToTuiFormat(state);
      default:
        throw new Error(`Unsupported library type: ${targetLibrary}`);
    }
  }
  
  // 从特定库格式转换状态
  convertStateFromLibraryFormat(libraryState: any, libraryType: string): ImageEditorState {
    // 根据库类型转换状态
    switch (libraryType) {
      case 'fabric':
        return this.convertStateFromFabricFormat(libraryState);
      case 'konva':
        return this.convertStateFromKonvaFormat(libraryState);
      case 'cropper':
        return this.convertStateFromCropperFormat(libraryState);
      case 'jimp':
        return this.convertStateFromJimpFormat(libraryState);
      case 'tui':
        return this.convertStateFromTuiFormat(libraryState);
      default:
        throw new Error(`Unsupported library type: ${libraryType}`);
    }
  }
  
  // 序列化状态
  serializeState(stateId: string): string {
    const state = this.getState(stateId);
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }
    return JSON.stringify(state);
  }
  
  // 反序列化状态
  deserializeState(serializedState: string): string {
    const state = JSON.parse(serializedState) as ImageEditorState;
    this.states.set(state.id, state);
    return state.id;
  }
  
  // 注册状态变更回调
  onStateChange(callback: Function): void {
    this.stateChangeCallbacks.push(callback);
  }
  
  // 触发状态变更回调
  private notifyStateChange(): void {
    const currentState = this.getCurrentState();
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }
  
  // 生成唯一ID
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
  
  // 从源URL获取文件类型
  private getFileTypeFromSrc(src: string): string {
    if (src.startsWith('data:')) {
      const match = src.match(/data:image\/([a-zA-Z0-9]+);/);
      return match ? match[1] : 'unknown';
    }
    
    const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    return match ? match[1] : 'unknown';
  }
  
  // 深度合并对象
  private deepMerge(target: any, ...sources: any[]): any {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }
  
  private isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  // 以下方法需要针对每个库实现具体的转换逻辑
  private convertStateToFabricFormat(state: ImageEditorState): any {
    // 实现Fabric.js特定的状态转换
    // ...
  }
  
  private convertStateFromFabricFormat(fabricState: any): ImageEditorState {
    // 实现从Fabric.js状态转换
    // ...
  }
  
  // 其他库的转换方法...
}
```

## 4. 状态转换器 (StateConverter)

```typescript
class StateConverter {
  // Fabric.js 状态转换
  static toFabricState(state: ImageEditorState): any {
    const fabricState: any = {
      version: '5.3.0',
      objects: []
    };
    
    // 转换图像对象
    if (state.imageData) {
      fabricState.objects.push({
        type: 'image',
        version: '5.3.0',
        originX: 'left',
        originY: 'top',
        left: state.transform.position.x,
        top: state.transform.position.y,
        width: state.imageData.width,
        height: state.imageData.height,
        scaleX: state.transform.scale.x,
        scaleY: state.transform.scale.y,
        angle: state.transform.rotation,
        flipX: state.transform.flipX,
        flipY: state.transform.flipY,
        src: state.imageData.currentSrc || state.imageData.originalSrc,
        filters: this.convertFiltersToFabric(state.filters)
      });
    }
    
    // 转换其他对象（文本、形状等）
    state.objects.forEach(obj => {
      switch (obj.type) {
        case 'text':
          fabricState.objects.push({
            type: 'text',
            version: '5.3.0',
            originX: 'left',
            originY: 'top',
            left: obj.position.x,
            top: obj.position.y,
            width: obj.properties.width,
            height: obj.properties.height,
            scaleX: obj.scale.x,
            scaleY: obj.scale.y,
            angle: obj.rotation,
            text: obj.properties.text,
            fontSize: obj.properties.fontSize,
            fontFamily: obj.properties.fontFamily,
            fill: obj.properties.fill,
            visible: obj.visible
          });
          break;
          
        case 'rect':
          fabricState.objects.push({
            type: 'rect',
            version: '5.3.0',
            originX: 'left',
            originY: 'top',
            left: obj.position.x,
            top: obj.position.y,
            width: obj.properties.width,
            height: obj.properties.height,
            scaleX: obj.scale.x,
            scaleY: obj.scale.y,
            angle: obj.rotation,
            fill: obj.properties.fill,
            stroke: obj.properties.stroke,
            strokeWidth: obj.properties.strokeWidth,
            visible: obj.visible
          });
          break;
          
        // 其他对象类型...
      }
    });
    
    return fabricState;
  }
  
  static fromFabricState(fabricState: any): ImageEditorState {
    const state: ImageEditorState = {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      libraryType: 'fabric',
      imageData: {
        originalSrc: '',
        width: 0,
        height: 0,
        originalWidth: 0,
        originalHeight: 0,
        fileType: 'unknown',
        hasAlpha: false
      },
      transform: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        flipX: false,
        flipY: false
      },
      filters: [],
      objects: []
    };
    
    // 处理对象
    fabricState.objects.forEach((obj: any) => {
      if (obj.type === 'image') {
        // 设置图像数据
        state.imageData = {
          originalSrc: obj.src,
          currentSrc: obj.src,
          width: obj.width,
          height: obj.height,
          originalWidth: obj.width,
          originalHeight: obj.height,
          fileType: this.getFileTypeFromSrc(obj.src),
          hasAlpha: false
        };
        
        // 设置变换
        state.transform = {
          position: { x: obj.left, y: obj.top },
          scale: { x: obj.scaleX, y: obj.scaleY },
          rotation: obj.angle,
          flipX: obj.flipX,
          flipY: obj.flipY
        };
        
        // 设置滤镜
        state.filters = this.convertFiltersFromFabric(obj.filters);
      } else {
        // 处理其他对象
        const stateObj: any = {
          id: this.generateUniqueId(),
          type: obj.type,
          position: { x: obj.left, y: obj.top },
          scale: { x: obj.scaleX, y: obj.scaleY },
          rotation: obj.angle,
          zIndex: fabricState.objects.indexOf(obj),
          visible: obj.visible !== false,
          properties: {}
        };
        
        // 根据对象类型设置特定属性
        switch (obj.type) {
          case 'text':
            stateObj.properties = {
              text: obj.text,
              fontSize: obj.fontSize,
              fontFamily: obj.fontFamily,
              fill: obj.fill,
              width: obj.width,
              height: obj.height
            };
            break;
            
          case 'rect':
            stateObj.properties = {
              width: obj.width,
              height: obj.height,
              fill: obj.fill,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth
            };
            break;
            
          // 其他对象类型...
        }
        
        state.objects.push(stateObj);
      }
    });
    
    return state;
  }
  
  // 其他库的转换方法...
  
  private static convertFiltersToFabric(filters: any[]): any[] {
    return filters.map(filter => {
      switch (filter.type) {
        case 'brightness':
          return {
            type: 'Brightness',
            brightness: filter.options.value
          };
        case 'contrast':
          return {
            type: 'Contrast',
            contrast: filter.options.value
          };
        // 其他滤镜类型...
        default:
          return null;
      }
    }).filter(Boolean);
  }
  
  private static convertFiltersFromFabric(fabricFilters: any[]): any[] {
    if (!fabricFilters) return [];
    
    return fabricFilters.map(filter => {
      if (filter.type === 'Brightness') {
        return {
          type: 'brightness',
          options: { value: filter.brightness },
          enabled: true
        };
      } else if (filter.type === 'Contrast') {
        return {
          type: 'contrast',
          options: { value: filter.contrast },
          enabled: true
        };
      }
      // 其他滤镜类型...
      return null;
    }).filter(Boolean);
  }
  
  private static getFileTypeFromSrc(src: string): string {
    if (src.startsWith('data:')) {
      const match = src.match(/data:image\/([a-zA-Z0-9]+);/);
      return match ? match[1] : 'unknown';
    }
    
    const match = src.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
    return match ? match[1] : 'unknown';
  }
  
  private static generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}
```

## 5. 使用示例

```typescript
// 创建状态管理器
const stateManager = new StateManager();

// 初始化状态
const imageData = {
  src: 'path/to/image.jpg',
  width: 800,
  height: 600,
  hasAlpha: false
};
const initialStateId = stateManager.createState('fabric', imageData);

// 监听状态变化
stateManager.onStateChange((state) => {
  console.log('State changed:', state);
  // 更新UI或执行其他操作
});

// 应用亮度滤镜
stateManager.updateState(
  {
    filters: [
      {
        type: 'brightness',
        options: { value: 0.2 },
        enabled: true
      }
    ]
  },
  'applyFilter',
  'Applied brightness filter'
);

// 旋转图像
stateManager.updateState(
  {
    transform: {
      rotation: 45
    }
  },
  'rotate',
  'Rotated image by 45 degrees'
);

// 撤销操作
const previousState = stateManager.undo();
console.log('Undid to state:', previousState);

// 重做操作
const nextState = stateManager.redo();
console.log('Redid to state:', nextState);

// 转换状态到Konva格式
const konvaState = stateManager.convertStateToLibraryFormat(
  stateManager.getCurrentState().id,
  'konva'
);

// 序列化当前状态
const serializedState = stateManager.serializeState(stateManager.getCurrentState().id);
console.log('Serialized state:', serializedState);

// 保存到本地存储
localStorage.setItem('savedImageEditorState', serializedState);

// 从本地存储恢复
const savedState = localStorage.getItem('savedImageEditorState');
if (savedState) {
  const restoredStateId = stateManager.deserializeState(savedState);
  console.log('Restored state:', stateManager.getState(restoredStateId));
}
```

## 6. 下一步实现计划

1. **完善状态转换器** - 实现所有库之间的状态转换
2. **优化性能** - 实现状态差异比较和增量更新
3. **添加压缩功能** - 减少序列化状态的大小
4. **实现状态验证** - 确保状态对象的完整性和有效性
5. **添加事件系统** - 提供更细粒度的状态变更通知
6. **集成适配器系统** - 与适配器接口无缝集成

这个状态管理系统将作为整个图像编辑器的核心，确保不同库之间的状态一致性和操作的可追溯性。
