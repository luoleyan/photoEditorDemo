/**
 * Jest 测试设置文件
 */

// 设置全局测试环境
import { config } from "@vue/test-utils";

// 配置 Vue Test Utils (Vue 2 版本)
config.mocks = {
  $t: (msg) => msg, // 模拟国际化
  $route: {
    path: "/",
    params: {},
    query: {},
  },
  $router: {
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  },
};

// 增强DOM元素模拟
Object.defineProperty(HTMLElement.prototype, "setAttribute", {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "getAttribute", {
  value: jest.fn(() => ""),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "removeAttribute", {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "classList", {
  value: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
    toggle: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "style", {
  value: {},
  writable: true,
});

// 模拟 Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  strokeStyle: "#000000",
  fillStyle: "#000000",
  lineWidth: 1,
  globalAlpha: 1,
  font: "10px sans-serif",
  textAlign: "start",
  textBaseline: "alphabetic",
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "low",
  filter: "none",
}));

HTMLCanvasElement.prototype.toDataURL = jest.fn(
  () => "data:image/png;base64,mockdata"
);
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob(["mock"], { type: "image/png" }));
});

// 模拟 Image 对象
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = "";
    this.width = 100;
    this.height = 100;
  }

  set src(value) {
    this._src = value;
    // 异步触发 onload
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }
};

// 模拟 FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.result = "data:image/png;base64,mockdata";
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }

  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
};

// 模拟 URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();

// 模拟 Blob
global.Blob = class {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || "";
    this.size = parts.reduce((size, part) => size + part.length, 0);
  }
};

// 模拟 File
global.File = class extends global.Blob {
  constructor(parts, name, options) {
    super(parts, options);
    this.name = name;
    this.lastModified = Date.now();
  }
};

// 模拟 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 模拟 requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// 模拟 ResizeObserver
global.ResizeObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 模拟 IntersectionObserver
global.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 模拟 MutationObserver
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// 模拟 Web APIs
global.navigator = {
  ...global.navigator,
  hardwareConcurrency: 4,
  deviceMemory: 4,
  connection: {
    effectiveType: "4g",
    addEventListener: jest.fn(),
  },
  getBattery: jest.fn(() =>
    Promise.resolve({
      level: 0.8,
      addEventListener: jest.fn(),
    })
  ),
  vibrate: jest.fn(),
};

// 模拟 performance API
global.performance = {
  ...global.performance,
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  },
};

// 模拟 Worker
global.Worker = class MockWorker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.isAvailable = true;
  }

  postMessage(data) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            success: true,
            data: data,
          },
        });
      }
    }, 0);
  }

  terminate() {
    this.isAvailable = false;
  }
};

// 模拟 ImageData
global.ImageData = class MockImageData {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
};

// 模拟 console 方法（避免测试时的日志输出）
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 在测试结束后恢复 console
afterAll(() => {
  global.console = originalConsole;
});

// 设置默认超时
jest.setTimeout(10000);

// 全局错误处理
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// 清理函数
afterEach(() => {
  // 清理 DOM
  document.body.innerHTML = "";

  // 清理 localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // 清理 sessionStorage mock
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// 导出测试工具函数
export const createMockImage = (width = 100, height = 100) => {
  const img = new Image();
  img.width = width;
  img.height = height;
  return img;
};

export const createMockCanvas = (width = 800, height = 600) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const createMockFile = (
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024
) => {
  return new File(["mock file content"], name, { type, size });
};

export const waitForNextTick = () => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

export const waitForAnimation = () => {
  return new Promise((resolve) => setTimeout(resolve, 20));
};
