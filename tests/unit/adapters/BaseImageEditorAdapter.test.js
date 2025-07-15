/**
 * BaseImageEditorAdapter 单元测试
 */
import BaseImageEditorAdapter from '@/components/adapters/BaseImageEditorAdapter.js';

// 创建一个测试用的具体适配器类
class TestAdapter extends BaseImageEditorAdapter {
  constructor() {
    super();
    this.adapterType = 'test';
  }

  getDefaultOptions() {
    return {
      width: 800,
      height: 600
    };
  }

  async _doInitialize() {
    // 模拟初始化
    this.mockInitialized = true;
  }

  _doDestroy() {
    this.mockInitialized = false;
  }

  async _doLoadImage(imageData) {
    this.mockImageData = imageData;
  }

  async _doResize(width, height) {
    this.mockSize = { width, height };
  }

  async _doCrop(x, y, width, height) {
    this.mockCrop = { x, y, width, height };
  }

  async _doRotate(angle) {
    this.mockRotation = angle;
  }

  async _doFlip(horizontal, vertical) {
    this.mockFlip = { horizontal, vertical };
  }

  async _doSetBrightness(value) {
    this.mockBrightness = value;
  }

  async _doSetContrast(value) {
    this.mockContrast = value;
  }

  async _doApplyFilter(filterType, options) {
    this.mockFilter = { filterType, options };
  }

  async _doRemoveFilter(filterType) {
    this.mockRemovedFilter = filterType;
  }

  async _doSetScale(scaleX, scaleY) {
    this.mockScale = { scaleX, scaleY };
  }

  async _doSetPosition(x, y) {
    this.mockPosition = { x, y };
  }

  _doSelect() {
    this.mockSelected = true;
  }

  _doDeselect() {
    this.mockSelected = false;
  }

  _doSaveState() {
    return { id: 'test-state', timestamp: Date.now() };
  }

  async _doRestoreState(stateId) {
    this.mockRestoredState = stateId;
  }

  async _doReset() {
    this.mockReset = true;
  }

  async _doToDataURL(type, quality) {
    return `data:${type};base64,mockdata`;
  }

  async _doToBlob(type, quality) {
    return new Blob(['mock'], { type });
  }

  _doGetPerformanceMetrics() {
    return {
      operationCount: 10,
      renderTime: 100
    };
  }
}

