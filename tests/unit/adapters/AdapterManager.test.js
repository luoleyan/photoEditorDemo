/**
 * AdapterManager 单元测试
 */
import AdapterManager from '@/components/adapters/AdapterManager.js';

// Mock 适配器
class MockAdapter {
  constructor(type) {
    this.adapterType = type;
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  async initialize(container, options) {
    this.container = container;
    this.options = options;
    this.isInitialized = true;
  }

  destroy() {
    this.isInitialized = false;
    this.eventListeners.clear();
  }

  getIsInitialized() {
    return this.isInitialized;
  }

  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(callback);
  }

  emit(eventName, data) {
    if (this.eventListeners.has(eventName)) {
      this.eventListeners.get(eventName).forEach(callback => callback(data));
    }
  }

  getPerformanceMetrics() {
    return {
      operationCount: 0,
      renderTime: 0
    };
  }
}

// Mock AdapterFactory
const mockAdapterFactory = {
  createAdapter: jest.fn()
};

describe('AdapterManager', () => {
  let adapterManager;
  let container;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    document.body.appendChild(container);

    // 创建适配器管理器实例
    adapterManager = new AdapterManager(container, {
      enableCaching: true,
      maxCachedAdapters: 3,
      autoDestroy: true
    });

    // 替换 adapterFactory
    adapterManager.adapterFactory = mockAdapterFactory;

    // 重置 mock
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 清理
    if (adapterManager) {
      await adapterManager.destroyAll();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('初始化', () => {
    test('应该正确初始化适配器管理器', () => {
      expect(adapterManager).toBeDefined();
      expect(adapterManager.container).toBe(container);
      expect(adapterManager.activeAdapter).toBeNull();
      expect(adapterManager.activeAdapterType).toBeNull();
    });

    test('应该正确设置选项', () => {
      expect(adapterManager.options.enableCaching).toBe(true);
      expect(adapterManager.options.maxCachedAdapters).toBe(3);
      expect(adapterManager.options.autoDestroy).toBe(true);
    });
  });

  describe('适配器创建', () => {
    test('应该正确创建新适配器', async () => {
      const mockAdapter = new MockAdapter('fabric');
      // 模拟适配器工厂返回已初始化的适配器
      mockAdapterFactory.createAdapter.mockImplementation(async (type, container, options) => {
        await mockAdapter.initialize(container, options);
        return mockAdapter;
      });

      const adapter = await adapterManager.getAdapter('fabric');

      expect(mockAdapterFactory.createAdapter).toHaveBeenCalledWith('fabric', container, {});
      expect(adapter).toBe(mockAdapter);
      expect(adapter.getIsInitialized()).toBe(true);
    });

    test('应该缓存已创建的适配器', async () => {
      const mockAdapter = new MockAdapter('fabric');
      // 重置mock调用计数
      mockAdapterFactory.createAdapter.mockClear();
      mockAdapterFactory.createAdapter.mockImplementation(async (type, container, options) => {
        await mockAdapter.initialize(container, options);
        return mockAdapter;
      });

      // 第一次获取
      const adapter1 = await adapterManager.getAdapter('fabric');
      // 第二次获取
      const adapter2 = await adapterManager.getAdapter('fabric');

      expect(mockAdapterFactory.createAdapter).toHaveBeenCalledTimes(1);
      expect(adapter1).toBe(adapter2);
    });

    test('创建失败应该抛出错误', async () => {
      const error = new Error('Creation failed');
      mockAdapterFactory.createAdapter.mockRejectedValue(error);

      await expect(adapterManager.getAdapter('invalid')).rejects.toThrow('Creation failed');
    });
  });

  describe('活动适配器管理', () => {
    test('应该正确设置活动适配器', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      const adapter = await adapterManager.setActiveAdapter('fabric');

      expect(adapterManager.getActiveAdapter()).toBe(adapter);
      expect(adapterManager.getActiveAdapterType()).toBe('fabric');
    });

    test('设置相同的活动适配器应该直接返回', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      await adapterManager.setActiveAdapter('fabric');
      const adapter2 = await adapterManager.setActiveAdapter('fabric');

      expect(mockAdapterFactory.createAdapter).toHaveBeenCalledTimes(1);
      expect(adapter2).toBe(mockAdapter);
    });

    test('应该正确切换活动适配器', async () => {
      const fabricAdapter = new MockAdapter('fabric');
      const konvaAdapter = new MockAdapter('konva');
      
      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(fabricAdapter)
        .mockResolvedValueOnce(konvaAdapter);

      await adapterManager.setActiveAdapter('fabric');
      expect(adapterManager.getActiveAdapterType()).toBe('fabric');

      await adapterManager.setActiveAdapter('konva');
      expect(adapterManager.getActiveAdapterType()).toBe('konva');
      expect(adapterManager.getActiveAdapter()).toBe(konvaAdapter);
    });
  });

  describe('适配器缓存管理', () => {
    test('应该正确检查适配器是否存在', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      expect(adapterManager.hasAdapter('fabric')).toBe(false);

      await adapterManager.getAdapter('fabric');

      expect(adapterManager.hasAdapter('fabric')).toBe(true);
    });

    test('应该正确获取缓存的适配器类型', async () => {
      const fabricAdapter = new MockAdapter('fabric');
      const konvaAdapter = new MockAdapter('konva');
      
      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(fabricAdapter)
        .mockResolvedValueOnce(konvaAdapter);

      await adapterManager.getAdapter('fabric');
      await adapterManager.getAdapter('konva');

      const cachedTypes = adapterManager.getCachedAdapterTypes();
      expect(cachedTypes).toContain('fabric');
      expect(cachedTypes).toContain('konva');
    });

    test('应该正确限制缓存的适配器数量', async () => {
      // 创建一个限制为2个适配器的管理器
      const limitedManager = new AdapterManager(container, {
        enableCaching: true,
        maxCachedAdapters: 2
      });
      limitedManager.adapterFactory = mockAdapterFactory;

      const adapters = [
        new MockAdapter('fabric'),
        new MockAdapter('konva'),
        new MockAdapter('tui')
      ];

      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(adapters[0])
        .mockResolvedValueOnce(adapters[1])
        .mockResolvedValueOnce(adapters[2]);

      await limitedManager.getAdapter('fabric');
      await limitedManager.getAdapter('konva');
      await limitedManager.setActiveAdapter('tui'); // 设置为活动适配器

      const cachedTypes = limitedManager.getCachedAdapterTypes();
      expect(cachedTypes.length).toBeLessThanOrEqual(2);
      expect(cachedTypes).toContain('tui'); // 活动适配器应该保留

      await limitedManager.destroyAll();
    });
  });

  describe('适配器销毁', () => {
    test('应该正确销毁单个适配器', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      await adapterManager.getAdapter('fabric');
      expect(adapterManager.hasAdapter('fabric')).toBe(true);

      await adapterManager.destroyAdapter('fabric');

      expect(adapterManager.hasAdapter('fabric')).toBe(false);
      expect(mockAdapter.getIsInitialized()).toBe(false);
    });

    test('销毁活动适配器应该清除活动状态', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      await adapterManager.setActiveAdapter('fabric');
      expect(adapterManager.getActiveAdapterType()).toBe('fabric');

      await adapterManager.destroyAdapter('fabric');

      expect(adapterManager.getActiveAdapter()).toBeNull();
      expect(adapterManager.getActiveAdapterType()).toBeNull();
    });

    test('应该正确销毁所有适配器', async () => {
      const fabricAdapter = new MockAdapter('fabric');
      const konvaAdapter = new MockAdapter('konva');
      
      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(fabricAdapter)
        .mockResolvedValueOnce(konvaAdapter);

      await adapterManager.getAdapter('fabric');
      await adapterManager.getAdapter('konva');

      await adapterManager.destroyAll();

      expect(adapterManager.getCachedAdapterTypes()).toHaveLength(0);
      expect(adapterManager.getActiveAdapter()).toBeNull();
      expect(fabricAdapter.getIsInitialized()).toBe(false);
      expect(konvaAdapter.getIsInitialized()).toBe(false);
    });

    test('销毁不存在的适配器应该正常处理', async () => {
      await expect(adapterManager.destroyAdapter('non-existent')).resolves.not.toThrow();
    });
  });

  describe('统计信息', () => {
    test('应该正确获取统计信息', async () => {
      const fabricAdapter = new MockAdapter('fabric');
      const konvaAdapter = new MockAdapter('konva');
      
      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(fabricAdapter)
        .mockResolvedValueOnce(konvaAdapter);

      await adapterManager.getAdapter('fabric');
      await adapterManager.setActiveAdapter('konva');

      const stats = adapterManager.getStatistics();

      expect(stats.totalAdapters).toBe(2);
      expect(stats.activeAdapterType).toBe('konva');
      expect(stats.cachedAdapterTypes).toContain('fabric');
      expect(stats.cachedAdapterTypes).toContain('konva');
      expect(stats.adapterDetails).toHaveProperty('fabric');
      expect(stats.adapterDetails).toHaveProperty('konva');
      expect(stats.adapterDetails.konva.isActive).toBe(true);
      expect(stats.adapterDetails.fabric.isActive).toBe(false);
    });
  });

  describe('事件系统', () => {
    test('应该正确触发适配器创建事件', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      const eventCallback = jest.fn();
      adapterManager.on('adapter-created', eventCallback);

      await adapterManager.getAdapter('fabric');

      expect(eventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fabric',
          adapter: mockAdapter
        })
      );
    });

    test('应该正确触发活动适配器变更事件', async () => {
      const fabricAdapter = new MockAdapter('fabric');
      const konvaAdapter = new MockAdapter('konva');
      
      mockAdapterFactory.createAdapter
        .mockResolvedValueOnce(fabricAdapter)
        .mockResolvedValueOnce(konvaAdapter);

      const eventCallback = jest.fn();
      adapterManager.on('active-adapter-changed', eventCallback);

      await adapterManager.setActiveAdapter('fabric');
      await adapterManager.setActiveAdapter('konva');

      expect(eventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          previousType: 'fabric',
          previousAdapter: fabricAdapter,
          currentType: 'konva',
          currentAdapter: konvaAdapter
        })
      );
    });

    test('应该正确转发适配器事件', async () => {
      const mockAdapter = new MockAdapter('fabric');
      mockAdapterFactory.createAdapter.mockResolvedValue(mockAdapter);

      const eventCallback = jest.fn();
      adapterManager.on('adapter-image-loaded', eventCallback);

      await adapterManager.getAdapter('fabric');

      // 模拟适配器触发事件
      mockAdapter.emit('image-loaded', { imageData: 'test' });

      expect(eventCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          adapterType: 'fabric',
          imageData: 'test'
        })
      );
    });

    test('应该正确移除事件监听器', () => {
      const eventCallback = jest.fn();

      adapterManager.on('test-event', eventCallback);
      adapterManager.off('test-event', eventCallback);
      adapterManager.emit('test-event', { data: 'test' });

      expect(eventCallback).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    test('适配器创建失败应该触发错误事件', async () => {
      const error = new Error('Creation failed');
      mockAdapterFactory.createAdapter.mockRejectedValue(error);

      const errorCallback = jest.fn();
      adapterManager.on('adapter-error', errorCallback);

      await expect(adapterManager.getAdapter('invalid')).rejects.toThrow();

      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invalid',
          error: error
        })
      );
    });
  });
});
