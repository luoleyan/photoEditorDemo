/**
 * CropperAdapter 单元测试
 */
import CropperAdapter from '@/components/adapters/CropperAdapter.js';

// Mock Cropper.js
const mockCropper = {
  getData: jest.fn().mockReturnValue({ x: 0, y: 0, width: 100, height: 100 }),
  getImageData: jest.fn().mockReturnValue({ naturalWidth: 800, naturalHeight: 600 }),
  getCanvasData: jest.fn().mockReturnValue({ width: 800, height: 600 }),
  getCropBoxData: jest.fn().mockReturnValue({ left: 0, top: 0, width: 100, height: 100 }),
  getCroppedCanvas: jest.fn().mockReturnValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock-cropped-data')
  }),
  setData: jest.fn(),
  setCanvasData: jest.fn(),
  setCropBoxData: jest.fn(),
  rotateTo: jest.fn(),
  scaleX: jest.fn(),
  scaleY: jest.fn(),
  moveTo: jest.fn(),
  setDragMode: jest.fn(),
  resize: jest.fn(),
  clear: jest.fn(),
  destroy: jest.fn(),
  replace: jest.fn()
};

// Mock window.Cropper
global.window = global.window || {};
global.window.Cropper = jest.fn().mockImplementation(() => mockCropper);

// Mock Canvas API
const mockCanvas = {
  getContext: jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    }),
    putImageData: jest.fn()
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock-canvas-data'),
  width: 800,
  height: 600
};

global.document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return {
    style: {},
    appendChild: jest.fn(),
    remove: jest.fn(),
    parentNode: {
      removeChild: jest.fn()
    }
  };
});

describe('CropperAdapter', () => {
  let adapter;
  let container;

  beforeEach(() => {
    adapter = new CropperAdapter();
    container = document.createElement('div');
    container.id = 'test-container';
    
    // 重置所有mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (adapter.isInitialized) {
      adapter.destroy();
    }
  });

  describe('初始化', () => {
    test('应该正确初始化适配器', async () => {
      await adapter.initialize(container);
      
      expect(adapter.isInitialized).toBe(true);
      expect(adapter.adapterType).toBe('cropper');
      expect(adapter.imageElement).toBeDefined();
      expect(adapter.canvasElement).toBeDefined();
    });

    test('应该在Cropper库未加载时抛出错误', async () => {
      delete global.window.Cropper;
      
      await expect(adapter.initialize(container)).rejects.toThrow(
        'Cropper.js library is not loaded'
      );
    });
  });

  describe('图像加载', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确加载图像并创建Cropper实例', async () => {
      const imageData = { src: 'test-image.jpg', type: 'url' };
      
      await adapter.loadImage(imageData.src);
      
      expect(adapter.originalImageData).toEqual({
        src: 'test-image.jpg',
        type: 'url',
        timestamp: expect.any(Number)
      });
      expect(window.Cropper).toHaveBeenCalled();
    });
  });

  describe('图像调整功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确设置亮度', async () => {
      await adapter.setBrightness(0.5);
      
      expect(adapter.imageAdjustments.brightness).toBe(0.5);
    });

    test('应该正确设置对比度', async () => {
      await adapter.setContrast(0.3);
      
      expect(adapter.imageAdjustments.contrast).toBe(0.3);
    });

    test('应该正确应用滤镜', async () => {
      await adapter.applyFilter('grayscale');
      
      expect(adapter.imageAdjustments.filters.has('grayscale')).toBe(true);
    });

    test('应该正确移除滤镜', async () => {
      await adapter.applyFilter('grayscale');
      await adapter.removeFilter('grayscale');
      
      expect(adapter.imageAdjustments.filters.has('grayscale')).toBe(false);
    });

    test('应该处理不支持的滤镜类型', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await adapter.applyFilter('unsupported-filter');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported filter type')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('裁剪功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确执行裁剪', async () => {
      await adapter.crop(10, 10, 100, 100);
      
      expect(mockCropper.setData).toHaveBeenCalledWith({
        x: 10,
        y: 10,
        width: 100,
        height: 100
      });
    });

    test('应该正确旋转图像', async () => {
      await adapter.rotate(90);
      
      expect(mockCropper.rotateTo).toHaveBeenCalledWith(90);
    });

    test('应该正确翻转图像', async () => {
      await adapter.flip(true, false);
      
      expect(mockCropper.scaleX).toHaveBeenCalled();
    });
  });

  describe('状态管理', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确保存状态', () => {
      const stateId = adapter.saveState();
      
      expect(stateId).toBeDefined();
      expect(adapter.stateHistory.has(stateId)).toBe(true);
    });

    test('应该正确恢复状态', async () => {
      const stateId = adapter.saveState();
      
      await adapter.restoreState(stateId);
      
      expect(mockCropper.setData).toHaveBeenCalled();
    });
  });

  describe('导出功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确导出为DataURL', async () => {
      const dataURL = await adapter.toDataURL('image/png', 0.9);
      
      expect(dataURL).toBe('data:image/png;base64,mock-cropped-data');
    });

    test('应该正确导出为Blob', async () => {
      const blob = await adapter.toBlob('image/jpeg', 0.8);
      
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('销毁', () => {
    test('应该正确销毁适配器', async () => {
      await adapter.initialize(container);
      
      adapter.destroy();
      
      expect(mockCropper.destroy).toHaveBeenCalled();
      expect(adapter.isInitialized).toBe(false);
      expect(adapter.cropper).toBeNull();
    });
  });
});
