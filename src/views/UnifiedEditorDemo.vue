<template>
  <div class="unified-editor-demo">
    <div class="demo-header">
      <h1>统一图像编辑器演示 - 基础架构测试</h1>
      <p>测试适配器系统和状态管理的基础功能</p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <label>选择适配器:</label>
        <select v-model="selectedAdapterType" @change="switchAdapter">
          <option value="">请选择适配器</option>
          <option value="fabric">Fabric.js</option>
          <option value="konva">Konva.js (暂未实现)</option>
          <option value="cropper">Cropper.js (暂未实现)</option>
          <option value="tui">TUI Image Editor (暂未实现)</option>
          <option value="jimp">Jimp (暂未实现)</option>
        </select>
      </div>

      <div class="control-group">
        <label>加载图像:</label>
        <input type="file" @change="loadImageFile" accept="image/*" />
        <button @click="loadDefaultImage">加载默认图像</button>
      </div>

      <div class="control-group" v-if="currentAdapter">
        <label>基础操作:</label>
        <button @click="rotateImage(45)" :disabled="!hasImage">旋转45°</button>
        <button @click="setBrightness(0.2)" :disabled="!hasImage">增加亮度</button>
        <button @click="setContrast(0.2)" :disabled="!hasImage">增加对比度</button>
        <button @click="resetImage" :disabled="!hasImage">重置</button>
      </div>

      <div class="control-group" v-if="currentAdapter">
        <label>状态管理:</label>
        <button @click="saveCurrentState">保存状态</button>
        <button @click="undo" :disabled="!canUndo">撤销</button>
        <button @click="redo" :disabled="!canRedo">重做</button>
        <button @click="exportImage" :disabled="!hasImage">导出图像</button>
      </div>
    </div>

    <div class="demo-content">
      <div class="canvas-container" ref="canvasContainer">
        <div v-if="!currentAdapter" class="placeholder">
          请选择一个适配器开始使用
        </div>
      </div>

      <div class="info-panel">
        <div class="info-section">
          <h3>适配器信息</h3>
          <div class="info-item">
            <strong>当前适配器:</strong> {{ currentAdapterType || '无' }}
          </div>
          <div class="info-item">
            <strong>适配器状态:</strong> {{ adapterStatus }}
          </div>
          <div class="info-item">
            <strong>缓存的适配器:</strong> {{ cachedAdapters.join(', ') || '无' }}
          </div>
        </div>

        <div class="info-section">
          <h3>状态管理信息</h3>
          <div class="info-item">
            <strong>当前状态ID:</strong> {{ currentStateId || '无' }}
          </div>
          <div class="info-item">
            <strong>状态数量:</strong> {{ stateCount }}
          </div>
          <div class="info-item">
            <strong>历史记录数量:</strong> {{ historyCount }}
          </div>
          <div class="info-item">
            <strong>可撤销:</strong> {{ canUndo ? '是' : '否' }}
          </div>
          <div class="info-item">
            <strong>可重做:</strong> {{ canRedo ? '是' : '否' }}
          </div>
        </div>

        <div class="info-section">
          <h3>图像信息</h3>
          <div class="info-item">
            <strong>是否有图像:</strong> {{ hasImage ? '是' : '否' }}
          </div>
          <div class="info-item" v-if="imageInfo">
            <strong>图像尺寸:</strong> {{ imageInfo.width }} × {{ imageInfo.height }}
          </div>
          <div class="info-item" v-if="imageInfo">
            <strong>文件类型:</strong> {{ imageInfo.fileType }}
          </div>
        </div>

        <div class="info-section">
          <h3>操作日志</h3>
          <div class="log-container">
            <div 
              v-for="(log, index) in operationLogs" 
              :key="index" 
              class="log-item"
              :class="log.type"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AdapterManager from '@/components/adapters/AdapterManager.js';
import StateManager from '@/components/state/StateManager.js';
import HistoryManager from '@/components/state/HistoryManager.js';

