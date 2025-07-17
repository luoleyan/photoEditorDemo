/**
 * MemoryManager 性能优化测试
 */
import MemoryManager from "@/utils/MemoryManager.js";

// Mock Web Worker
global.Worker = class MockWorker {
  constructor(url) {
    this.url = url;
    this.isAvailable = true;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(data) {
    // 模拟异步处理
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            success: true,
            data: data.imageData, // 简单返回原数据
          },
        });
      }
    }, 10);
  }

  terminate() {
    this.isAvailable = false;
  }
};

// Mock navigator
Object.defineProperty(navigator, "hardwareConcurrency", {
  writable: true,
  value: 4,
});

describe("MemoryManager Performance Optimization", () => {
  let memoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager({
      enableWebWorker: true,
      enableImageOptimization: true,
    });
  });

  afterEach(() => {
    if (memoryManager) {
      memoryManager.destroy();
    }
  });

  describe("Web Worker池管理", () => {
    test("应该正确初始化Web Worker池", () => {
      expect(memoryManager.workerPool.length).toBe(4);
      expect(memoryManager.maxWorkers).toBe(4);
    });

    test("应该正确获取可用的Worker", () => {
      const worker = memoryManager.getAvailableWorker();
      expect(worker).toBeTruthy();
      expect(worker.isAvailable).toBe(true);
    });

    test("应该正确释放Worker", () => {
      const worker = memoryManager.getAvailableWorker();
      worker.isAvailable = false;

      memoryManager.releaseWorker(worker);
      expect(worker.isAvailable).toBe(true);
    });

    test("应该在没有可用Worker时返回null", () => {
      // 标记所有Worker为不可用
      memoryManager.workerPool.forEach((worker) => {
        worker.isAvailable = false;
      });

      const worker = memoryManager.getAvailableWorker();
      expect(worker).toBeNull();
    });
  });

  describe("图像尺寸优化", () => {
    test("应该正确计算最优尺寸", () => {
      const result = memoryManager._calculateOptimalSize(
        8000,
        6000,
        4096,
        4096
      );

      expect(result.width).toBeLessThanOrEqual(4096);
      expect(result.height).toBeLessThanOrEqual(4096);
      expect(result.width / result.height).toBeCloseTo(8000 / 6000, 2);
    });

    test("应该保持小图像的原始尺寸", () => {
      const result = memoryManager._calculateOptimalSize(1000, 800, 4096, 4096);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(800);
    });

    test("应该正确处理极端宽高比", () => {
      const result = memoryManager._calculateOptimalSize(
        10000,
        100,
        4096,
        4096
      );

      expect(result.width).toBe(4096);
      expect(result.height).toBe(Math.round((4096 * 100) / 10000));
    });

    test("应该优化图像尺寸", async () => {
      // Mock canvas和image
      const mockImage = {
        width: 8000,
        height: 6000,
        naturalWidth: 8000,
        naturalHeight: 6000,
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: "",
          drawImage: jest.fn(),
        })),
      };

      global.document.createElement = jest.fn(() => mockCanvas);

      const result = await memoryManager.optimizeImageSize(mockImage, {
        maxWidth: 4096,
        maxHeight: 4096,
      });

      expect(result).toBe(mockCanvas);
      expect(mockCanvas.width).toBeLessThanOrEqual(4096);
      expect(mockCanvas.height).toBeLessThanOrEqual(4096);
    });
  });

  describe("性能指标记录", () => {
    test("应该正确记录性能指标", () => {
      memoryManager.recordPerformanceMetric("renderTime", 16.7);
      memoryManager.recordPerformanceMetric("renderTime", 33.3);
      memoryManager.recordPerformanceMetric("memoryUsage", 100 * 1024 * 1024);

      const stats = memoryManager.getPerformanceStats();

      expect(stats.renderTime).toBeDefined();
      expect(stats.renderTime.count).toBe(2);
      expect(stats.renderTime.average).toBe(25);
      expect(stats.renderTime.min).toBe(16.7);
      expect(stats.renderTime.max).toBe(33.3);

      expect(stats.memoryUsage).toBeDefined();
      expect(stats.memoryUsage.count).toBe(1);
    });

    test("应该限制性能指标记录数量", () => {
      // 添加超过100个记录
      for (let i = 0; i < 150; i++) {
        memoryManager.recordPerformanceMetric("testMetric", i);
      }

      expect(memoryManager.performanceMetrics.testMetric.length).toBe(100);
      expect(memoryManager.performanceMetrics.testMetric[0].value).toBe(50); // 前50个被移除
    });

    test("应该正确计算性能统计", () => {
      const values = [10, 20, 30, 40, 50];
      values.forEach((value) => {
        memoryManager.recordPerformanceMetric("testStat", value);
      });

      const stats = memoryManager.getPerformanceStats();

      expect(stats.testStat.average).toBe(30);
      expect(stats.testStat.min).toBe(10);
      expect(stats.testStat.max).toBe(50);
      expect(stats.testStat.latest).toBe(50);
    });
  });

  describe("图像缓存管理", () => {
    test("应该正确清理图像缓存", () => {
      // 模拟添加缓存
      memoryManager.imageCache.set("image1", "data1");
      memoryManager.imageCache.set("image2", "data2");

      expect(memoryManager.imageCache.size).toBe(2);

      memoryManager.clearImageCache();
      expect(memoryManager.imageCache.size).toBe(0);
    });
  });

  describe("Web Worker图像处理", () => {
    test("应该使用Web Worker处理图像", async () => {
      const mockCanvas = {
        width: 100,
        height: 100,
        getContext: jest.fn(() => ({
          getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(100 * 100 * 4),
            width: 100,
            height: 100,
          })),
        })),
      };

      const mockProcessor = jest.fn();

      const result = await memoryManager._processWithWorker(
        mockCanvas,
        mockProcessor,
        {}
      );

      expect(result).toBeDefined();
    });

    test("应该在Worker不可用时回退到主线程", async () => {
      // 清空Worker池
      memoryManager.workerPool = [];

      const mockCanvas = { width: 100, height: 100 };
      const mockProcessor = jest.fn(() => mockCanvas);

      const result = await memoryManager._processWithWorker(
        mockCanvas,
        mockProcessor,
        {}
      );

      expect(result).toBe(mockCanvas);
      expect(mockProcessor).toHaveBeenCalled();
    });
  });

  describe("分块处理", () => {
    test("应该正确生成图像块", () => {
      const chunks = memoryManager._generateChunks(1000, 800, 256, 32);

      expect(chunks.length).toBeGreaterThan(1);

      // 检查第一个块
      expect(chunks[0]).toEqual({
        x: 0,
        y: 0,
        width: 256,
        height: 256,
      });

      // 检查边界块
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.x + lastChunk.width).toBeLessThanOrEqual(1000);
      expect(lastChunk.y + lastChunk.height).toBeLessThanOrEqual(800);
    });

    test("应该正确提取图像块", () => {
      const mockCanvas = {
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
      };

      global.document.createElement = jest.fn(() => mockCanvas);

      const sourceCanvas = { width: 1000, height: 800 };
      const chunk = { x: 100, y: 100, width: 256, height: 256 };

      const result = memoryManager._extractChunk(sourceCanvas, chunk);

      expect(result).toBe(mockCanvas);
      expect(mockCanvas.width).toBe(256);
      expect(mockCanvas.height).toBe(256);
    });

    test("应该正确合并处理后的块", () => {
      const mockCtx = {
        globalAlpha: 1,
        drawImage: jest.fn(),
      };

      const chunks = [
        { canvas: "canvas1", x: 0, y: 0 },
        { canvas: "canvas2", x: 224, y: 0 },
        { canvas: "canvas3", x: 0, y: 224 },
      ];

      memoryManager._mergeChunks(mockCtx, chunks, 32);

      expect(mockCtx.drawImage).toHaveBeenCalledTimes(3);
    });
  });

  describe("内存管理器销毁", () => {
    test("应该正确销毁内存管理器", () => {
      const workerTerminateSpy = jest.spyOn(
        memoryManager.workerPool[0],
        "terminate"
      );

      memoryManager.destroy();

      expect(workerTerminateSpy).toHaveBeenCalled();
      expect(memoryManager.workerPool.length).toBe(0);
      expect(memoryManager.imageCache.size).toBe(0);
    });
  });

  describe("错误处理", () => {
    test("应该处理Worker创建失败", () => {
      // Mock Worker构造函数抛出错误
      const originalWorker = global.Worker;
      global.Worker = class {
        constructor() {
          throw new Error("Worker creation failed");
        }
      };

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const manager = new MemoryManager({ enableWebWorker: true });

      expect(manager.workerPool.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to create Web Worker:",
        expect.any(Error)
      );

      // 恢复
      global.Worker = originalWorker;
      consoleSpy.mockRestore();
      manager.destroy();
    });

    test("应该处理Worker处理错误", async () => {
      const mockWorker = {
        isAvailable: true,
        postMessage: jest.fn(),
        terminate: jest.fn(),
      };

      memoryManager.workerPool = [mockWorker];

      const mockCanvas = {
        width: 100,
        height: 100,
        getContext: jest.fn(() => ({
          getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(100 * 100 * 4),
          })),
        })),
      };

      // 模拟Worker错误
      setTimeout(() => {
        if (mockWorker.onerror) {
          mockWorker.onerror(new Error("Worker processing failed"));
        }
      }, 5);

      await expect(
        memoryManager._processWithWorker(mockCanvas, jest.fn(), {})
      ).rejects.toThrow("Worker processing failed");
    });
  });
});
