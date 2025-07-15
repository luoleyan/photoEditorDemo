import { 
  createDefaultImageEditorState, 
  validateImageEditorState, 
  cloneImageEditorState, 
  mergeStateUpdates,
  serializeState,
  deserializeState,
  compareStates,
  getStateDiff
} from './ImageEditorState.js';

/**
 * 状态管理器
 * 负责管理图像编辑器的状态，包括状态创建、更新、历史记录等
 */
class StateManager {
  constructor(options = {}) {
    this.states = new Map();
    this.currentStateId = null;
    this.stateChangeCallbacks = [];
    this.options = {
      maxStates: options.maxStates || 100,
      autoSave: options.autoSave || false,
      autoSaveInterval: options.autoSaveInterval || 30000, // 30秒
      enableCompression: options.enableCompression || false
    };
    
    // 初始化自动保存
    if (this.options.autoSave) {
      this._startAutoSave();
    }
  }

  /**
   * 创建新状态
   * @param {string} libraryType - 库类型
   * @param {Object} imageData - 图像数据
   * @param {string} description - 状态描述
   * @returns {string} 状态ID
   */
  createState(libraryType, imageData = null, description = 'Initial state') {
    const state = createDefaultImageEditorState(libraryType, imageData);
    state.metadata.description = description;
    
    this.states.set(state.id, state);
    this.currentStateId = state.id;
    
    // 限制状态数量
    this._limitStatesCount();
    
    // 触发状态变更回调
    this._notifyStateChange('created', state);
    
    return state.id;
  }

  /**
   * 更新当前状态
   * @param {Object} updates - 更新内容
   * @param {string} actionType - 操作类型
   * @param {string} description - 操作描述
   * @returns {string} 新状态ID
   */
  updateState(updates, actionType = 'update', description = 'State updated') {
    if (!this.currentStateId) {
      throw new Error('No current state to update');
    }
    
    const currentState = this.getState(this.currentStateId);
    if (!currentState) {
      throw new Error(`Current state not found: ${this.currentStateId}`);
    }
    
    // 创建新状态
    const newState = mergeStateUpdates(currentState, updates);
    newState.metadata.lastOperation = {
      type: actionType,
      description: description,
      timestamp: Date.now()
    };
    
    // 验证新状态
    if (!validateImageEditorState(newState)) {
      throw new Error('Invalid state update');
    }
    
    // 保存新状态
    this.states.set(newState.id, newState);
    const previousStateId = this.currentStateId;
    this.currentStateId = newState.id;
    
    // 限制状态数量
    this._limitStatesCount();
    
    // 触发状态变更回调
    this._notifyStateChange('updated', newState, previousStateId);
    
    return newState.id;
  }

  /**
   * 获取状态
   * @param {string} stateId - 状态ID
   * @returns {Object|null} 状态对象
   */
  getState(stateId) {
    return this.states.get(stateId) || null;
  }

  /**
   * 获取当前状态
   * @returns {Object|null} 当前状态对象
   */
  getCurrentState() {
    if (!this.currentStateId) return null;
    return this.getState(this.currentStateId);
  }

  /**
   * 设置当前状态
   * @param {string} stateId - 状态ID
   * @returns {boolean} 是否成功
   */
  setCurrentState(stateId) {
    if (!this.states.has(stateId)) {
      console.warn(`State not found: ${stateId}`);
      return false;
    }
    
    const previousStateId = this.currentStateId;
    this.currentStateId = stateId;
    
    const currentState = this.getState(stateId);
    this._notifyStateChange('switched', currentState, previousStateId);
    
    return true;
  }

  /**
   * 删除状态
   * @param {string} stateId - 状态ID
   * @returns {boolean} 是否成功删除
   */
  deleteState(stateId) {
    if (!this.states.has(stateId)) {
      return false;
    }
    
    // 不能删除当前状态
    if (stateId === this.currentStateId) {
      console.warn('Cannot delete current state');
      return false;
    }
    
    this.states.delete(stateId);
    this._notifyStateChange('deleted', null, stateId);
    
    return true;
  }

  /**
   * 获取所有状态ID
   * @returns {string[]} 状态ID数组
   */
  getAllStateIds() {
    return Array.from(this.states.keys());
  }

  /**
   * 获取状态数量
   * @returns {number} 状态数量
   */
  getStateCount() {
    return this.states.size;
  }

  /**
   * 清空所有状态
   */
  clearAllStates() {
    this.states.clear();
    this.currentStateId = null;
    this._notifyStateChange('cleared');
  }

  /**
   * 序列化状态
   * @param {string} stateId - 状态ID
   * @returns {string} 序列化的状态字符串
   */
  serializeState(stateId) {
    const state = this.getState(stateId);
    if (!state) {
      throw new Error(`State not found: ${stateId}`);
    }
    
    return serializeState(state);
  }

  /**
   * 反序列化状态
   * @param {string} serializedState - 序列化的状态字符串
   * @returns {string} 新状态ID
   */
  deserializeState(serializedState) {
    const state = deserializeState(serializedState);
    
    // 生成新的ID以避免冲突
    const originalId = state.id;
    state.id = this._generateUniqueId();
    state.metadata.deserializedFrom = originalId;
    state.metadata.deserializedAt = Date.now();
    
    this.states.set(state.id, state);
    
    this._notifyStateChange('deserialized', state);
    
    return state.id;
  }

