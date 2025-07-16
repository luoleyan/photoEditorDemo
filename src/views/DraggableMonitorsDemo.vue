<template>
  <div class="draggable-monitors-demo">
    <div class="demo-header">
      <h1>可拖拽监控控件演示</h1>
      <p>演示系统状态监控和性能监控控件的拖拽、边缘吸附和冲突避免功能</p>
      
      <div class="demo-controls">
        <button @click="resetPositions" class="control-btn">重置位置</button>
        <button @click="toggleMonitors" class="control-btn">
          {{ showMonitors ? '隐藏监控器' : '显示监控器' }}
        </button>
        <button @click="simulateConflict" class="control-btn">模拟冲突</button>
      </div>
      
      <div class="demo-info">
        <div class="info-item">
          <strong>拖拽功能：</strong>点击并拖拽监控器头部的 ⋮⋮ 图标或整个头部区域
        </div>
        <div class="info-item">
          <strong>边缘吸附：</strong>将监控器拖拽到屏幕边缘会自动吸附并部分隐藏
        </div>
        <div class="info-item">
          <strong>边缘指示器：</strong>拖拽时接近边缘会显示彩色指示器，提示可吸附位置
        </div>
        <div class="info-item">
          <strong>吸附状态标识：</strong>吸附后显示明确的位置标识，如"已吸附到右边缘"
        </div>
        <div class="info-item">
          <strong>冲突避免：</strong>当两个监控器重叠时会自动调整位置
        </div>
        <div class="info-item">
          <strong>触发区域：</strong>吸附后点击边缘的触发区域可重新展开，区域显示位置提示
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="demo-content">
      <div class="content-placeholder">
        <h2>主要内容区域</h2>
        <p>这里是应用的主要内容区域。监控控件会浮动在内容之上，不会影响主要内容的布局。</p>
        
        <div class="feature-grid">
          <div class="feature-card">
            <h3>图像编辑</h3>
            <p>支持多种图像编辑功能，包括裁剪、旋转、滤镜等。</p>
          </div>
          <div class="feature-card">
            <h3>性能优化</h3>
            <p>实时监控内存使用和性能指标，确保应用流畅运行。</p>
          </div>
          <div class="feature-card">
            <h3>错误处理</h3>
            <p>智能错误检测和恢复机制，提供稳定的用户体验。</p>
          </div>
          <div class="feature-card">
            <h3>移动适配</h3>
            <p>针对移动设备优化的界面和交互体验。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 监控控件 -->
    <template v-if="showMonitors">
      <!-- 性能监控器 -->
      <PerformanceMonitor
        ref="performanceMonitor"
        @drag-start="handleDragStart('performance')"
        @drag-end="handleDragEnd('performance')"
        @snapped="handleSnapped('performance', $event)"
        @unsnapped="handleUnsnapped('performance')"
        @trigger-hover="handleTriggerHover('performance')"
        @edge-indicator-show="handleEdgeIndicatorShow('performance', $event)"
        @edge-indicator-hide="handleEdgeIndicatorHide('performance')"
      />

      <!-- 系统健康监控器 -->
      <SystemHealthMonitor
        ref="systemHealthMonitor"
        @drag-start="handleDragStart('system')"
        @drag-end="handleDragEnd('system')"
        @snapped="handleSnapped('system', $event)"
        @unsnapped="handleUnsnapped('system')"
        @trigger-hover="handleTriggerHover('system')"
        @edge-indicator-show="handleEdgeIndicatorShow('system', $event)"
        @edge-indicator-hide="handleEdgeIndicatorHide('system')"
        @health-updated="handleHealthUpdated"
        @action-request="handleSystemAction"
        @recommendation-executed="handleRecommendationExecuted"
        @report-exported="handleHealthReportExported"
      />
    </template>

    <!-- 事件日志 -->
    <div class="event-log" v-if="showEventLog">
      <h3>事件日志</h3>
      <div class="log-controls">
        <button @click="clearEventLog" class="clear-btn">清空日志</button>
        <button @click="showEventLog = false" class="close-btn">×</button>
      </div>
      <div class="log-entries">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index"
          class="log-entry"
          :class="`log-${event.type}`"
        >
          <span class="log-time">{{ event.time }}</span>
          <span class="log-message">{{ event.message }}</span>
        </div>
      </div>
    </div>

    <!-- 显示事件日志按钮 -->
    <button 
      v-if="!showEventLog && eventLog.length > 0"
      @click="showEventLog = true"
      class="show-log-btn"
    >
      显示事件日志 ({{ eventLog.length }})
    </button>
  </div>
</template>

<script>
import PerformanceMonitor from '@/components/ui/PerformanceMonitor.vue';
import SystemHealthMonitor from '@/components/ui/SystemHealthMonitor.vue';

