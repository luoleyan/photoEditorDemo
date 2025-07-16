<template>
  <div class="mobile-performance-monitor-wrapper">
    <!-- 性能监控主面板 -->
    <div v-if="showMonitor" class="mobile-performance-monitor">
      <div class="monitor-header">
        <h4>性能监控</h4>
        <button class="close-button" @click="hideMonitor">×</button>
      </div>

      <div class="monitor-content">
        <!-- 实时性能指标 -->
        <div class="performance-metrics">
          <div class="metric-item">
            <span class="metric-label">FPS</span>
            <span class="metric-value" :class="getFPSClass()">{{ currentFPS }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">内存</span>
            <span class="metric-value" :class="getMemoryClass()">{{ formatMemory(memoryUsage) }}</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">电池</span>
            <span class="metric-value" :class="getBatteryClass()">{{ batteryLevel }}%</span>
          </div>

          <div class="metric-item">
            <span class="metric-label">网络</span>
            <span class="metric-value" :class="getNetworkClass()">{{ networkType }}</span>
          </div>
        </div>

        <!-- 性能图表 -->
        <div class="performance-chart">
          <canvas ref="performanceChart" width="300" height="100"></canvas>
        </div>

        <!-- 优化建议 -->
        <div v-if="optimizationSuggestions.length > 0" class="optimization-suggestions">
          <h5>优化建议</h5>
          <ul>
            <li v-for="suggestion in optimizationSuggestions" :key="suggestion.id" class="suggestion-item">
              <span class="suggestion-icon">{{ suggestion.icon }}</span>
              <span class="suggestion-text">{{ suggestion.text }}</span>
              <button
                v-if="suggestion.action"
                class="suggestion-action"
                @click="applySuggestion(suggestion)"
              >
                应用
              </button>
            </li>
          </ul>
        </div>

        <!-- 快速操作 -->
        <div class="quick-actions">
          <button class="action-button" @click="clearCache">
            🗑️ 清理缓存
          </button>
          <button class="action-button" @click="optimizeMemory">
            🧹 内存优化
          </button>
          <button class="action-button" @click="enablePowerSaving">
            🔋 省电模式
          </button>
        </div>
      </div>
    </div>

    <!-- 性能警告浮层 -->
    <div v-if="showPerformanceWarning" class="performance-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">{{ performanceWarning.message }}</span>
        <button class="warning-action" @click="handlePerformanceWarning">
          {{ performanceWarning.action }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { memoryManager } from '@/utils/MemoryManager.js';

export default {
  name: 'MobilePerformanceMonitor',
  
  data() {
    return {
      showMonitor: false,
      
      // 性能指标
      currentFPS: 60,
      memoryUsage: 0,
      batteryLevel: 100,
      networkType: 'wifi',
      
      // 性能历史数据
      performanceHistory: {
        fps: [],
        memory: [],
        battery: []
      },
      
      // 监控状态
      isMonitoring: false,
      monitoringInterval: null,
      
      // 优化建议
      optimizationSuggestions: [],
      
      // 性能警告
      showPerformanceWarning: false,
      performanceWarning: null,
      
      // 设备信息
      deviceInfo: {
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        deviceMemory: navigator.deviceMemory || 4,
        connection: null
      },
      
      // 阈值设置
      thresholds: {
        lowFPS: 30,
        highMemory: 0.8,
        lowBattery: 0.2,
        slowNetwork: '2g'
      }
    };
  },
  
  mounted() {
    this.initializeMonitoring();
    this.detectDeviceCapabilities();
  },
  
  beforeDestroy() {
    this.stopMonitoring();
  },
  
  methods: {
    /**
     * 初始化性能监控
     */
    initializeMonitoring() {
      // 检测设备信息
      if (navigator.connection) {
        this.deviceInfo.connection = navigator.connection;
        this.networkType = navigator.connection.effectiveType || 'unknown';
        
        navigator.connection.addEventListener('change', () => {
          this.networkType = navigator.connection.effectiveType || 'unknown';
        });
      }

      // 检测电池状态
      if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
          this.batteryLevel = Math.round(battery.level * 100);
          
          battery.addEventListener('levelchange', () => {
            this.batteryLevel = Math.round(battery.level * 100);
          });
        });
      }

      // 开始监控
      this.startMonitoring();
    },

    /**
     * 开始性能监控
     */
    startMonitoring() {
      if (this.isMonitoring) return;

      this.isMonitoring = true;
      this.monitoringInterval = setInterval(() => {
        this.updatePerformanceMetrics();
        this.checkPerformanceThresholds();
        this.updatePerformanceChart();
      }, 1000);
    },

    /**
     * 停止性能监控
     */
    stopMonitoring() {
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      this.isMonitoring = false;
    },

    /**
     * 更新性能指标
     */
    updatePerformanceMetrics() {
      // 更新FPS
      this.updateFPS();
      
      // 更新内存使用
      this.updateMemoryUsage();
      
      // 记录历史数据
      this.recordPerformanceHistory();
    },

    /**
     * 更新FPS
     */
    updateFPS() {
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          this.currentFPS = Math.round(frameCount * 1000 / (currentTime - lastTime));
          frameCount = 0;
          lastTime = currentTime;
        }
        
        if (this.isMonitoring) {
          requestAnimationFrame(measureFPS);
        }
      };
      
      requestAnimationFrame(measureFPS);
    },

    /**
     * 更新内存使用
     */
    updateMemoryUsage() {
      if (performance.memory) {
        this.memoryUsage = performance.memory.usedJSHeapSize;
      } else {
        this.memoryUsage = memoryManager.getMemoryUsage();
      }
    },

    /**
     * 记录性能历史
     */
    recordPerformanceHistory() {
      const timestamp = Date.now();
      
      this.performanceHistory.fps.push({ value: this.currentFPS, timestamp });
      this.performanceHistory.memory.push({ value: this.memoryUsage, timestamp });
      this.performanceHistory.battery.push({ value: this.batteryLevel, timestamp });
      
      // 保持最近60个数据点
      Object.keys(this.performanceHistory).forEach(key => {
        if (this.performanceHistory[key].length > 60) {
          this.performanceHistory[key].shift();
        }
      });
    },

    /**
     * 检查性能阈值
     */
    checkPerformanceThresholds() {
      const suggestions = [];
      
      // 检查FPS
      if (this.currentFPS < this.thresholds.lowFPS) {
        suggestions.push({
          id: 'low-fps',
          icon: '🐌',
          text: `帧率较低 (${this.currentFPS}fps)，建议降低图像质量`,
          action: 'reduceQuality'
        });
      }
      
      // 检查内存
      const memoryRatio = this.memoryUsage / (this.deviceInfo.deviceMemory * 1024 * 1024 * 1024);
      if (memoryRatio > this.thresholds.highMemory) {
        suggestions.push({
          id: 'high-memory',
          icon: '💾',
          text: '内存使用过高，建议清理缓存',
          action: 'clearCache'
        });
      }
      
      // 检查电池
      if (this.batteryLevel < this.thresholds.lowBattery * 100) {
        suggestions.push({
          id: 'low-battery',
          icon: '🔋',
          text: '电量较低，建议启用省电模式',
          action: 'enablePowerSaving'
        });
      }
      
      // 检查网络
      if (this.networkType === '2g' || this.networkType === 'slow-2g') {
        suggestions.push({
          id: 'slow-network',
          icon: '📶',
          text: '网络较慢，建议使用离线模式',
          action: 'enableOfflineMode'
        });
      }
      
      this.optimizationSuggestions = suggestions;
      
      // 显示严重性能警告
      if (suggestions.length > 2) {
        this.showPerformanceWarning = true;
        this.performanceWarning = {
          message: '检测到多个性能问题，建议进行优化',
          action: '立即优化'
        };
      }
    },

    /**
     * 更新性能图表
     */
    updatePerformanceChart() {
      const canvas = this.$refs.performanceChart;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // 清除画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制FPS曲线
      this.drawPerformanceLine(ctx, this.performanceHistory.fps, '#4CAF50', width, height, 0, 60);
      
      // 绘制内存使用曲线
      const maxMemory = this.deviceInfo.deviceMemory * 1024 * 1024 * 1024;
      this.drawPerformanceLine(ctx, this.performanceHistory.memory, '#FF9800', width, height, 0, maxMemory);
    },

    /**
     * 绘制性能曲线
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Array} data - 数据数组
     * @param {string} color - 线条颜色
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     */
    drawPerformanceLine(ctx, data, color, width, height, min, max) {
      if (data.length < 2) return;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((point.value - min) / (max - min)) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    },

    /**
     * 应用优化建议
     * @param {Object} suggestion - 建议对象
     */
    applySuggestion(suggestion) {
      switch (suggestion.action) {
        case 'reduceQuality':
          this.$emit('reduce-quality');
          break;
        case 'clearCache':
          this.clearCache();
          break;
        case 'enablePowerSaving':
          this.enablePowerSaving();
          break;
        case 'enableOfflineMode':
          this.$emit('enable-offline-mode');
          break;
      }
      
      // 移除已应用的建议
      this.optimizationSuggestions = this.optimizationSuggestions.filter(s => s.id !== suggestion.id);
    },

    /**
     * 清理缓存
     */
    clearCache() {
      memoryManager.forceCleanup();
      this.$emit('cache-cleared');
    },

    /**
     * 内存优化
     */
    optimizeMemory() {
      memoryManager.forceCleanup();
      // 触发垃圾回收（如果可能）
      if (window.gc) {
        window.gc();
      }
      this.$emit('memory-optimized');
    },

    /**
     * 启用省电模式
     */
    enablePowerSaving() {
      this.$emit('enable-power-saving');
    },

    /**
     * 检测设备能力
     */
    detectDeviceCapabilities() {
      // 检测是否为低端设备
      const isLowEndDevice = this.deviceInfo.hardwareConcurrency <= 2 || 
                            this.deviceInfo.deviceMemory <= 2;
      
      if (isLowEndDevice) {
        this.$emit('low-end-device-detected');
      }
    },

    /**
     * 处理性能警告
     */
    handlePerformanceWarning() {
      this.showPerformanceWarning = false;
      this.showMonitor = true;
    },

    /**
     * 显示监控器
     */
    showMonitorPanel() {
      this.$data.showMonitor = true;
    },

    /**
     * 隐藏监控器
     */
    hideMonitor() {
      this.$data.showMonitor = false;
    },

    // ========== 样式类方法 ==========

    getFPSClass() {
      return this.currentFPS < this.thresholds.lowFPS ? 'metric-warning' : 'metric-good';
    },

    getMemoryClass() {
      const ratio = this.memoryUsage / (this.deviceInfo.deviceMemory * 1024 * 1024 * 1024);
      return ratio > this.thresholds.highMemory ? 'metric-warning' : 'metric-good';
    },

    getBatteryClass() {
      return this.batteryLevel < this.thresholds.lowBattery * 100 ? 'metric-warning' : 'metric-good';
    },

    getNetworkClass() {
      return this.networkType === '2g' || this.networkType === 'slow-2g' ? 'metric-warning' : 'metric-good';
    },

    /**
     * 格式化内存显示
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的字符串
     */
    formatMemory(bytes) {
      const mb = bytes / (1024 * 1024);
      return mb < 1024 ? `${mb.toFixed(1)}MB` : `${(mb / 1024).toFixed(1)}GB`;
    }
  }
};
</script>

<style scoped>
.mobile-performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.monitor-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-button:hover {
  background: #f0f0f0;
}

.monitor-content {
  padding: 16px;
}

.performance-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
}

.metric-good {
  color: #4CAF50;
}

.metric-warning {
  color: #FF5722;
}

.performance-chart {
  margin-bottom: 16px;
  text-align: center;
}

.performance-chart canvas {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.optimization-suggestions h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-icon {
  font-size: 16px;
}

.suggestion-text {
  flex: 1;
  font-size: 12px;
  color: #666;
}

.suggestion-action {
  background: #1890ff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.action-button {
  flex: 1;
  padding: 8px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover {
  background: #e0e0e0;
}

.performance-warning {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #FF5722;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
  z-index: 1001;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-action {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-performance-monitor {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style>
