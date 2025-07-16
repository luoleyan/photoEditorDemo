/**
 * TuiAdapter 单元测试
 */
import TuiAdapter from '@/components/adapters/TuiAdapter.js';

// Mock TUI Image Editor
const mockTuiEditor = {
  loadImageFromURL: jest.fn().mockResolvedValue(undefined),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock-data'),
  getCanvasSize: jest.fn().mockReturnValue({ width: 800, height: 600 }),
  getImageWidth: jest.fn().mockReturnValue(800),
  getImageHeight: jest.fn().mockReturnValue(600),
  setBrightness: jest.fn(),
  applyFilter: jest.fn(),
  removeFilter: jest.fn(),
  crop: jest.fn(),
  rotate: jest.fn(),
  scaleX: jest.fn(),
  scaleY: jest.fn(),
  setObjectScale: jest.fn(),
  setObjectPosition: jest.fn(),
  getActiveObject: jest.fn().mockReturnValue({ id: 'test-object' }),
  discardSelection: jest.fn(),
  addText: jest.fn().mockReturnValue('text-id'),
  addShape: jest.fn().mockReturnValue('shape-id'),
  destroy: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

// Mock window.tui
global.window = global.window || {};
global.window.tui = {
  ImageEditor: jest.fn().mockImplementation(() => mockTuiEditor)
};

describe('TuiAdapter', () => {
  let adapter;
  let container;

  beforeEach(() => {
    adapter = new TuiAdapter();
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
      expect(adapter.adapterType).toBe('tui');
      expect(window.tui.ImageEditor).toHaveBeenCalled();
    });

    test('应该在TUI库未加载时抛出错误', async () => {
      delete global.window.tui;
      
      await expect(adapter.initialize(container)).rejects.toThrow(
        'TUI Image Editor library is not loaded'
      );
    });

    test('应该在已初始化时抛出错误', async () => {
      await adapter.initialize(container);
      
      await expect(adapter.initialize(container)).rejects.toThrow(
        'Adapter is already initialized'
      );
    });
  });

  describe('图像加载', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确加载图像', async () => {
      const imageData = { src: 'test-image.jpg', type: 'url' };
      
      await adapter.loadImage(imageData.src);
      
      expect(mockTuiEditor.loadImageFromURL).toHaveBeenCalledWith('test-image.jpg', 'image');
      expect(adapter.originalImageData).toEqual({
        src: 'test-image.jpg',
        type: 'url',
        timestamp: expect.any(Number),
        width: 800,
        height: 600
      });
    });

    test('应该在无效图像数据时抛出错误', async () => {
      await expect(adapter.loadImage(null)).rejects.toThrow();
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
      
      expect(mockTuiEditor.loadImageFromURL).toHaveBeenCalled();
    });

    test('应该在状态不存在时抛出错误', async () => {
      await expect(adapter.restoreState('non-existent')).rejects.toThrow(
        'State not found: non-existent'
      );
    });
  });

  describe('导出功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确导出为DataURL', async () => {
      const dataURL = await adapter.toDataURL('image/png', 0.9);
      
      expect(dataURL).toBe('data:image/png;base64,mock-data');
      expect(mockTuiEditor.toDataURL).toHaveBeenCalledWith({
        format: 'png',
        quality: 90
      });
    });

    test('应该正确导出为Blob', async () => {
      const blob = await adapter.toBlob('image/jpeg', 0.8);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(mockTuiEditor.toDataURL).toHaveBeenCalledWith({
        format: 'jpeg',
        quality: 80
      });
    });

    test('应该处理无效的图像类型', async () => {
      const dataURL = await adapter.toDataURL('image/invalid', 0.9);
      
      expect(mockTuiEditor.toDataURL).toHaveBeenCalledWith({
        format: 'png', // 应该回退到png
        quality: 90
      });
    });
  });

  describe('图像操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test-image.jpg');
    });

    test('应该正确设置亮度', async () => {
      await adapter.setBrightness(0.5);
      
      expect(mockTuiEditor.setBrightness).toHaveBeenCalledWith(50);
    });

    test('应该正确应用滤镜', async () => {
      await adapter.applyFilter('grayscale');
      
      expect(mockTuiEditor.applyFilter).toHaveBeenCalledWith('grayscale', 100);
    });

    test('应该正确旋转图像', async () => {
      await adapter.rotate(90);
      
      expect(mockTuiEditor.rotate).toHaveBeenCalledWith(90);
    });
  });

  describe('销毁', () => {
    test('应该正确销毁适配器', async () => {
      await adapter.initialize(container);
      
      adapter.destroy();
      
      expect(mockTuiEditor.destroy).toHaveBeenCalled();
      expect(adapter.isInitialized).toBe(false);
      expect(adapter.editor).toBeNull();
    });
  });
});
