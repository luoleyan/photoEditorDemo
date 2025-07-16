<template>
  <div class="user-guidance-container">
    <!-- 新手引导遮罩 -->
    <div v-if="showOnboarding" class="onboarding-overlay" @click="skipOnboarding">
      <div class="onboarding-content" @click.stop>
        <div class="onboarding-header">
          <h2>欢迎使用图片编辑器！</h2>
          <button class="skip-button" @click="skipOnboarding">跳过引导</button>
        </div>
        
        <div class="onboarding-body">
          <div class="onboarding-step" v-if="currentOnboardingStep === 0">
            <div class="step-icon">📸</div>
            <h3>上传您的图片</h3>
            <p>点击"选择文件"按钮或直接拖拽图片到编辑区域开始编辑</p>
            <div class="step-highlight" :style="getHighlightStyle('upload-area')"></div>
          </div>

          <div class="onboarding-step" v-if="currentOnboardingStep === 1">
            <div class="step-icon">🎨</div>
            <h3>选择编辑工具</h3>
            <p>使用左侧工具栏选择文本、画笔、滤镜等编辑工具</p>
            <div class="step-highlight" :style="getHighlightStyle('toolbar')"></div>
          </div>

          <div class="onboarding-step" v-if="currentOnboardingStep === 2">
            <div class="step-icon">⚙️</div>
            <h3>调整工具设置</h3>
            <p>在右侧面板中调整工具的各种参数和设置</p>
            <div class="step-highlight" :style="getHighlightStyle('settings-panel')"></div>
          </div>

          <div class="onboarding-step" v-if="currentOnboardingStep === 3">
            <div class="step-icon">💾</div>
            <h3>保存您的作品</h3>
            <p>编辑完成后，点击"导出"按钮保存您的图片</p>
            <div class="step-highlight" :style="getHighlightStyle('export-button')"></div>
          </div>
        </div>

        <div class="onboarding-footer">
          <div class="step-indicators">
            <span 
              v-for="(step, index) in onboardingSteps" 
              :key="index"
              class="step-indicator"
              :class="{ 'active': index === currentOnboardingStep }"
            ></span>
          </div>
          
          <div class="onboarding-actions">
            <button 
              v-if="currentOnboardingStep > 0"
              class="nav-button prev"
              @click="previousOnboardingStep"
            >
              上一步
            </button>
            <button 
              v-if="currentOnboardingStep < onboardingSteps.length - 1"
              class="nav-button next"
              @click="nextOnboardingStep"
            >
              下一步
            </button>
            <button 
              v-if="currentOnboardingStep === onboardingSteps.length - 1"
              class="nav-button finish"
              @click="finishOnboarding"
            >
              开始使用
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上下文提示 -->
    <div v-if="showContextTip" class="context-tip" :style="contextTipStyle">
      <div class="tip-content">
        <div class="tip-icon">💡</div>
        <div class="tip-text">{{ contextTip.message }}</div>
        <button class="tip-close" @click="hideContextTip">×</button>
      </div>
      <div class="tip-arrow" :class="contextTip.position"></div>
    </div>

    <!-- 快速帮助按钮 -->
    <div class="quick-help-button" @click="toggleQuickHelp">
      <span class="help-icon">❓</span>
      <span class="help-text">帮助</span>
    </div>

    <!-- 快速帮助面板 -->
    <div v-if="showQuickHelp" class="quick-help-panel">
      <div class="help-header">
        <h3>快速帮助</h3>
        <button class="close-button" @click="toggleQuickHelp">×</button>
      </div>
      
      <div class="help-content">
        <div class="help-section">
          <h4>常用操作</h4>
          <div class="help-items">
            <div class="help-item" @click="showOperationGuidance('file_upload')">
              <span class="item-icon">📁</span>
              <span class="item-text">如何上传图片</span>
            </div>
            <div class="help-item" @click="showOperationGuidance('text_editing')">
              <span class="item-icon">✏️</span>
              <span class="item-text">添加和编辑文本</span>
            </div>
            <div class="help-item" @click="showOperationGuidance('brush_drawing')">
              <span class="item-icon">🖌️</span>
              <span class="item-text">使用画笔工具</span>
            </div>
            <div class="help-item" @click="showOperationGuidance('filter_application')">
              <span class="item-icon">🎨</span>
              <span class="item-text">应用滤镜效果</span>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h4>快捷键</h4>
          <div class="shortcut-items">
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Z</span>
              <span class="shortcut-desc">撤销</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + Y</span>
              <span class="shortcut-desc">重做</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Ctrl + S</span>
              <span class="shortcut-desc">保存</span>
            </div>
            <div class="shortcut-item">
              <span class="shortcut-key">Delete</span>
              <span class="shortcut-desc">删除选中对象</span>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h4>遇到问题？</h4>
          <div class="help-items">
            <div class="help-item" @click="showTroubleshooting('network_issues')">
              <span class="item-icon">🌐</span>
              <span class="item-text">网络连接问题</span>
            </div>
            <div class="help-item" @click="showTroubleshooting('performance_issues')">
              <span class="item-icon">⚡</span>
              <span class="item-text">性能问题</span>
            </div>
            <div class="help-item" @click="showTroubleshooting('feature_issues')">
              <span class="item-icon">🔧</span>
              <span class="item-text">功能问题</span>
            </div>
          </div>
        </div>
      </div>

      <div class="help-footer">
        <button class="help-action-button" @click="restartOnboarding">
          🎯 重新开始引导
        </button>
        <button class="help-action-button" @click="contactSupport">
          📞 联系技术支持
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { errorHandler } from '@/utils/ErrorHandler.js';

