/**
 * 测试工具函数
 */
import { createLocalVue } from "@vue/test-utils";

// 创建本地Vue实例
export const localVue = createLocalVue();

// 通用的Vue组件stubs
export const commonStubs = {
  "color-picker": {
    name: "ColorPicker",
    props: ["value", "disabled"],
    template:
      '<div class="mock-color-picker" @click="$emit(\'change\', value)"></div>',
  },
  "filter-panel": {
    name: "FilterPanel",
    props: ["availableFilters", "activeFilterId"],
    template: '<div class="mock-filter-panel"></div>',
  },
  "layer-panel": {
    name: "LayerPanel",
    props: ["layers", "selectedLayerIds"],
    template: '<div class="mock-layer-panel"></div>',
  },
  "export-panel": {
    name: "ExportPanel",
    props: ["sourceCanvas", "showHeader"],
    template: '<div class="mock-export-panel"></div>',
  },
  "error-notification": {
    name: "ErrorNotification",
    props: ["show", "error"],
    template: '<div class="mock-error-notification"></div>',
  },
  "user-guidance": {
    name: "UserGuidance",
    props: ["show", "guidance"],
    template: '<div class="mock-user-guidance"></div>',
  },
  "mobile-performance-monitor": {
    name: "MobilePerformanceMonitor",
    template: '<div class="mock-mobile-performance-monitor"></div>',
  },
};

// 通用的Vue组件挂载选项
export const defaultMountOptions = {
  localVue,
  stubs: commonStubs,
  attachTo: document.body,
};

// 创建Mock适配器
export function createMockAdapter(type = "fabric") {
  return {
    adapterType: type,
    isInitialized: true,
    container: null,
    options: {},
    eventListeners: new Map(),

    // 基础方法
    async initialize(container, options) {
      this.container = container;
      this.options = options;
      this.isInitialized = true;
    },

    destroy() {
      this.isInitialized = false;
      this.eventListeners.clear();
    },

    getIsInitialized() {
      return this.isInitialized;
    },

    // 事件系统
    on(eventName, callback) {
      if (!this.eventListeners.has(eventName)) {
        this.eventListeners.set(eventName, []);
      }
      this.eventListeners.get(eventName).push(callback);
    },

    off(eventName, callback) {
      if (this.eventListeners.has(eventName)) {
        const callbacks = this.eventListeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    },

    emit(eventName, data) {
      if (this.eventListeners.has(eventName)) {
        this.eventListeners
          .get(eventName)
          .forEach((callback) => callback(data));
      }
    },

    // 图像操作方法
    loadImage: jest.fn().mockResolvedValue(true),
    exportImage: jest.fn().mockResolvedValue("data:image/png;base64,mock"),
    applyFilter: jest.fn().mockResolvedValue(true),
    setBrightness: jest.fn().mockResolvedValue(true),
    setContrast: jest.fn().mockResolvedValue(true),
    setSaturation: jest.fn().mockResolvedValue(true),
    crop: jest.fn().mockResolvedValue(true),
    resize: jest.fn().mockResolvedValue(true),
    rotate: jest.fn().mockResolvedValue(true),
    flip: jest.fn().mockResolvedValue(true),

    // 绘制方法
    enableDrawingMode: jest.fn(),
    disableDrawingMode: jest.fn(),
    setBrushColor: jest.fn(),
    setBrushSize: jest.fn(),
    setBrushOpacity: jest.fn(),
    clearCanvas: jest.fn(),
    addStroke: jest.fn(),
    removeStroke: jest.fn(),
    updateStroke: jest.fn(),

    // 文本方法
    addText: jest.fn(),
    updateText: jest.fn(),
    removeText: jest.fn(),
    setTextStyle: jest.fn(),

    // 形状方法
    addShape: jest.fn(),
    updateShape: jest.fn(),
    removeShape: jest.fn(),
    setShapeStyle: jest.fn(),

    // 状态管理
    getState: jest.fn().mockReturnValue({}),
    setState: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn().mockReturnValue(false),
    canRedo: jest.fn().mockReturnValue(false),

    // 性能指标
    getPerformanceMetrics() {
      return {
        operationCount: 0,
        renderTime: 0,
        memoryUsage: 0,
      };
    },

    // 兼容性检查
    checkCompatibility() {
      return {
        isSupported: true,
        supportedFeatures: ["drawing", "text", "shapes", "filters"],
        unsupportedFeatures: [],
      };
    },
  };
}

// 创建Mock状态管理器
export function createMockStateManager() {
  return {
    currentState: {},
    history: [],
    historyIndex: -1,

    getState: jest.fn().mockReturnValue({}),
    setState: jest.fn(),
    updateState: jest.fn(),
    resetState: jest.fn(),

    undo: jest.fn(),
    redo: jest.fn(),
    canUndo: jest.fn().mockReturnValue(false),
    canRedo: jest.fn().mockReturnValue(false),

    addHistoryEntry: jest.fn(),
    clearHistory: jest.fn(),

    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
}

// 创建Mock错误处理器
export function createMockErrorHandler() {
  return {
    handleError: jest.fn(),
    showError: jest.fn(),
    hideError: jest.fn(),
    getErrorHistory: jest.fn().mockReturnValue([]),
    clearErrorHistory: jest.fn(),

    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
}

// 创建Mock用户指导
export function createMockUserGuidance() {
  return {
    showGuidance: jest.fn(),
    hideGuidance: jest.fn(),
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    skipGuidance: jest.fn(),

    getCurrentStep: jest.fn().mockReturnValue(null),
    getTotalSteps: jest.fn().mockReturnValue(0),
    isGuidanceActive: jest.fn().mockReturnValue(false),

    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
}

// 等待Vue的下一个tick
export function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// 等待动画完成
export function waitForAnimation(duration = 20) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

// 模拟文件上传
export function createMockFile(
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024
) {
  return new File(["mock file content"], name, { type, size });
}

// 模拟图像对象
export function createMockImage(width = 100, height = 100) {
  const img = new Image();
  img.width = width;
  img.height = height;
  img.naturalWidth = width;
  img.naturalHeight = height;
  return img;
}

// 模拟Canvas对象
export function createMockCanvas(width = 800, height = 600) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// 模拟ImageData对象
export function createMockImageData(width = 100, height = 100) {
  return new ImageData(width, height);
}

// 触发DOM事件
export function triggerEvent(element, eventType, eventData = {}) {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
}

// 模拟拖拽事件
export function mockDragEvent(element, eventType, clientX = 0, clientY = 0) {
  const event = new MouseEvent(eventType, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });
  element.dispatchEvent(event);
}

// 模拟键盘事件
export function mockKeyboardEvent(element, eventType, key, options = {}) {
  const event = new KeyboardEvent(eventType, {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  });
  element.dispatchEvent(event);
}