describe('BaseImageEditorAdapter', () => {
  let adapter;
  let container;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // 创建适配器实例
    adapter = new TestAdapter();
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
    test('应该正确初始化适配器', async () => {
      expect(adapter.getIsInitialized()).toBe(false);
      
      await adapter.initialize(container);
      
      expect(adapter.getIsInitialized()).toBe(true);
      expect(adapter.container).toBe(container);
      expect(adapter.mockInitialized).toBe(true);
    });

    test('应该正确销毁适配器', async () => {
      await adapter.initialize(container);
      expect(adapter.getIsInitialized()).toBe(true);
      
      adapter.destroy();
      
      expect(adapter.getIsInitialized()).toBe(false);
      expect(adapter.mockInitialized).toBe(false);
    });

    test('重复初始化应该抛出错误', async () => {
      await adapter.initialize(container);
      
      await expect(adapter.initialize(container)).rejects.toThrow('Adapter is already initialized');
    });
  });

  describe('图像操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确加载图像', async () => {
      const imageData = { src: 'test.jpg', type: 'url' };
      
      await adapter.loadImage('test.jpg');
      
      expect(adapter.mockImageData).toEqual(imageData);
    });

    test('应该正确调整图像大小', async () => {
      await adapter.loadImage('test.jpg');
      
      await adapter.resize(400, 300);
      
      expect(adapter.mockSize).toEqual({ width: 400, height: 300 });
    });

    test('应该正确裁剪图像', async () => {
      await adapter.loadImage('test.jpg');
      
      await adapter.crop(10, 20, 100, 150);
      
      expect(adapter.mockCrop).toEqual({ x: 10, y: 20, width: 100, height: 150 });
    });

    test('应该正确旋转图像', async () => {
      await adapter.loadImage('test.jpg');
      
      await adapter.rotate(45);
      
      expect(adapter.mockRotation).toBe(45);
    });

    test('应该正确翻转图像', async () => {
      await adapter.loadImage('test.jpg');
      
      await adapter.flip(true, false);
      
      expect(adapter.mockFlip).toEqual({ horizontal: true, vertical: false });
    });
  });

  describe('滤镜和调整', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test.jpg');
    });

    test('应该正确设置亮度', async () => {
      await adapter.setBrightness(0.5);
      
      expect(adapter.mockBrightness).toBe(0.5);
    });

    test('应该正确设置对比度', async () => {
      await adapter.setContrast(-0.3);
      
      expect(adapter.mockContrast).toBe(-0.3);
    });

    test('应该正确应用滤镜', async () => {
      const options = { blur: 5 };
      
      await adapter.applyFilter('blur', options);
      
      expect(adapter.mockFilter).toEqual({ filterType: 'blur', options });
    });

    test('应该正确移除滤镜', async () => {
      await adapter.removeFilter('blur');
      
      expect(adapter.mockRemovedFilter).toBe('blur');
    });
  });

  describe('变换操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test.jpg');
    });

    test('应该正确设置缩放', async () => {
      await adapter.setScale(1.5, 2.0);
      
      expect(adapter.mockScale).toEqual({ scaleX: 1.5, scaleY: 2.0 });
    });

    test('应该正确设置位置', async () => {
      await adapter.setPosition(100, 200);
      
      expect(adapter.mockPosition).toEqual({ x: 100, y: 200 });
    });
  });

  describe('选择操作', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确选择对象', () => {
      adapter.select();
      
      expect(adapter.mockSelected).toBe(true);
    });

    test('应该正确取消选择', () => {
      adapter.select();
      adapter.deselect();
      
      expect(adapter.mockSelected).toBe(false);
    });
  });

  describe('状态管理', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确保存状态', () => {
      const stateId = adapter.saveState();
      
      expect(typeof stateId).toBe('string');
      expect(stateId).toContain('test_');
    });

    test('应该正确重置状态', async () => {
      await adapter.reset();
      
      expect(adapter.mockReset).toBe(true);
    });
  });

  describe('导出功能', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
      await adapter.loadImage('test.jpg');
    });

    test('应该正确导出为DataURL', async () => {
      const dataURL = await adapter.toDataURL('image/png', 0.8);
      
      expect(dataURL).toBe('data:image/png;base64,mockdata');
    });

    test('应该正确导出为Blob', async () => {
      const blob = await adapter.toBlob('image/jpeg', 0.9);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });
  });

  describe('事件系统', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确添加和触发事件监听器', () => {
      const mockCallback = jest.fn();
      
      adapter.on('test-event', mockCallback);
      adapter.emit('test-event', { data: 'test' });
      
      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('应该正确移除事件监听器', () => {
      const mockCallback = jest.fn();
      
      adapter.on('test-event', mockCallback);
      adapter.off('test-event', mockCallback);
      adapter.emit('test-event', { data: 'test' });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('性能指标', () => {
    beforeEach(async () => {
      await adapter.initialize(container);
    });

    test('应该正确获取性能指标', () => {
      const metrics = adapter.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('operationCount');
      expect(metrics).toHaveProperty('renderTime');
      expect(typeof metrics.operationCount).toBe('number');
      expect(typeof metrics.renderTime).toBe('number');
    });
  });

  describe('错误处理', () => {
    test('未初始化时操作应该抛出错误', async () => {
      await expect(adapter.loadImage('test.jpg')).rejects.toThrow('Adapter is not initialized');
      await expect(adapter.resize(100, 100)).rejects.toThrow('Adapter is not initialized');
      await expect(adapter.crop(0, 0, 50, 50)).rejects.toThrow('Adapter is not initialized');
    });
  });
});
