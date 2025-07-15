/**
 * FabricAdapter 单元测试
 */
import FabricAdapter from '@/components/adapters/FabricAdapter.js';

// Mock Fabric.js
const mockCanvas = {
  getWidth: jest.fn(() => 800),
  getHeight: jest.fn(() => 600),
  clear: jest.fn(),
  add: jest.fn(),
  setActiveObject: jest.fn(),
  renderAll: jest.fn(),
  dispose: jest.fn(),
  getObjects: jest.fn(() => []),
  discardActiveObject: jest.fn(),
  toDataURL: jest.fn(() => 'data:image/png;base64,mockdata'),
  toCanvasElement: jest.fn(() => ({
    toBlob: jest.fn((callback, type, quality) => {
      callback(new Blob(['mock'], { type }));
    })
  })),
  toJSON: jest.fn(() => '{"objects":[]}'),
  loadFromJSON: jest.fn((json, callback) => {
    if (callback) callback();
  }),
  on: jest.fn()
};

const mockImage = {
  width: 400,
  height: 300,
  left: 0,
  top: 0,
  scaleX: 1,
  scaleY: 1,
  set: jest.fn(),
  filters: [],
  applyFilters: jest.fn(),
  flipX: false,
  flipY: false
};

const mockFabric = {
  Canvas: jest.fn(() => mockCanvas),
  Image: {
    fromURL: jest.fn((url, callback, options) => {
      callback(mockImage);
    }),
    filters: {
      Brightness: jest.fn(),
      Contrast: jest.fn(),
      Grayscale: jest.fn(),
      Sepia: jest.fn(),
      Invert: jest.fn(),
      Blur: jest.fn(),
      Noise: jest.fn()
    }
  },
  Rect: jest.fn(),
  Object: {
    prototype: {
      objectCaching: true,
      statefullCache: true
    }
  }
};

// 设置全局 fabric 对象
global.window = global.window || {};
global.window.fabric = mockFabric;

