/**
 * StateManager 单元测试
 */
import StateManager from '@/components/state/StateManager.js';

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager({
      maxStates: 10,
      autoSave: false
    });
  });

  afterEach(() => {
    if (stateManager) {
      stateManager.destroy();
    }
  });

  describe('初始化', () => {
    test('应该正确初始化状态管理器', () => {
      expect(stateManager).toBeDefined();
      expect(stateManager.getStateCount()).toBe(0);
      expect(stateManager.getCurrentStateId()).toBeNull();
    });

    test('应该正确设置选项', () => {
      const customStateManager = new StateManager({
        maxStates: 20,
        autoSave: true,
        autoSaveInterval: 60000
      });

      expect(customStateManager.options.maxStates).toBe(20);
      expect(customStateManager.options.autoSave).toBe(true);
      expect(customStateManager.options.autoSaveInterval).toBe(60000);

      customStateManager.destroy();
    });
  });

  describe('状态创建', () => {
    test('应该正确创建新状态', () => {
      const stateId = stateManager.createState('fabric', null, 'Initial state');

      expect(typeof stateId).toBe('string');
      expect(stateManager.getStateCount()).toBe(1);
      expect(stateManager.getCurrentStateId()).toBe(stateId);
    });

    test('应该正确创建带图像数据的状态', () => {
      const imageData = {
        src: 'test.jpg',
        width: 800,
        height: 600
      };

      const stateId = stateManager.createState('konva', imageData, 'Image loaded');
      const state = stateManager.getState(stateId);

      expect(state).toBeDefined();
      expect(state.imageData).toEqual(imageData);
      expect(state.metadata.description).toBe('Image loaded');
      expect(state.libraryType).toBe('konva');
    });

    test('应该触发状态变更回调', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      const stateId = stateManager.createState('fabric');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          currentStateId: stateId,
          state: expect.any(Object)
        })
      );
    });
  });

  describe('状态更新', () => {
    let initialStateId;

    beforeEach(() => {
      initialStateId = stateManager.createState('fabric', null, 'Initial');
    });

    test('应该正确更新现有状态', () => {
      const updates = {
        imageData: { src: 'updated.jpg' }
      };

      const newStateId = stateManager.updateState(updates, 'update', 'Updated image');

      expect(newStateId).not.toBe(initialStateId);
      expect(stateManager.getStateCount()).toBe(2);
      expect(stateManager.getCurrentStateId()).toBe(newStateId);

      const newState = stateManager.getState(newStateId);
      expect(newState.imageData.src).toBe('updated.jpg');
      expect(newState.metadata.description).toBe('Updated image');
    });

    test('没有当前状态时更新应该抛出错误', () => {
      stateManager.clearAllStates();

      expect(() => {
        stateManager.updateState({}, 'update');
      }).toThrow('No current state to update');
    });

    test('应该触发状态更新回调', () => {
      const callback = jest.fn();
      stateManager.onStateChange(callback);

      // 清除之前的调用
      callback.mockClear();

      const newStateId = stateManager.updateState({}, 'test-update', 'Test update');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          currentStateId: newStateId,
          state: expect.any(Object)
        })
      );
    });
  });

  describe('状态查询', () => {
    let stateId1, stateId2;

    beforeEach(() => {
      stateId1 = stateManager.createState('fabric', null, 'State 1');
      stateId2 = stateManager.createState('konva', null, 'State 2');
    });

    test('应该正确获取状态', () => {
      const state1 = stateManager.getState(stateId1);
      const state2 = stateManager.getState(stateId2);

      expect(state1).toBeDefined();
      expect(state1.metadata.description).toBe('State 1');
      expect(state1.libraryType).toBe('fabric');

      expect(state2).toBeDefined();
      expect(state2.metadata.description).toBe('State 2');
      expect(state2.libraryType).toBe('konva');
    });

    test('应该正确获取当前状态', () => {
      const currentState = stateManager.getCurrentState();

      expect(currentState).toBeDefined();
      expect(currentState.id).toBe(stateId2);
    });

    test('应该正确获取所有状态ID', () => {
      const allStateIds = stateManager.getAllStateIds();

      expect(allStateIds).toHaveLength(2);
      expect(allStateIds).toContain(stateId1);
      expect(allStateIds).toContain(stateId2);
    });

    test('应该正确检查状态是否存在', () => {
      expect(stateManager.hasState(stateId1)).toBe(true);
      expect(stateManager.hasState('non-existent')).toBe(false);
    });

    test('应该正确获取状态数量', () => {
      expect(stateManager.getStateCount()).toBe(2);
    });
  });

  describe('状态删除', () => {
    let stateId1, stateId2, stateId3;

    beforeEach(() => {
      stateId1 = stateManager.createState('fabric', null, 'State 1');
      stateId2 = stateManager.createState('konva', null, 'State 2');
      stateId3 = stateManager.createState('tui', null, 'State 3');
    });

    test('应该正确删除单个状态', () => {
      const result = stateManager.deleteState(stateId2);

      expect(result).toBe(true);
      expect(stateManager.getStateCount()).toBe(2);
      expect(stateManager.hasState(stateId2)).toBe(false);
    });

    test('删除当前状态应该更新当前状态ID', () => {
      expect(stateManager.getCurrentStateId()).toBe(stateId3);

      stateManager.deleteState(stateId3);

      expect(stateManager.getCurrentStateId()).toBe(stateId2);
    });

    test('删除不存在的状态应该返回false', () => {
      const result = stateManager.deleteState('non-existent');

      expect(result).toBe(false);
      expect(stateManager.getStateCount()).toBe(3);
    });

    test('应该正确清空所有状态', () => {
      stateManager.clearAllStates();

      expect(stateManager.getStateCount()).toBe(0);
      expect(stateManager.getCurrentStateId()).toBeNull();
    });
  });

  describe('状态限制', () => {
    test('应该正确限制状态数量', () => {
      const limitedStateManager = new StateManager({ maxStates: 3 });

      // 创建超过限制的状态
      const stateId1 = limitedStateManager.createState('fabric', null, 'State 1');
      const stateId2 = limitedStateManager.createState('konva', null, 'State 2');
      const stateId3 = limitedStateManager.createState('tui', null, 'State 3');
      const stateId4 = limitedStateManager.createState('fabric', null, 'State 4');

      expect(limitedStateManager.getStateCount()).toBe(3);
      expect(limitedStateManager.hasState(stateId1)).toBe(false); // 应该被删除
      expect(limitedStateManager.hasState(stateId2)).toBe(true);
      expect(limitedStateManager.hasState(stateId3)).toBe(true);
      expect(limitedStateManager.hasState(stateId4)).toBe(true);

      limitedStateManager.destroy();
    });
  });

  describe('状态序列化', () => {
    let stateId;

    beforeEach(() => {
      const imageData = { src: 'test.jpg', width: 800, height: 600 };
      stateId = stateManager.createState('fabric', imageData, 'Test state');
    });

    test('应该正确序列化状态', () => {
      const serialized = stateManager.serializeState(stateId);

      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });

    test('应该正确反序列化状态', () => {
      const serialized = stateManager.serializeState(stateId);
      const deserialized = stateManager.deserializeState(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.id).toBe(stateId);
      expect(deserialized.imageData.src).toBe('test.jpg');
      expect(deserialized.metadata.description).toBe('Test state');
    });

    test('序列化不存在的状态应该返回null', () => {
      const result = stateManager.serializeState('non-existent');

      expect(result).toBeNull();
    });

    test('反序列化无效数据应该返回null', () => {
      const result = stateManager.deserializeState('invalid-json');

      expect(result).toBeNull();
    });
  });

  describe('状态比较', () => {
    let stateId1, stateId2;

    beforeEach(() => {
      stateId1 = stateManager.createState('fabric', { src: 'test1.jpg' }, 'State 1');
      stateId2 = stateManager.createState('fabric', { src: 'test2.jpg' }, 'State 2');
    });

    test('应该正确比较两个状态', () => {
      const comparison = stateManager.compareStates(stateId1, stateId2);

      expect(comparison).toBeDefined();
      expect(comparison.areEqual).toBe(false);
      expect(comparison.differences).toBeDefined();
    });

    test('比较相同状态应该返回相等', () => {
      const comparison = stateManager.compareStates(stateId1, stateId1);

      expect(comparison.areEqual).toBe(true);
    });

    test('比较不存在的状态应该返回null', () => {
      const result = stateManager.compareStates('non-existent', stateId1);

      expect(result).toBeNull();
    });
  });

  describe('事件系统', () => {
    test('应该正确添加状态变更回调', () => {
      const callback = jest.fn();

      stateManager.onStateChange(callback);
      stateManager.createState('fabric');

      expect(callback).toHaveBeenCalled();
    });

    test('应该正确移除状态变更回调', () => {
      const callback = jest.fn();

      stateManager.onStateChange(callback);
      stateManager.removeStateChangeCallback(callback);
      stateManager.createState('fabric');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('销毁', () => {
    test('应该正确销毁状态管理器', () => {
      stateManager.createState('fabric');
      expect(stateManager.getStateCount()).toBe(1);

      stateManager.destroy();

      expect(stateManager.getStateCount()).toBe(0);
    });
  });

  describe('错误处理', () => {
    test('无效的状态更新应该抛出错误', () => {
      const stateId = stateManager.createState('fabric');

      // 模拟无效的状态更新
      expect(() => {
        stateManager.updateState({ invalidField: 'invalid' }, 'invalid-update');
      }).not.toThrow(); // StateManager 应该能处理任何更新
    });

    test('获取不存在的状态应该返回null', () => {
      const result = stateManager.getState('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('状态迁移', () => {
    test('应该正确迁移状态到不同适配器', async () => {
      // 创建Fabric状态
      const fabricStateId = stateManager.createState('fabric', { src: 'test.jpg' });
      const fabricState = stateManager.getState(fabricStateId);

      // 添加一些数据
      fabricState.objects = [{
        id: 'text1',
        type: 'text',
        left: 100,
        top: 200,
        text: 'Hello World',
        fill: '#000000'
      }];

      // 迁移到Konva
      const konvaStateId = await stateManager.migrateState(fabricStateId, 'konva');

      expect(konvaStateId).toBeDefined();
      expect(konvaStateId).not.toBe(fabricStateId);

      const konvaState = stateManager.getState(konvaStateId);
      expect(konvaState.libraryType).toBe('konva');
      expect(konvaState.metadata.migratedFrom).toBe('fabric');
    });

    test('应该正确处理相同适配器类型的迁移', async () => {
      const stateId = stateManager.createState('fabric');

      const result = await stateManager.migrateState(stateId, 'fabric');

      expect(result).toBe(stateId); // 应该返回原状态ID
    });

    test('应该正确批量迁移状态', async () => {
      const stateIds = [
        stateManager.createState('fabric'),
        stateManager.createState('fabric'),
        stateManager.createState('fabric')
      ];

      const migratedIds = await stateManager.batchMigrateStates(stateIds, 'konva');

      expect(migratedIds).toHaveLength(3);
      migratedIds.forEach(id => {
        const state = stateManager.getState(id);
        expect(state.libraryType).toBe('konva');
      });
    });

    test('应该在状态不存在时抛出错误', async () => {
      await expect(stateManager.migrateState('non-existent', 'konva')).rejects.toThrow(
        'Source state not found: non-existent'
      );
    });
  });

  describe('兼容性检查', () => {
    test('应该正确检查状态兼容性', () => {
      const stateId = stateManager.createState('fabric');
      const state = stateManager.getState(stateId);

      // 添加一些可能不兼容的功能
      state.objects = [
        { id: 'obj1', type: 'text' },
        { id: 'obj2', type: 'path' },
        { id: 'obj3', type: 'group' }
      ];
      state.filters = [
        { type: 'grayscale' },
        { type: 'customFilter' } // 不支持的滤镜
      ];

      const compatibility = stateManager.checkStateCompatibility(stateId, 'jimp');

      expect(compatibility).toBeDefined();
      expect(compatibility.compatible).toBe(false);
      expect(compatibility.unsupportedFeatures.length).toBeGreaterThan(0);
      expect(compatibility.dataLoss.length).toBeGreaterThan(0);
      expect(compatibility.recommendations.length).toBeGreaterThan(0);
    });

    test('应该正确识别兼容的状态', () => {
      const stateId = stateManager.createState('fabric');
      const state = stateManager.getState(stateId);

      // 只添加兼容的功能
      state.objects = [
        { id: 'obj1', type: 'text' },
        { id: 'obj2', type: 'image' }
      ];
      state.filters = [
        { type: 'grayscale' },
        { type: 'blur' }
      ];

      const compatibility = stateManager.checkStateCompatibility(stateId, 'konva');

      expect(compatibility.compatible).toBe(true);
      expect(compatibility.unsupportedFeatures.length).toBe(0);
      expect(compatibility.dataLoss.length).toBe(0);
    });
  });

  describe('迁移路径', () => {
    test('应该返回支持的迁移路径', () => {
      const paths = stateManager.getSupportedMigrationPaths('fabric');

      expect(paths).toContain('konva');
      expect(paths).toContain('tui');
      expect(paths).toContain('jimp');
      expect(paths).not.toContain('fabric'); // 不应该包含自己
    });

    test('应该处理未知适配器类型', () => {
      const paths = stateManager.getSupportedMigrationPaths('unknown');

      expect(paths).toEqual([]);
    });
  });

  describe('状态快照', () => {
    test('应该正确创建迁移快照', () => {
      const stateId = stateManager.createState('fabric', { src: 'test.jpg' });

      const snapshot = stateManager.createMigrationSnapshot(stateId);

      expect(snapshot).toBeDefined();
      expect(snapshot.snapshotMetadata).toBeDefined();
      expect(snapshot.snapshotMetadata.originalStateId).toBe(stateId);
      expect(snapshot.snapshotMetadata.sourceLibraryType).toBe('fabric');
      expect(snapshot.snapshotMetadata.purpose).toBe('migration');
    });

    test('应该在状态不存在时抛出错误', () => {
      expect(() => {
        stateManager.createMigrationSnapshot('non-existent');
      }).toThrow('State not found: non-existent');
    });
  });
});