export default {
  name: 'DraggableMonitorsDemo',
  components: {
    PerformanceMonitor,
    SystemHealthMonitor
  },
  data() {
    return {
      showMonitors: true,
      showEventLog: false,
      eventLog: [],
      maxLogEntries: 50
    };
  },
  methods: {
    /**
     * 处理拖拽开始事件
     */
    handleDragStart(monitorType) {
      this.addEventLog('info', `${monitorType} 监控器开始拖拽`);
    },

    /**
     * 处理拖拽结束事件
     */
    handleDragEnd(monitorType, position) {
      this.addEventLog('info', `${monitorType} 监控器拖拽结束，位置: (${position?.x || 0}, ${position?.y || 0})`);
    },

    /**
     * 处理吸附事件
     */
    handleSnapped(monitorType, edge) {
      this.addEventLog('success', `${monitorType} 监控器吸附到 ${edge} 边缘`);
    },

    /**
     * 处理取消吸附事件
     */
    handleUnsnapped(monitorType) {
      this.addEventLog('info', `${monitorType} 监控器取消吸附`);
    },

    /**
     * 处理触发区域悬停
     */
    handleTriggerHover(monitorType) {
      this.addEventLog('info', `${monitorType} 监控器触发区域悬停`);
    },

    /**
     * 处理边缘指示器显示
     */
    handleEdgeIndicatorShow(monitorType, { edge, distance, opacity }) {
      this.addEventLog('info', `${monitorType} 监控器显示${this.getEdgeDisplayName(edge)}边缘指示器 (距离: ${Math.round(distance)}px, 透明度: ${opacity.toFixed(2)})`);
    },

    /**
     * 处理边缘指示器隐藏
     */
    handleEdgeIndicatorHide(monitorType) {
      this.addEventLog('info', `${monitorType} 监控器隐藏边缘指示器`);
    },

    /**
     * 重置监控器位置
     */
    resetPositions() {
      if (this.$refs.performanceMonitor) {
        this.$refs.performanceMonitor.position = { x: 20, y: 20, isSnapped: false, snapEdge: null };
        this.$refs.performanceMonitor.savePosition();
      }
      if (this.$refs.systemHealthMonitor) {
        this.$refs.systemHealthMonitor.position = { x: 20, y: 80, isSnapped: false, snapEdge: null };
        this.$refs.systemHealthMonitor.savePosition();
      }
      this.addEventLog('success', '监控器位置已重置');
    },

    /**
     * 切换监控器显示
     */
    toggleMonitors() {
      this.showMonitors = !this.showMonitors;
      this.addEventLog('info', `监控器${this.showMonitors ? '显示' : '隐藏'}`);
    },

    /**
     * 模拟冲突情况
     */
    simulateConflict() {
      if (this.$refs.performanceMonitor && this.$refs.systemHealthMonitor) {
        // 将两个监控器移动到相近位置
        this.$refs.performanceMonitor.position = { x: 100, y: 100, isSnapped: false, snapEdge: null };
        this.$refs.systemHealthMonitor.position = { x: 110, y: 110, isSnapped: false, snapEdge: null };
        
        // 触发冲突检测
        this.$refs.systemHealthMonitor.avoidConflicts();
        
        this.addEventLog('warning', '模拟冲突情况，系统自动调整位置');
      }
    },

    /**
     * 添加事件日志
     */
    addEventLog(type, message) {
      const event = {
        type,
        message,
        time: new Date().toLocaleTimeString()
      };
      
      this.eventLog.unshift(event);
      
      // 限制日志条目数量
      if (this.eventLog.length > this.maxLogEntries) {
        this.eventLog = this.eventLog.slice(0, this.maxLogEntries);
      }
    },

    /**
     * 清空事件日志
     */
    clearEventLog() {
      this.eventLog = [];
    },

    /**
     * 处理系统健康更新
     */
    handleHealthUpdated(health) {
      this.addEventLog('info', `系统健康状态更新: ${health.overallHealth}`);
    },

    /**
     * 处理系统操作请求
     */
    handleSystemAction(action) {
      this.addEventLog('info', `系统操作请求: ${action}`);
    },

    /**
     * 处理建议执行
     */
    handleRecommendationExecuted(recommendation) {
      this.addEventLog('success', `执行建议: ${recommendation.action}`);
    },

    /**
     * 处理健康报告导出
     */
    handleHealthReportExported() {
      this.addEventLog('success', '健康报告已导出');
    },

    /**
     * 获取边缘显示名称
     */
    getEdgeDisplayName(edge) {
      const names = {
        top: '顶部',
        bottom: '底部',
        left: '左侧',
        right: '右侧'
      };
      return names[edge] || '';
    }
  },
  
  mounted() {
    this.addEventLog('success', '可拖拽监控控件演示页面已加载');
  }
};
</script>

<style scoped>
.draggable-monitors-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.demo-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.demo-header p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 16px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.demo-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #007bff;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
}

.info-item:last-child {
  margin-bottom: 0;
}

.demo-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.content-placeholder h2 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.content-placeholder p {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.feature-card p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.event-log {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 400px;
  max-height: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  overflow: hidden;
}

.event-log h3 {
  margin: 0;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 16px;
  color: #333;
}

.log-controls {
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.clear-btn, .close-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #6c757d;
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.clear-btn:hover, .close-btn:hover {
  background: #5a6268;
}

.log-entries {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 12px;
}

.log-entry.log-info {
  background: #e3f2fd;
  color: #1976d2;
}

.log-entry.log-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.log-entry.log-warning {
  background: #fff3e0;
  color: #f57c00;
}

.log-time {
  font-weight: 500;
  min-width: 60px;
}

.show-log-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #28a745;
  color: white;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1800;
}

.show-log-btn:hover {
  background: #218838;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .draggable-monitors-demo {
    padding: 10px;
  }
  
  .demo-header {
    padding: 16px;
  }
  
  .demo-header h1 {
    font-size: 24px;
  }
  
  .demo-controls {
    flex-direction: column;
  }
  
  .control-btn {
    width: 100%;
  }
  
  .event-log {
    left: 10px;
    right: 10px;
    width: auto;
  }
  
  .show-log-btn {
    left: 10px;
    right: 10px;
    width: auto;
  }
}
</style>
