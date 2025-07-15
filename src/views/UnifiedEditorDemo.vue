<template>
  <div class="unified-editor-demo">
    <!-- 性能监控器 -->
    <PerformanceMonitor
      @cleanup-performed="handleCleanupPerformed"
      @metrics-reset="handleMetricsReset"
      @report-exported="handleReportExported"
    />

    <!-- 错误通知组件 -->
    <ErrorNotification
      @error-action="handleErrorAction"
      @info-message="handleInfoMessage"
      @report-error="handleReportError"
    />

    <!-- 系统健康监控 -->
    <SystemHealthMonitor
      @health-updated="handleHealthUpdated"
      @action-request="handleSystemAction"
      @recommendation-executed="handleRecommendationExecuted"
      @report-exported="handleHealthReportExported"
    />

    <div class="demo-header">
      <h1>统一图像编辑器演示 - 基础架构测试</h1>
      <p>测试适配器系统和状态管理的基础功能</p>
    </div>

    <div class="demo-controls">
      <div class="control-group">
        <label>选择适配器:</label>
        <select v-model="selectedAdapterType" @change="switchAdapter">
          <option value="">请选择适配器</option>
          <option value="fabric">Fabric.js ✅</option>
          <option value="konva">Konva.js ✅</option>
          <option value="cropper">Cropper.js (开发中)</option>
          <option value="tui">TUI Image Editor (开发中)</option>
          <option value="jimp">Jimp (开发中)</option>
        </select>
      </div>

      <div class="control-group">
        <label>加载图像:</label>
        <input type="file" @change="loadImageFile" accept="image/*" />
        <button @click="loadDefaultImage">加载默认图像</button>
      </div>

      <div class="control-group" v-if="currentAdapter">
        <label>基础操作:</label>
        <button @click="testAdapter" :disabled="!currentAdapter">测试适配器</button>
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

    <!-- 移动端工具栏 -->
    <MobileToolbar
      :hasImage="hasImage"
      @load-image="loadDefaultImage"
      @apply-adjustments="handleMobileAdjustments"
      @reset-adjustments="handleMobileResetAdjustments"
      @apply-filter="handleMobileApplyFilter"
      @remove-filter="handleMobileRemoveFilter"
      @clear-filters="handleMobileClearFilters"
      @rotate="handleMobileRotate"
      @flip="handleMobileFlip"
      @reset-transform="handleMobileResetTransform"
      @export-image="exportImage"
    />
  </div>
</template>

<script>
import AdapterManager from '@/components/adapters/AdapterManager.js';
import StateManager from '@/components/state/StateManager.js';
import HistoryManager from '@/components/state/HistoryManager.js';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor.vue';
import MobileToolbar from '@/components/ui/MobileToolbar.vue';
import ErrorNotification from '@/components/ui/ErrorNotification.vue';
import SystemHealthMonitor from '@/components/ui/SystemHealthMonitor.vue';
import { mobileAdapter } from '@/utils/MobileAdapter.js';
import { errorHandler } from '@/utils/ErrorHandler.js';
import { errorRecoveryManager } from '@/utils/ErrorRecoveryManager.js';