export default {
  name: 'UnifiedEditorDemo',
  data() {
    return {
      // 适配器相关
      adapterManager: null,
      currentAdapter: null,
      currentAdapterType: null,
      selectedAdapterType: '',
      adapterStatus: '未初始化',
      cachedAdapters: [],
      
      // 状态管理相关
      stateManager: null,
      historyManager: null,
      currentStateId: null,
      stateCount: 0,
      historyCount: 0,
      canUndo: false,
      canRedo: false,
      
      // 图像相关
      hasImage: false,
      imageInfo: null,
      
      // 日志
      operationLogs: [],
      maxLogs: 50
    };
  },
  
  async mounted() {
    await this.initializeManagers();
  },
  
  beforeDestroy() {
    this.cleanup();
  },
  
  methods: {
    /**
     * 初始化管理器
     */
    async initializeManagers() {
      try {
        // 初始化适配器管理器
        this.adapterManager = new AdapterManager(this.$refs.canvasContainer);
        this.setupAdapterManagerEvents();
        
        // 初始化状态管理器
        this.stateManager = new StateManager({
          maxStates: 50,
          autoSave: true
        });
        this.setupStateManagerEvents();
        
        // 初始化历史记录管理器
        this.historyManager = new HistoryManager({
          maxEntries: 50
        });
        this.setupHistoryManagerEvents();
        
        this.addLog('系统初始化完成', 'success');
        
      } catch (error) {
        console.error('初始化失败:', error);
        this.addLog(`初始化失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 设置适配器管理器事件
     */
    setupAdapterManagerEvents() {
      this.adapterManager.on('adapter-created', (data) => {
        this.addLog(`适配器创建成功: ${data.type}`, 'success');
        this.updateAdapterInfo();
      });
      
      this.adapterManager.on('active-adapter-changed', (data) => {
        this.currentAdapter = data.currentAdapter;
        this.currentAdapterType = data.currentType;
        this.adapterStatus = '已激活';
        this.addLog(`切换到适配器: ${data.currentType}`, 'info');
        this.updateAdapterInfo();
      });
      
      this.adapterManager.on('adapter-error', (data) => {
        this.addLog(`适配器错误 (${data.type}): ${data.error.message}`, 'error');
      });
      
      this.adapterManager.on('adapter-image-loaded', (data) => {
        this.hasImage = true;
        this.imageInfo = data.imageData;
        this.addLog('图像加载成功', 'success');
        this.saveCurrentState('图像加载');
      });
    },
    
    /**
     * 设置状态管理器事件
     */
    setupStateManagerEvents() {
      this.stateManager.onStateChange((eventData) => {
        this.currentStateId = eventData.currentStateId;
        this.stateCount = this.stateManager.getStateCount();
        
        if (eventData.action === 'created' || eventData.action === 'updated') {
          this.addLog(`状态${eventData.action === 'created' ? '创建' : '更新'}: ${eventData.state.metadata.description || '未知操作'}`, 'info');
        }
      });
    },
    
    /**
     * 设置历史记录管理器事件
     */
    setupHistoryManagerEvents() {
      this.historyManager.onHistoryChange((eventData) => {
        this.historyCount = eventData.totalEntries;
        this.canUndo = eventData.canUndo;
        this.canRedo = eventData.canRedo;
        
        if (eventData.action === 'added') {
          this.addLog(`历史记录添加: ${eventData.entry.description}`, 'info');
        } else if (eventData.action === 'undo') {
          this.addLog('执行撤销操作', 'info');
        } else if (eventData.action === 'redo') {
          this.addLog('执行重做操作', 'info');
        }
      });
    },
    
    /**
     * 切换适配器
     */
    async switchAdapter() {
      if (!this.selectedAdapterType) return;
      
      try {
        this.adapterStatus = '切换中...';
        await this.adapterManager.setActiveAdapter(this.selectedAdapterType);
        
      } catch (error) {
        console.error('切换适配器失败:', error);
        this.addLog(`切换适配器失败: ${error.message}`, 'error');
        this.adapterStatus = '切换失败';
      }
    },
    
    /**
     * 加载图像文件
     */
    async loadImageFile(event) {
      const file = event.target.files[0];
      if (!file || !this.currentAdapter) return;
      
      try {
        await this.currentAdapter.loadImage(file);
      } catch (error) {
        console.error('加载图像失败:', error);
        this.addLog(`加载图像失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 加载默认图像
     */
    async loadDefaultImage() {
      if (!this.currentAdapter) return;
      
      try {
        const defaultImageSrc = require('@/assets/illust_104350264_20230531_093134.png');
        await this.currentAdapter.loadImage(defaultImageSrc);
      } catch (error) {
        console.error('加载默认图像失败:', error);
        this.addLog(`加载默认图像失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 旋转图像
     */
    async rotateImage(angle) {
      if (!this.currentAdapter || !this.hasImage) return;
      
      try {
        await this.currentAdapter.rotate(angle);
        this.saveCurrentState(`旋转 ${angle}°`);
      } catch (error) {
        console.error('旋转图像失败:', error);
        this.addLog(`旋转图像失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 设置亮度
     */
    async setBrightness(value) {
      if (!this.currentAdapter || !this.hasImage) return;
      
      try {
        await this.currentAdapter.setBrightness(value);
        this.saveCurrentState(`调整亮度: ${value}`);
      } catch (error) {
        console.error('设置亮度失败:', error);
        this.addLog(`设置亮度失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 设置对比度
     */
    async setContrast(value) {
      if (!this.currentAdapter || !this.hasImage) return;
      
      try {
        await this.currentAdapter.setContrast(value);
        this.saveCurrentState(`调整对比度: ${value}`);
      } catch (error) {
        console.error('设置对比度失败:', error);
        this.addLog(`设置对比度失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 重置图像
     */
    async resetImage() {
      if (!this.currentAdapter || !this.hasImage) return;
      
      try {
        await this.currentAdapter.reset();
        this.saveCurrentState('重置图像');
      } catch (error) {
        console.error('重置图像失败:', error);
        this.addLog(`重置图像失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 保存当前状态
     */
    saveCurrentState(description = '保存状态') {
      if (!this.stateManager || !this.currentAdapterType) return;
      
      try {
        const stateId = this.stateManager.updateState({}, 'manual-save', description);
        
        // 添加到历史记录
        this.historyManager.addEntry({
          stateId: stateId,
          actionType: 'manual-save',
          description: description,
          libraryType: this.currentAdapterType
        });
        
      } catch (error) {
        console.error('保存状态失败:', error);
        this.addLog(`保存状态失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 撤销操作
     */
    undo() {
      const entry = this.historyManager.undo();
      if (entry) {
        // 这里应该恢复到对应的状态
        // 暂时只记录日志
        this.addLog(`撤销到: ${entry.description}`, 'info');
      }
    },
    
    /**
     * 重做操作
     */
    redo() {
      const entry = this.historyManager.redo();
      if (entry) {
        // 这里应该恢复到对应的状态
        // 暂时只记录日志
        this.addLog(`重做到: ${entry.description}`, 'info');
      }
    },
    
    /**
     * 导出图像
     */
    async exportImage() {
      if (!this.currentAdapter || !this.hasImage) return;
      
      try {
        const dataURL = await this.currentAdapter.toDataURL();
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        this.addLog('图像导出成功', 'success');
        
      } catch (error) {
        console.error('导出图像失败:', error);
        this.addLog(`导出图像失败: ${error.message}`, 'error');
      }
    },
    
    /**
     * 更新适配器信息
     */
    updateAdapterInfo() {
      if (this.adapterManager) {
        this.cachedAdapters = this.adapterManager.getCachedAdapterTypes();
      }
    },
    
    /**
     * 添加操作日志
     */
    addLog(message, type = 'info') {
      this.operationLogs.unshift({
        message,
        type,
        timestamp: Date.now()
      });
      
      // 限制日志数量
      if (this.operationLogs.length > this.maxLogs) {
        this.operationLogs = this.operationLogs.slice(0, this.maxLogs);
      }
    },
    
    /**
     * 格式化时间
     */
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },
    
    /**
     * 清理资源
     */
    cleanup() {
      if (this.adapterManager) {
        this.adapterManager.destroy();
      }
      if (this.stateManager) {
        this.stateManager.destroy();
      }
      if (this.historyManager) {
        this.historyManager.destroy();
      }
    }
  }
};
</script>

<style scoped>
.unified-editor-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.demo-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.demo-header p {
  color: #666;
  font-size: 14px;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-weight: bold;
  min-width: 80px;
}

.control-group select,
.control-group input {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.control-group button {
  padding: 5px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.control-group button:hover:not(:disabled) {
  background: #0056b3;
}

.control-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.demo-content {
  display: flex;
  gap: 20px;
}

.canvas-container {
  flex: 1;
  min-height: 400px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  position: relative;
}

.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 16px;
}

.info-panel {
  width: 350px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
}

.info-section {
  margin-bottom: 25px;
}

.info-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item strong {
  color: #555;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.log-item {
  padding: 5px 10px;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.success {
  background: #d4edda;
  color: #155724;
}

.log-item.error {
  background: #f8d7da;
  color: #721c24;
}

.log-item.info {
  background: #d1ecf1;
  color: #0c5460;
}

.log-time {
  font-weight: bold;
  margin-right: 10px;
}

.log-message {
  word-break: break-word;
}
</style>