describe('FabricAdapter', () => {
  let adapter;
  let container;

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
    
    // 创建测试容器
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // 创建适配器实例
    adapter = new FabricAdapter();
  });

  afterEach(() => {
    // 清理
    if (adapter && adapter.getIsInitialized()) {
      adapter.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('初始化和销毁', () => {
    test('应该正确初始化Fabric.js适配器', async () => {
      expect(adapter.getIsInitialized()).toBe(false);
      
      await adapter.initialize(container);
      
      expect(adapter.getIsInitialized()).toBe(true);
      expect(adapter.canvas).toBeDefined();
      expect(mockFabric.Canvas).toHaveBeenCalled();
    });

    test('应该正确销毁适配器', async () => {
      await adapter.initialize(container);
      
      adapter.destroy();
      
      expect(adapter.getIsInitialized()).toBe(false);
      expect(mockCanvas.dispose).toHaveBeenCalled();
    });

    test('Fabric.js未加载时应该抛出错误', async () => {
      // 临时移除 fabric 对象
      const originalFabric = global.window.fabric;
      delete global.window.fabric;
      
      await expect(adapter.initialize(container)).rejects.toThrow('Fabric.js library is not loaded');
      
      // 恢复 fabric 对象
      global.window.fabric = originalFabric;
    });
  });

  describe('图像操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确加载图像', async () => {
      const imageData = { src: 'test.jpg', type: 'url' };
      
      await adapter.loadImage(imageData);
      
      expect(mockFabric.Image.fromURL).toHaveBeenCalledWith(
        'test.jpg',
        expect.any(Function),
        { crossOrigin: 'anonymous' }
      );
      expect(mockCanvas.clear).toHaveBeenCalled();
      expect(mockCanvas.add).toHaveBeenCalledWith(mockImage);
      expect(adapter.currentImage).toBe(mockImage);
    });

    test('应该正确调整图像大小', async () => {
      await adapter.loadImage({ src: 'test.jpg' });
      
      await adapter.resize(200, 150);
      
      expect(mockImage.set).toHaveBeenCalledWith({
        scaleX: 0.5, // 200/400
        scaleY: 0.5  // 150/300
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确裁剪图像', async () => {
      await adapter.loadImage({ src: 'test.jpg' });
      
      await adapter.crop(10, 20, 100, 80);
      
      expect(mockFabric.Rect).toHaveBeenCalledWith({
        left: 10,
        top: 20,
        width: 100,
        height: 80,
        absolutePositioned: true
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确旋转图像', async () => {
      await adapter.loadImage({ src: 'test.jpg' });
      
      await adapter.rotate(45);
      
      expect(mockImage.set).toHaveBeenCalledWith({
        angle: 45
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确翻转图像', async () => {
      await adapter.loadImage({ src: 'test.jpg' });
      
      await adapter.flip(true, false);
      
      expect(mockImage.set).toHaveBeenCalledWith({
        flipX: true
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });
  });

  describe('滤镜和调整', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage({ src: 'test.jpg' });
    });

    test('应该正确设置亮度', async () => {
      await adapter.setBrightness(0.3);
      
      expect(mockFabric.Image.filters.Brightness).toHaveBeenCalledWith({
        brightness: 0.3
      });
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确设置对比度', async () => {
      await adapter.setContrast(-0.2);
      
      expect(mockFabric.Image.filters.Contrast).toHaveBeenCalledWith({
        contrast: -0.2
      });
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确应用灰度滤镜', async () => {
      await adapter.applyFilter('grayscale');
      
      expect(mockFabric.Image.filters.Grayscale).toHaveBeenCalled();
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确应用模糊滤镜', async () => {
      await adapter.applyFilter('blur', { blur: 0.2 });
      
      expect(mockFabric.Image.filters.Blur).toHaveBeenCalledWith({
        blur: 0.2
      });
      expect(mockImage.applyFilters).toHaveBeenCalled();
    });

    test('不支持的滤镜类型应该抛出错误', async () => {
      await expect(adapter.applyFilter('unsupported')).rejects.toThrow('Unsupported filter type: unsupported');
    });

    test('应该正确移除滤镜', async () => {
      await adapter.removeFilter('blur');
      
      expect(mockImage.applyFilters).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });
  });

  describe('变换操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage({ src: 'test.jpg' });
    });

    test('应该正确设置缩放', async () => {
      await adapter.setScale(1.5, 2.0);
      
      expect(mockImage.set).toHaveBeenCalledWith({
        scaleX: 1.5,
        scaleY: 2.0
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确设置位置', async () => {
      await adapter.setPosition(100, 200);
      
      expect(mockImage.set).toHaveBeenCalledWith({
        left: 100,
        top: 200
      });
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });
  });

  describe('选择操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage({ src: 'test.jpg' });
    });

    test('应该正确选择对象', () => {
      adapter.select();
      
      expect(mockCanvas.setActiveObject).toHaveBeenCalledWith(mockImage);
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });

    test('应该正确取消选择', () => {
      adapter.deselect();
      
      expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
      expect(mockCanvas.renderAll).toHaveBeenCalled();
    });
  });

  describe('状态管理', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确保存状态', () => {
      const state = adapter.saveState();
      
      expect(mockCanvas.toJSON).toHaveBeenCalled();
      expect(state).toHaveProperty('canvasState');
      expect(state).toHaveProperty('timestamp');
    });

    test('应该正确重置状态', async () => {
      await adapter.reset();
      
      expect(mockCanvas.clear).toHaveBeenCalled();
    });
  });

  describe('导出功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage({ src: 'test.jpg' });
    });

    test('应该正确导出为DataURL', async () => {
      const dataURL = await adapter.toDataURL('image/png', 0.8);
      
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith({
        format: 'png',
        quality: 0.8,
        multiplier: 1
      });
      expect(dataURL).toBe('data:image/png;base64,mockdata');
    });

    test('应该正确导出为Blob', async () => {
      const blob = await adapter.toBlob('image/jpeg', 0.9);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });
  });

  describe('性能指标', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确获取性能指标', () => {
      const metrics = adapter.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('canvasObjects');
      expect(metrics).toHaveProperty('canvasSize');
      expect(metrics).toHaveProperty('operationCount');
      expect(metrics).toHaveProperty('renderTime');
    });
  });

  describe('错误处理', () => {
    test('未初始化时操作应该抛出错误', async () => {
      await expect(adapter.loadImage({ src: 'test.jpg' })).rejects.toThrow('Adapter is not initialized');
      await expect(adapter.resize(100, 100)).rejects.toThrow('Adapter is not initialized');
    });

    test('没有图像时操作应该抛出错误', async () => {
      await adapter.initialize(container);
      
      await expect(adapter.resize(100, 100)).rejects.toThrow('No image loaded');
      await expect(adapter.crop(0, 0, 50, 50)).rejects.toThrow('No image loaded');
      await expect(adapter.rotate(45)).rejects.toThrow('No image loaded');
    });
  });
});