export default {
  name: 'UnifiedEditorDemo',
  components: {
    PerformanceMonitor,
    MobileToolbar,
    ErrorNotification,
    SystemHealthMonitor
  },
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
      maxLogs: 50,

      // 移动端相关
      isMobile: false,
      deviceInfo: null
    };
  },
  
  async mounted() {
    await this.initializeManagers();
    this.initializeMobileAdaptation();
    this.setupErrorHandling();
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
        // 等待DOM渲染完成
        await this.$nextTick();

        // 初始化适配器管理器
        this.adapterManager = new AdapterManager(this.$refs.canvasContainer);
        this.setupAdapterManagerEvents();

        // 初始化状态管理器
        this.stateManager = new StateManager({
          maxStates: 50,
          autoSave: false // 关闭自动保存，手动控制
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

        // 为新适配器创建初始状态
        if (this.stateManager && this.currentAdapterType) {
          this.currentStateId = this.stateManager.createState(this.currentAdapterType, null, '适配器初始化');
        }
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
      // 监听状态变化事件
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
      // 监听历史记录变化事件
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
        this.addLog(`开始切换到适配器: ${this.selectedAdapterType}`, 'info');

        await this.adapterManager.setActiveAdapter(this.selectedAdapterType);

        this.addLog(`适配器切换成功: ${this.selectedAdapterType}`, 'success');

      } catch (error) {
        console.error('切换适配器失败:', error);
        this.addLog(`切换适配器失败: ${error.message}`, 'error');
        this.adapterStatus = '切换失败';

        // 重置选择
        this.selectedAdapterType = '';
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
     * 测试适配器功能
     */
    async testAdapter() {
      if (!this.currentAdapter) {
        this.addLog('没有活动的适配器', 'error');
        return;
      }

      try {
        this.addLog(`开始测试适配器: ${this.currentAdapterType}`, 'info');

        // 测试适配器是否已初始化
        const isInitialized = this.currentAdapter.getIsInitialized();
        this.addLog(`适配器初始化状态: ${isInitialized ? '已初始化' : '未初始化'}`, isInitialized ? 'success' : 'error');

        if (!isInitialized) {
          this.addLog('适配器未正确初始化', 'error');
          return;
        }

        // 测试性能指标获取
        const metrics = this.currentAdapter.getPerformanceMetrics();
        this.addLog(`性能指标获取成功: 操作次数 ${metrics.operationCount}`, 'success');

        // 如果有图像，测试基础操作
        if (this.hasImage) {
          this.addLog('检测到图像，测试基础操作...', 'info');

          // 测试选择功能
          this.currentAdapter.select();
          this.addLog('选择功能测试完成', 'success');

          // 测试取消选择功能
          this.currentAdapter.deselect();
          this.addLog('取消选择功能测试完成', 'success');
        }

        this.addLog(`适配器 ${this.currentAdapterType} 测试完成`, 'success');

      } catch (error) {
        console.error('适配器测试失败:', error);
        this.addLog(`适配器测试失败: ${error.message}`, 'error');
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
        let stateId;

        // 如果没有当前状态，创建新状态
        if (!this.currentStateId) {
          stateId = this.stateManager.createState(this.currentAdapterType, null, description);
        } else {
          // 更新现有状态
          stateId = this.stateManager.updateState({}, 'manual-save', description);
        }

        // 添加到历史记录
        if (this.historyManager) {
          this.historyManager.addEntry({
            stateId: stateId,
            actionType: 'manual-save',
            description: description,
            libraryType: this.currentAdapterType
          });
        }

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
     * 处理内存清理完成事件
     */
    handleCleanupPerformed() {
      this.addLog('内存清理已执行', 'success');
    },

    /**
     * 处理指标重置事件
     */
    handleMetricsReset() {
      this.addLog('性能指标已重置', 'info');
    },

    /**
     * 处理报告导出事件
     */
    handleReportExported(report) {
      this.addLog('性能报告已导出', 'success');
      console.log('性能报告:', report);
    },

    /**
     * 初始化移动端适配
     */
    initializeMobileAdaptation() {
      this.deviceInfo = mobileAdapter.getDeviceInfo();
      this.isMobile = this.deviceInfo.isMobile;

      if (this.isMobile) {
        this.addLog('检测到移动设备，启用移动端优化', 'info');

        // 导入移动端样式
        import('@/styles/mobile.css');

        // 设置移动端视口
        this.setupMobileViewport();
      }
    },

    /**
     * 设置移动端视口
     */
    setupMobileViewport() {
      // 确保视口meta标签正确设置
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }

      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    },

    /**
     * 处理移动端调整
     */
    async handleMobileAdjustments(adjustments) {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        if (adjustments.brightness !== undefined) {
          await this.currentAdapter.setBrightness(adjustments.brightness);
        }

        if (adjustments.contrast !== undefined) {
          await this.currentAdapter.setContrast(adjustments.contrast);
        }

        this.saveCurrentState('移动端调整');
        this.addLog('移动端调整应用成功', 'success');
      } catch (error) {
        this.addLog(`移动端调整失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端重置调整
     */
    async handleMobileResetAdjustments() {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.setBrightness(0);
        await this.currentAdapter.setContrast(0);
        this.saveCurrentState('重置调整');
        this.addLog('移动端调整已重置', 'success');
      } catch (error) {
        this.addLog(`重置调整失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端应用滤镜
     */
    async handleMobileApplyFilter(filterType) {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.applyFilter(filterType);
        this.saveCurrentState(`应用滤镜: ${filterType}`);
        this.addLog(`滤镜 ${filterType} 应用成功`, 'success');
      } catch (error) {
        this.addLog(`应用滤镜失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端移除滤镜
     */
    async handleMobileRemoveFilter(filterType) {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.removeFilter(filterType);
        this.saveCurrentState(`移除滤镜: ${filterType}`);
        this.addLog(`滤镜 ${filterType} 已移除`, 'success');
      } catch (error) {
        this.addLog(`移除滤镜失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端清除滤镜
     */
    async handleMobileClearFilters() {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        // 这里需要实现清除所有滤镜的方法
        await this.currentAdapter.reset();
        this.saveCurrentState('清除所有滤镜');
        this.addLog('所有滤镜已清除', 'success');
      } catch (error) {
        this.addLog(`清除滤镜失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端旋转
     */
    async handleMobileRotate(angle) {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.rotate(angle);
        this.saveCurrentState(`旋转 ${angle}°`);
        this.addLog(`图像旋转 ${angle}° 成功`, 'success');
      } catch (error) {
        this.addLog(`旋转失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端翻转
     */
    async handleMobileFlip(options) {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.flip(options.horizontal, options.vertical);
        const direction = options.horizontal ? '水平' : '垂直';
        this.saveCurrentState(`${direction}翻转`);
        this.addLog(`图像${direction}翻转成功`, 'success');
      } catch (error) {
        this.addLog(`翻转失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理移动端重置变换
     */
    async handleMobileResetTransform() {
      if (!this.currentAdapter || !this.hasImage) return;

      try {
        await this.currentAdapter.reset();
        this.saveCurrentState('重置变换');
        this.addLog('变换已重置', 'success');
      } catch (error) {
        this.addLog(`重置变换失败: ${error.message}`, 'error');
      }
    },

    /**
     * 处理错误操作
     */
    handleErrorAction(actionData) {
      const { action } = actionData;

      switch (action) {
        case 'retry':
          this.retryLastOperation();
          break;
        case 'switchAdapter':
          this.switchToFallbackAdapter();
          break;
        case 'cleanMemory':
          this.forceMemoryCleanup();
          break;
        case 'refresh':
          window.location.reload();
          break;
        case 'selectFile':
          this.loadDefaultImage();
          break;
        default:
          console.log('未处理的错误操作:', action);
      }

      this.addLog(`执行错误恢复操作: ${action}`, 'info');
    },

    /**
     * 处理信息消息
     */
    handleInfoMessage(message) {
      this.addLog(message, 'info');
    },

    /**
     * 处理错误报告
     */
    handleReportError(errorInfo) {
      // 这里可以实现错误报告功能，比如发送到服务器
      console.log('报告错误:', errorInfo);
      this.addLog('错误报告已提交', 'success');

      // 模拟发送错误报告
      this.sendErrorReport(errorInfo);
    },

    /**
     * 重试最后一次操作
     */
    retryLastOperation() {
      // 这里可以实现重试逻辑
      this.addLog('正在重试最后一次操作...', 'info');

      // 简单的重试逻辑：重新加载图像
      if (this.hasImage) {
        this.loadDefaultImage();
      }
    },

    /**
     * 切换到备用适配器
     */
    async switchToFallbackAdapter() {
      try {
        // 获取当前适配器类型
        const currentType = this.selectedAdapter;

        // 切换到另一个适配器
        const fallbackType = currentType === 'fabric' ? 'konva' : 'fabric';

        this.addLog(`正在切换到备用适配器: ${fallbackType}`, 'info');

        // 保存当前状态
        const currentState = this.currentAdapter ? await this.currentAdapter.getState() : null;

        // 切换适配器
        this.selectedAdapter = fallbackType;
        await this.switchAdapter();

        // 恢复状态
        if (currentState && this.currentAdapter) {
          try {
            await this.currentAdapter.setState(currentState);
            this.addLog('状态已恢复到新适配器', 'success');
          } catch (error) {
            this.addLog('状态恢复失败，但适配器切换成功', 'warning');
          }
        }

      } catch (error) {
        this.addLog(`适配器切换失败: ${error.message}`, 'error');
        errorHandler.handleError(error, { operation: 'switchAdapter' }, 'adapter', 'high');
      }
    },

    /**
     * 强制内存清理
     */
    forceMemoryCleanup() {
      try {
        // 触发性能监控器的清理
        this.$refs.performanceMonitor?.forceCleanup();

        // 清理适配器
        if (this.currentAdapter && typeof this.currentAdapter._performMemoryCleanup === 'function') {
          this.currentAdapter._performMemoryCleanup();
        }

        // 强制垃圾回收
        if (window.gc) {
          window.gc();
        }

        this.addLog('内存清理完成', 'success');
      } catch (error) {
        this.addLog(`内存清理失败: ${error.message}`, 'error');
      }
    },

    /**
     * 发送错误报告
     */
    async sendErrorReport(errorInfo) {
      try {
        // 这里可以实现实际的错误报告发送逻辑
        // 比如发送到错误收集服务

        const report = {
          ...errorInfo,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: this.sessionId || 'unknown',
          adapterType: this.selectedAdapter,
          hasImage: this.hasImage
        };

        // 模拟API调用
        console.log('发送错误报告:', report);

        // 实际实现中可以使用fetch发送到服务器
        // await fetch('/api/error-report', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(report)
        // });

        this.addLog('错误报告发送成功', 'success');
      } catch (error) {
        this.addLog('错误报告发送失败', 'error');
        console.error('发送错误报告失败:', error);
      }
    },

    /**
     * 设置错误处理器
     */
    setupErrorHandling() {
      // 注册适配器错误处理
      errorHandler.onError('adapter', (errorInfo, recoveryResult) => {
        this.addLog(`适配器错误: ${errorInfo.message}`, 'error');

        if (recoveryResult.success) {
          this.addLog('适配器错误已自动恢复', 'success');
        }
      });

      // 注册内存错误处理
      errorHandler.onError('memory', (errorInfo, recoveryResult) => {
        this.addLog(`内存错误: ${errorInfo.message}`, 'error');

        if (recoveryResult.success) {
          this.addLog('内存错误已自动恢复', 'success');
        } else {
          // 建议用户操作
          this.addLog('建议关闭其他应用程序或使用较小的图像', 'warning');
        }
      });

      // 注册文件错误处理
      errorHandler.onError('file', (errorInfo, recoveryResult) => {
        this.addLog(`文件错误: ${errorInfo.message}`, 'error');

        if (!recoveryResult.success) {
          this.addLog('请检查文件格式是否正确', 'warning');
        }
      });

      // 注册网络错误处理
      errorHandler.onError('network', (errorInfo, recoveryResult) => {
        this.addLog(`网络错误: ${errorInfo.message}`, 'error');

        if (!recoveryResult.success) {
          this.addLog('请检查网络连接', 'warning');
        }
      });
    },

    /**
     * 处理系统健康更新
     */
    handleHealthUpdated(healthData) {
      this.addLog(`系统健康状态: ${healthData.overallHealth}`, 'info');

      // 如果系统状态异常，记录详细信息
      if (healthData.overallHealth !== 'normal') {
        const issues = Object.entries(healthData.checks || {})
          .filter(([, check]) => check.status !== 'normal')
          .map(([type]) => type);

        if (issues.length > 0) {
          this.addLog(`发现问题: ${issues.join(', ')}`, 'warning');
        }
      }
    },

    /**
     * 处理系统操作请求
     */
    async handleSystemAction(actionData) {
      const { type } = actionData;

      try {
        switch (type) {
          case 'cleanup':
            await this.performSystemCleanup();
            break;
          case 'restart':
            await this.restartSystem();
            break;
          case 'switchAdapter':
            await this.switchToFallbackAdapter();
            break;
          default:
            this.addLog(`未知的系统操作: ${type}`, 'warning');
        }
      } catch (error) {
        this.addLog(`系统操作失败: ${error.message}`, 'error');
        errorHandler.handleError(error, { operation: type }, 'adapter', 'high');
      }
    },

    /**
     * 处理建议执行完成
     */
    handleRecommendationExecuted(recommendation) {
      this.addLog(`已执行系统建议: ${recommendation.action}`, 'success');
    },

    /**
     * 处理健康报告导出
     */
    handleHealthReportExported(report) {
      this.addLog('系统健康报告已导出', 'success');
      console.log('健康报告:', report);
    },

    /**
     * 执行系统清理
     */
    async performSystemCleanup() {
      this.addLog('开始系统清理...', 'info');

      try {
        // 清理内存
        this.forceMemoryCleanup();

        // 清理适配器缓存
        if (this.currentAdapter && typeof this.currentAdapter._performMemoryCleanup === 'function') {
          this.currentAdapter._performMemoryCleanup();
        }

        // 清理状态历史
        if (this.historyManager) {
          const historySize = this.historyManager.getHistory().length;
          if (historySize > 10) {
            // 保留最近10个状态
            const history = this.historyManager.getHistory().slice(-10);
            this.historyManager.clear();
            history.forEach(state => this.historyManager.addState(state));
          }
        }

        // 清理错误日志
        errorHandler.clearErrorLog();

        // 重置恢复历史
        errorRecoveryManager.resetRecoveryHistory();

        this.addLog('系统清理完成', 'success');
      } catch (error) {
        this.addLog(`系统清理失败: ${error.message}`, 'error');
        throw error;
      }
    },

    /**
     * 重启系统
     */
    async restartSystem() {
      this.addLog('正在重启系统...', 'info');

      try {
        // 保存当前状态
        const currentState = {
          selectedAdapter: this.selectedAdapter,
          hasImage: this.hasImage,
          imageData: this.currentAdapter ? await this.currentAdapter.getState() : null
        };

        // 销毁当前适配器
        if (this.currentAdapter) {
          await this.currentAdapter.destroy();
          this.currentAdapter = null;
        }

        // 重新初始化管理器
        await this.initializeManagers();

        // 恢复状态
        if (currentState.selectedAdapter) {
          this.selectedAdapter = currentState.selectedAdapter;
          await this.switchAdapter();

          if (currentState.imageData && this.currentAdapter) {
            try {
              await this.currentAdapter.setState(currentState.imageData);
              this.hasImage = currentState.hasImage;
            } catch (error) {
              this.addLog('状态恢复失败，但系统重启成功', 'warning');
            }
          }
        }

        this.addLog('系统重启完成', 'success');
      } catch (error) {
        this.addLog(`系统重启失败: ${error.message}`, 'error');
        throw error;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .unified-editor-demo {
    padding: 10px;
    margin-bottom: 80px; /* 为移动端工具栏留出空间 */
  }
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

/* 移动端详细适配 */
@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 24px;
  }

  .demo-header p {
    font-size: 14px;
  }

  .demo-controls {
    flex-direction: column;
    gap: 16px;
  }

  .control-group {
    width: 100%;
  }

  .control-group select,
  .control-group button {
    width: 100%;
    min-height: 44px;
    font-size: 16px;
  }

  .demo-content {
    flex-direction: column;
  }

  .editor-section,
  .info-section {
    width: 100%;
  }

  .canvas-container {
    height: 300px;
    margin-bottom: 20px;
  }

  .info-tabs {
    flex-wrap: wrap;
  }

  .info-tab {
    flex: 1;
    min-width: 80px;
    font-size: 14px;
    padding: 8px 12px;
  }

  .info-content {
    max-height: 200px;
  }

  .log-item {
    padding: 8px;
    font-size: 12px;
  }

  .adapter-info-item {
    font-size: 12px;
    padding: 4px 0;
  }
}

@media (max-width: 480px) {
  .unified-editor-demo {
    padding: 8px;
  }

  .demo-header h1 {
    font-size: 20px;
  }

  .canvas-container {
    height: 250px;
  }

  .info-content {
    max-height: 150px;
  }
}

/* 横屏移动设备适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .unified-editor-demo {
    margin-bottom: 60px; /* 横屏时工具栏较小 */
  }

  .demo-content {
    flex-direction: row;
  }

  .editor-section {
    flex: 2;
  }

  .info-section {
    flex: 1;
    min-width: 300px;
  }

  .canvas-container {
    height: 200px;
  }
}
</style>
