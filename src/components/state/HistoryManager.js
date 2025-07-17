/**
 * 历史记录管理器
 * 负责管理编辑操作的历史记录，支持撤销/重做功能
 */
class HistoryManager {
  constructor(options = {}) {
    this.entries = [];
    this.currentIndex = -1;
    this.options = {
      maxEntries: options.maxEntries || 50,
      enableGrouping: options.enableGrouping || true,
      groupTimeout: options.groupTimeout || 1000, // 1秒内的操作可以分组
    };
    this.lastOperationTime = 0;
    this.pendingGroup = null;
  }

  /**
   * 添加历史记录条目
   * @param {Object} entry - 历史记录条目
   * @param {string} entry.id - 条目ID
   * @param {string} entry.stateId - 对应的状态ID
   * @param {string} entry.actionType - 操作类型
   * @param {string} entry.description - 操作描述
   * @param {Object} entry.actionParams - 操作参数
   * @param {string} entry.libraryType - 使用的库类型
   * @param {number} entry.timestamp - 时间戳
   */
  addEntry(entry) {
    const now = Date.now();

    // 验证条目
    if (!this._validateEntry(entry)) {
      throw new Error("Invalid history entry");
    }

    // 设置默认值
    const historyEntry = {
      id: entry.id || this._generateEntryId(),
      stateId: entry.stateId,
      actionType: entry.actionType,
      description: entry.description,
      actionParams: entry.actionParams || {},
      libraryType: entry.libraryType,
      timestamp: entry.timestamp || now,
      groupId: null,
    };

    // 检查是否可以分组
    if (
      this.options.enableGrouping &&
      this._canGroupWithPrevious(historyEntry)
    ) {
      this._addToGroup(historyEntry);
    } else {
      this._addNewEntry(historyEntry);
    }

    this.lastOperationTime = now;
  }

  /**
   * 获取当前历史记录条目
   * @returns {Object|null} 当前条目
   */
  getCurrentEntry() {
    if (this.currentIndex >= 0 && this.currentIndex < this.entries.length) {
      return this.entries[this.currentIndex];
    }
    return null;
  }

  /**
   * 撤销操作
   * @returns {Object|null} 撤销后的条目
   */
  undo() {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    const entry = this.getCurrentEntry();

    if (entry) {
      this._notifyHistoryChange("undo", entry);
    }

    return entry;
  }

  /**
   * 重做操作
   * @returns {Object|null} 重做后的条目
   */
  redo() {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const entry = this.getCurrentEntry();

    if (entry) {
      this._notifyHistoryChange("redo", entry);
    }

    return entry;
  }

  /**
   * 检查是否可以撤销
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * 检查是否可以重做
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.entries.length - 1;
  }

  /**
   * 跳转到指定索引的历史记录
   * @param {number} index - 目标索引
   * @returns {Object|null} 目标条目
   */
  goToIndex(index) {
    if (index < 0 || index >= this.entries.length) {
      return null;
    }

    const previousIndex = this.currentIndex;
    this.currentIndex = index;
    const entry = this.getCurrentEntry();

    if (entry) {
      this._notifyHistoryChange("goto", entry, {
        previousIndex,
        targetIndex: index,
      });
    }

    return entry;
  }

  /**
   * 获取所有历史记录条目
   * @returns {Object[]} 历史记录数组
   */
  getAllEntries() {
    return [...this.entries];
  }

  /**
   * 获取当前索引
   * @returns {number}
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * 获取历史记录数量
   * @returns {number}
   */
  getEntryCount() {
    return this.entries.length;
  }

  /**
   * 清空历史记录
   */
  clear() {
    this.entries = [];
    this.currentIndex = -1;
    this.pendingGroup = null;
    this._notifyHistoryChange("clear");
  }

  /**
   * 获取历史记录摘要
   * @param {number} maxEntries - 最大条目数
   * @returns {Object[]} 摘要数组
   */
  getSummary(maxEntries = 10) {
    const startIndex = Math.max(0, this.entries.length - maxEntries);
    return this.entries.slice(startIndex).map((entry) => ({
      id: entry.id,
      actionType: entry.actionType,
      description: entry.description,
      timestamp: entry.timestamp,
      isGrouped: !!entry.groupId,
      isCurrent: this.entries.indexOf(entry) === this.currentIndex,
    }));
  }

  /**
   * 序列化历史记录
   * @returns {string} 序列化的历史记录
   */
  serialize() {
    return JSON.stringify({
      entries: this.entries,
      currentIndex: this.currentIndex,
      version: "1.0.0",
      timestamp: Date.now(),
    });
  }

  /**
   * 反序列化历史记录
   * @param {string} serializedHistory - 序列化的历史记录
   */
  deserialize(serializedHistory) {
    try {
      const data = JSON.parse(serializedHistory);

      if (!Array.isArray(data.entries)) {
        throw new Error("Invalid history data format");
      }

      this.entries = data.entries;
      this.currentIndex = data.currentIndex || -1;

      // 验证索引范围
      if (this.currentIndex >= this.entries.length) {
        this.currentIndex = this.entries.length - 1;
      }

      this._notifyHistoryChange("deserialized");
    } catch (error) {
      console.error("Failed to deserialize history:", error);
      throw new Error("History deserialization failed");
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const actionTypes = {};
    const libraryTypes = {};
    let totalOperations = 0;
    let groupedOperations = 0;

    this.entries.forEach((entry) => {
      // 统计操作类型
      actionTypes[entry.actionType] = (actionTypes[entry.actionType] || 0) + 1;

      // 统计库类型
      libraryTypes[entry.libraryType] =
        (libraryTypes[entry.libraryType] || 0) + 1;

      totalOperations++;

      if (entry.groupId) {
        groupedOperations++;
      }
    });

    return {
      totalEntries: this.entries.length,
      currentIndex: this.currentIndex,
      totalOperations,
      groupedOperations,
      actionTypes,
      libraryTypes,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      memoryUsage: this._calculateMemoryUsage(),
    };
  }

  /**
   * 注册历史记录变更回调
   * @param {Function} callback - 回调函数
   */
  onHistoryChange(callback) {
    if (!this.historyChangeCallbacks) {
      this.historyChangeCallbacks = [];
    }
    this.historyChangeCallbacks.push(callback);
  }

  /**
   * 移除历史记录变更回调
   * @param {Function} callback - 回调函数
   */
  offHistoryChange(callback) {
    if (this.historyChangeCallbacks) {
      const index = this.historyChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.historyChangeCallbacks.splice(index, 1);
      }
    }
  }