export default {
  name: 'UserGuidance',
  data() {
    return {
      // 新手引导
      showOnboarding: false,
      currentOnboardingStep: 0,
      onboardingSteps: [
        { id: 'upload', element: 'upload-area' },
        { id: 'tools', element: 'toolbar' },
        { id: 'settings', element: 'settings-panel' },
        { id: 'export', element: 'export-button' }
      ],
      
      // 上下文提示
      showContextTip: false,
      contextTip: null,
      contextTipStyle: {},
      
      // 快速帮助
      showQuickHelp: false,
      
      // 用户偏好
      userPreferences: {
        showOnboarding: true,
        showContextTips: true,
        completedOnboarding: false
      }
    };
  },
  
  mounted() {
    this.loadUserPreferences();
    this.setupGuidanceHandlers();
    
    // 检查是否需要显示新手引导
    if (this.userPreferences.showOnboarding && !this.userPreferences.completedOnboarding) {
      setTimeout(() => {
        this.showOnboarding = true;
      }, 1000);
    }
  },
  
  methods: {
    /**
     * 加载用户偏好设置
     */
    loadUserPreferences() {
      const saved = localStorage.getItem('photo-editor-user-preferences');
      if (saved) {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      }
    },
    
    /**
     * 保存用户偏好设置
     */
    saveUserPreferences() {
      localStorage.setItem('photo-editor-user-preferences', JSON.stringify(this.userPreferences));
    },
    
    /**
     * 设置指导处理器
     */
    setupGuidanceHandlers() {
      // 监听错误处理器的指导事件
      errorHandler.onUserGuidance((guidance, context) => {
        this.$emit('show-guidance', guidance, context);
      });
      
      errorHandler.onContextualHelp((troubleshooting, context) => {
        this.$emit('show-troubleshooting', troubleshooting, context);
      });
    },
    
    // ========== 新手引导方法 ==========
    
    /**
     * 下一步引导
     */
    nextOnboardingStep() {
      if (this.currentOnboardingStep < this.onboardingSteps.length - 1) {
        this.currentOnboardingStep++;
      }
    },
    
    /**
     * 上一步引导
     */
    previousOnboardingStep() {
      if (this.currentOnboardingStep > 0) {
        this.currentOnboardingStep--;
      }
    },
    
    /**
     * 跳过引导
     */
    skipOnboarding() {
      this.showOnboarding = false;
      this.userPreferences.showOnboarding = false;
      this.saveUserPreferences();
    },
    
    /**
     * 完成引导
     */
    finishOnboarding() {
      this.showOnboarding = false;
      this.userPreferences.completedOnboarding = true;
      this.saveUserPreferences();
      this.$emit('onboarding-completed');
    },
    
    /**
     * 重新开始引导
     */
    restartOnboarding() {
      this.currentOnboardingStep = 0;
      this.showOnboarding = true;
      this.showQuickHelp = false;
    },
    
    /**
     * 获取高亮样式
     * @param {string} elementId - 元素ID
     * @returns {Object} 样式对象
     */
    getHighlightStyle(elementId) {
      const element = document.getElementById(elementId) || document.querySelector(`[data-guide="${elementId}"]`);
      if (!element) return {};
      
      const rect = element.getBoundingClientRect();
      return {
        position: 'fixed',
        top: `${rect.top - 4}px`,
        left: `${rect.left - 4}px`,
        width: `${rect.width + 8}px`,
        height: `${rect.height + 8}px`,
        border: '2px solid #1890ff',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 1001
      };
    },
    
    // ========== 上下文提示方法 ==========
    
    /**
     * 显示上下文提示
     * @param {Object} tip - 提示信息
     * @param {HTMLElement} targetElement - 目标元素
     */
    showContextTip(tip, targetElement) {
      if (!this.userPreferences.showContextTips) return;

      this.contextTip = tip;
      this.contextTipStyle = this.calculateTipPosition(targetElement);
      this.$data.showContextTip = true;

      // 自动隐藏
      setTimeout(() => {
        this.hideContextTip();
      }, 5000);
    },
    
    /**
     * 隐藏上下文提示
     */
    hideContextTip() {
      this.$data.showContextTip = false;
      this.contextTip = null;
    },
    
    /**
     * 计算提示位置
     * @param {HTMLElement} targetElement - 目标元素
     * @returns {Object} 位置样式
     */
    calculateTipPosition(targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tipWidth = 250;
      const tipHeight = 80;
      
      // 默认显示在元素上方
      let top = rect.top - tipHeight - 10;
      let left = rect.left + (rect.width - tipWidth) / 2;
      
      // 边界检查
      if (top < 10) {
        top = rect.bottom + 10;
        this.contextTip.position = 'top';
      } else {
        this.contextTip.position = 'bottom';
      }
      
      if (left < 10) {
        left = 10;
      } else if (left + tipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tipWidth - 10;
      }
      
      return {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${tipWidth}px`
      };
    },
    
    // ========== 快速帮助方法 ==========
    
    /**
     * 切换快速帮助面板
     */
    toggleQuickHelp() {
      this.showQuickHelp = !this.showQuickHelp;
    },
    
    /**
     * 显示操作指导
     * @param {string} operation - 操作类型
     */
    showOperationGuidance(operation) {
      const guidance = errorHandler.getOperationGuidance(operation);
      this.$emit('show-guidance', guidance);
      this.showQuickHelp = false;
    },
    
    /**
     * 显示故障排除
     * @param {string} issueType - 问题类型
     */
    showTroubleshooting(issueType) {
      const troubleshooting = errorHandler.getTroubleshootingSteps(issueType);
      this.$emit('show-troubleshooting', troubleshooting);
      this.showQuickHelp = false;
    },
    
    /**
     * 联系技术支持
     */
    contactSupport() {
      this.$emit('contact-support');
      this.showQuickHelp = false;
    }
  }
};
</script>

<style scoped>
/* 新手引导样式 */
.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.onboarding-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.onboarding-step {
  text-align: center;
  padding: 20px 0;
}

.step-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.step-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.step-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
  transition: background 0.3s;
}

.step-indicator.active {
  background: #1890ff;
}

/* 上下文提示样式 */
.context-tip {
  position: fixed;
  background: #333;
  color: white;
  border-radius: 8px;
  padding: 12px;
  z-index: 1002;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 6px solid transparent;
}

.tip-arrow.bottom {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: #333;
}

.tip-arrow.top {
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: #333;
}

/* 快速帮助样式 */
.quick-help-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1890ff;
  color: white;
  border-radius: 50px;
  padding: 12px 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 999;
  transition: all 0.3s;
}

.quick-help-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
}

.quick-help-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-height: 500px;
  overflow-y: auto;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.help-content {
  padding: 16px;
}

.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.help-item:hover {
  background: #f5f5f5;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.shortcut-key {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.help-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.help-action-button {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.help-action-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .quick-help-panel {
    right: 10px;
    left: 10px;
    width: auto;
    bottom: 70px;
  }
  
  .onboarding-content {
    margin: 20px;
    width: auto;
  }
}
</style>