  /**
   * 导出所有状态
   * @returns {string} 导出的JSON字符串
   */
  exportAllStates() {
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      currentStateId: this.currentStateId,
      states: {}
    };
    
    for (const [id, state] of this.states) {
      exportData.states[id] = state;
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入状态
   * @param {string} importData - 导入的JSON字符串
   * @returns {Object} 导入结果
   */
  importStates(importData) {
    try {
      const data = JSON.parse(importData);
      
      if (!data.states || typeof data.states !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      const importedStateIds = [];
      const errors = [];
      
      // 导入状态
      for (const [originalId, state] of Object.entries(data.states)) {
        try {
          if (!validateImageEditorState(state)) {
            errors.push(`Invalid state: ${originalId}`);
            continue;
          }
          
          // 生成新ID
          const newId = this._generateUniqueId();
          state.id = newId;
          state.metadata.importedFrom = originalId;
          state.metadata.importedAt = Date.now();
          
          this.states.set(newId, state);
          importedStateIds.push(newId);
          
        } catch (error) {
          errors.push(`Failed to import state ${originalId}: ${error.message}`);
        }
      }
      
      // 限制状态数量
      this._limitStatesCount();
      
      this._notifyStateChange('imported', null, null, { importedStateIds, errors });
      
      return {
        success: true,
        importedCount: importedStateIds.length,
        importedStateIds,
        errors
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 比较两个状态
   * @param {string} stateId1 - 状态1 ID
   * @param {string} stateId2 - 状态2 ID
   * @returns {Object} 比较结果
   */
  compareStates(stateId1, stateId2) {
    const state1 = this.getState(stateId1);
    const state2 = this.getState(stateId2);
    
    if (!state1 || !state2) {
      throw new Error('One or both states not found');
    }
    
    return {
      areEqual: compareStates(state1, state2),
      differences: getStateDiff(state1, state2)
    };
  }

  /**
   * 注册状态变更回调
   * @param {Function} callback - 回调函数
   */
  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.stateChangeCallbacks.push(callback);
    }
  }

  /**
   * 移除状态变更回调
   * @param {Function} callback - 回调函数
   */
  offStateChange(callback) {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 获取状态统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const states = Array.from(this.states.values());
    
    return {
      totalStates: states.length,
      currentStateId: this.currentStateId,
      libraryTypes: [...new Set(states.map(s => s.libraryType))],
      oldestState: states.reduce((oldest, state) => 
        !oldest || state.timestamp < oldest.timestamp ? state : oldest, null),
      newestState: states.reduce((newest, state) => 
        !newest || state.timestamp > newest.timestamp ? state : newest, null),
      totalOperations: states.reduce((total, state) => 
        total + (state.metadata.operationCount || 0), 0),
      memoryUsage: this._calculateMemoryUsage()
    };
  }

  // ========== 私有方法 ==========

  /**
   * 触发状态变更回调
   * @param {string} action - 操作类型
   * @param {Object} state - 状态对象
   * @param {string} previousStateId - 前一个状态ID
   * @param {Object} extra - 额外数据
   * @private
   */
  _notifyStateChange(action, state = null, previousStateId = null, extra = {}) {
    const eventData = {
      action,
      state,
      previousStateId,
      currentStateId: this.currentStateId,
      timestamp: Date.now(),
      ...extra
    };
    
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * 限制状态数量
   * @private
   */
  _limitStatesCount() {
    if (this.states.size <= this.options.maxStates) {
      return;
    }
    
    // 获取所有状态并按时间戳排序
    const sortedStates = Array.from(this.states.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // 删除最旧的状态，但保留当前状态
    const toDelete = sortedStates.slice(0, this.states.size - this.options.maxStates);
    
    for (const [id] of toDelete) {
      if (id !== this.currentStateId) {
        this.states.delete(id);
      }
    }
  }

  /**
   * 生成唯一ID
   * @returns {string}
   * @private
   */
  _generateUniqueId() {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算内存使用量（估算）
   * @returns {number} 内存使用量（字节）
   * @private
   */
  _calculateMemoryUsage() {
    let totalSize = 0;
    
    for (const state of this.states.values()) {
      try {
        totalSize += JSON.stringify(state).length * 2; // 粗略估算
      } catch (error) {
        // 忽略序列化错误
      }
    }
    
    return totalSize;
  }

  /**
   * 开始自动保存
   * @private
   */
  _startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(() => {
      try {
        const currentState = this.getCurrentState();
        if (currentState) {
          const serialized = this.serializeState(currentState.id);
          localStorage.setItem('imageEditor_autoSave', serialized);
          localStorage.setItem('imageEditor_autoSave_timestamp', Date.now().toString());
        }
      } catch (error) {
        console.error('Auto save failed:', error);
      }
    }, this.options.autoSaveInterval);
  }

  /**
   * 停止自动保存
   * @private
   */
  _stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 销毁状态管理器
   */
  destroy() {
    this._stopAutoSave();
    this.clearAllStates();
    this.stateChangeCallbacks = [];
  }
}

export default StateManager;