  // ========== 私有方法 ==========

  /**
   * 验证历史记录条目
   * @param {Object} entry - 条目对象
   * @returns {boolean} 是否有效
   * @private
   */
  _validateEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const requiredFields = [
      "stateId",
      "actionType",
      "description",
      "libraryType",
    ];
    return requiredFields.every((field) => field in entry && entry[field]);
  }

  /**
   * 检查是否可以与前一个条目分组
   * @param {Object} entry - 新条目
   * @returns {boolean} 是否可以分组
   * @private
   */
  _canGroupWithPrevious(entry) {
    if (this.entries.length === 0) {
      return false;
    }

    const lastEntry = this.entries[this.entries.length - 1];
    const timeDiff = entry.timestamp - lastEntry.timestamp;

    return (
      timeDiff < this.options.groupTimeout &&
      entry.actionType === lastEntry.actionType &&
      entry.libraryType === lastEntry.libraryType &&
      this._canGroupActionTypes(entry.actionType)
    );
  }

  /**
   * 检查操作类型是否可以分组
   * @param {string} actionType - 操作类型
   * @returns {boolean} 是否可以分组
   * @private
   */
  _canGroupActionTypes(actionType) {
    const groupableActions = [
      "brightness",
      "contrast",
      "saturation",
      "hue",
      "rotate",
      "scale",
      "position",
      "opacity",
    ];
    return groupableActions.includes(actionType);
  }

  /**
   * 添加到现有分组
   * @param {Object} entry - 历史记录条目
   * @private
   */
  _addToGroup(entry) {
    const lastEntry = this.entries[this.entries.length - 1];

    if (!lastEntry.groupId) {
      // 创建新分组
      const groupId = this._generateGroupId();
      lastEntry.groupId = groupId;
      entry.groupId = groupId;
    } else {
      // 添加到现有分组
      entry.groupId = lastEntry.groupId;
    }

    // 更新分组描述
    entry.description = this._generateGroupDescription(entry.groupId);

    this._addNewEntry(entry);
  }

  /**
   * 添加新条目
   * @param {Object} entry - 历史记录条目
   * @private
   */
  _addNewEntry(entry) {
    // 如果当前不在最新状态，删除后面的历史
    if (this.currentIndex < this.entries.length - 1) {
      this.entries = this.entries.slice(0, this.currentIndex + 1);
    }

    // 添加新条目
    this.entries.push(entry);
    this.currentIndex = this.entries.length - 1;

    // 限制历史记录数量
    this._limitEntriesCount();

    this._notifyHistoryChange("added", entry);
  }

  /**
   * 限制历史记录数量
   * @private
   */
  _limitEntriesCount() {
    if (this.entries.length > this.options.maxEntries) {
      const removeCount = this.entries.length - this.options.maxEntries;
      this.entries.splice(0, removeCount);
      this.currentIndex -= removeCount;

      // 确保索引不小于0
      if (this.currentIndex < 0) {
        this.currentIndex = 0;
      }
    }
  }

  /**
   * 生成条目ID
   * @returns {string}
   * @private
   */
  _generateEntryId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成分组ID
   * @returns {string}
   * @private
   */
  _generateGroupId() {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成分组描述
   * @param {string} groupId - 分组ID
   * @returns {string}
   * @private
   */
  _generateGroupDescription(groupId) {
    const groupEntries = this.entries.filter(
      (entry) => entry.groupId === groupId
    );
    if (groupEntries.length <= 1) {
      return groupEntries[0]?.description || "Grouped operation";
    }

    const actionType = groupEntries[0].actionType;
    return `${actionType} (${groupEntries.length} operations)`;
  }

  /**
   * 触发历史记录变更回调
   * @param {string} action - 操作类型
   * @param {Object} entry - 相关条目
   * @param {Object} extra - 额外数据
   * @private
   */
  _notifyHistoryChange(action, entry = null, extra = {}) {
    if (!this.historyChangeCallbacks) {
      return;
    }

    const eventData = {
      action,
      entry,
      currentIndex: this.currentIndex,
      totalEntries: this.entries.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      timestamp: Date.now(),
      ...extra,
    };

    this.historyChangeCallbacks.forEach((callback) => {
      try {
        callback(eventData);
      } catch (error) {
        console.error("Error in history change callback:", error);
      }
    });
  }

  /**
   * 计算内存使用量（估算）
   * @returns {number} 内存使用量（字节）
   * @private
   */
  _calculateMemoryUsage() {
    try {
      return JSON.stringify(this.entries).length * 2; // 粗略估算
    } catch (error) {
      return 0;
    }
  }

  /**
   * 销毁历史记录管理器
   */
  destroy() {
    this.clear();
    this.historyChangeCallbacks = [];
  }
}

export default HistoryManager;
