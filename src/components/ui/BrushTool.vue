<template>
  <div class="brush-tool" :class="brushClasses">
    <!-- 工具栏 -->
    <div class="brush-toolbar" v-if="showToolbar">
      <div class="toolbar-section">
        <h3 class="toolbar-title">{{ title }}</h3>
      </div>

      <div class="toolbar-section">
        <!-- 画笔类型选择 -->
        <div class="brush-selector">
          <button v-for="brush in availableBrushes" :key="brush.type" class="brush-button"
            :class="{ 'active': selectedBrushType === brush.type }" @click="selectBrushType(brush.type)"
            :title="brush.name" :disabled="disabled">
            <i :class="`icon-brush-${brush.type}`"></i>
          </button>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 画笔颜色控制 -->
        <div class="brush-color-control">
          <label>颜色:</label>
          <div class="color-preview" :style="{ backgroundColor: brushColor }" @click="toggleColorPicker"></div>
          <div v-if="showColorPicker" class="color-picker-container">
            <color-picker v-model="brushColor" @change="handleColorChange" :disabled="disabled" />
          </div>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 画笔大小控制 -->
        <div class="brush-size-control">
          <label>大小:</label>
          <input type="range" v-model.number="brushSize" min="1" max="50" step="1" @input="handleBrushSizeChange"
            :disabled="disabled" />
          <span class="brush-size-value">{{ brushSize }}px</span>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 画笔不透明度控制 -->
        <div class="brush-opacity-control">
          <label>不透明度:</label>
          <input type="range" v-model.number="brushOpacity" min="1" max="100" step="1" @input="handleBrushOpacityChange"
            :disabled="disabled" />
          <span class="brush-opacity-value">{{ brushOpacity }}%</span>
        </div>
      </div>

      <div class="toolbar-section">
        <!-- 工具按钮 -->
        <div class="tool-buttons">
          <button class="tool-button" :class="{ 'active': isEraserMode }" @click="toggleEraserMode" :disabled="disabled"
            title="橡皮擦">
            <i class="icon-eraser"></i>
          </button>

          <button class="tool-button" @click="clearCanvas" :disabled="disabled || !hasStrokes" title="清空画布">
            <i class="icon-clear"></i>
          </button>

          <button class="tool-button" @click="undoStroke" :disabled="disabled || !canUndo" title="撤销">
            <i class="icon-undo"></i>
          </button>

          <button class="tool-button" @click="redoStroke" :disabled="disabled || !canRedo" title="重做">
            <i class="icon-redo"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 高级设置面板 -->
    <div v-if="showAdvancedSettings" class="advanced-settings">
      <div class="settings-header">
        <h4>高级设置</h4>
      </div>

      <!-- 画笔硬度控制 -->
      <div class="setting-group">
        <label>硬度:</label>
        <input type="range" v-model.number="brushHardness" min="0" max="100" step="1" @input="handleBrushHardnessChange"
          :disabled="disabled" />
        <span class="setting-value">{{ brushHardness }}%</span>
      </div>

      <!-- 画笔流量控制 -->
      <div class="setting-group">
        <label>流量:</label>
        <input type="range" v-model.number="brushFlow" min="1" max="100" step="1" @input="handleBrushFlowChange"
          :disabled="disabled" />
        <span class="setting-value">{{ brushFlow }}%</span>
      </div>

      <!-- 画笔间距控制 -->
      <div class="setting-group">
        <label>间距:</label>
        <input type="range" v-model.number="brushSpacing" min="1" max="100" step="1" @input="handleBrushSpacingChange"
          :disabled="disabled" />
        <span class="setting-value">{{ brushSpacing }}%</span>
      </div>

      <!-- 平滑度控制 -->
      <div class="setting-group">
        <label>平滑度:</label>
        <input type="range" v-model.number="brushSmoothing" min="0" max="100" step="1"
          @input="handleBrushSmoothingChange" :disabled="disabled" />
        <span class="setting-value">{{ brushSmoothing }}%</span>
      </div>

      <!-- 混合模式选择 -->
      <div class="setting-group">
        <label>混合模式:</label>
        <select v-model="blendMode" @change="handleBlendModeChange" :disabled="disabled">
          <option v-for="mode in blendModes" :key="mode.value" :value="mode.value">
            {{ mode.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 画布容器 -->
    <div class="brush-canvas-container" ref="canvasContainer">
      <!-- 背景图像 -->
      <img v-if="backgroundImage" :src="backgroundImage" class="background-image" alt="背景图像"
        @load="handleBackgroundLoad" />

      <!-- 画布 -->
      <canvas ref="canvas" class="brush-canvas" @mousedown="handleCanvasMouseDown"
        @touchstart="handleCanvasTouchStart"></canvas>

      <!-- 预览画布 (用于显示当前笔触) -->
      <canvas ref="previewCanvas" class="preview-canvas"></canvas>

      <!-- 光标预览 -->
      <div v-if="showCursorPreview && !disabled && !isDrawing" class="cursor-preview" :style="cursorPreviewStyle"></div>

      <!-- 空状态 -->
      <div v-if="!hasStrokes && !backgroundImage" class="empty-state">
        <i class="icon-brush"></i>
        <p>{{ emptyText }}</p>
        <p class="instruction-text">选择画笔类型和大小开始绘制</p>
      </div>
    </div>

    <!-- 画笔预览面板 -->
    <div v-if="showBrushPreview" class="brush-preview-panel">
      <h4 class="preview-title">画笔预览</h4>

      <div class="brush-preview">
        <canvas ref="brushPreviewCanvas" class="brush-preview-canvas"></canvas>

        <div class="brush-info">
          <p><strong>类型:</strong> {{ getCurrentBrushName() }}</p>
          <p><strong>大小:</strong> {{ brushSize }}px</p>
          <p><strong>不透明度:</strong> {{ brushOpacity }}%</p>
          <p><strong>硬度:</strong> {{ brushHardness }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ColorPicker from './ColorPicker.vue';

export default {
  name: 'BrushTool',
  components: {
    ColorPicker
  },

  props: {
    // 工具标题
    title: {
      type: String,
      default: '画笔工具'
    },

    // 背景图像
    backgroundImage: {
      type: String,
      default: ''
    },

    // 初始画笔数据
    initialStrokes: {
      type: Array,
      default: () => []
    },

    // 显示选项
    showToolbar: {
      type: Boolean,
      default: true
    },

    showAdvancedSettings: {
      type: Boolean,
      default: false
    },

    // 画笔预览
    showBrushPreview: {
      type: Boolean,
      default: false
    },

    // 光标预览
    showCursorPreview: {
      type: Boolean,
      default: true
    },

    // 画布尺寸
    width: {
      type: Number,
      default: 0
    },

    height: {
      type: Number,
      default: 0
    },

    // 空状态文本
    emptyText: {
      type: String,
      default: '开始绘制'
    },

    // 变体
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'minimal', 'compact'].includes(value)
    },

    // 禁用状态
    disabled: {
      type: Boolean,
      default: false
    }
  },

  data() {
      return {
        // 画笔设置
        selectedBrushType: 'pencil',
        brushColor: '#000000',
        brushSize: 10,
        brushOpacity: 100,
        brushHardness: 100,
        brushFlow: 100,
        brushSpacing: 25,
        brushSmoothing: 50,
        blendMode: 'normal',

        // 工具状态
        isEraserMode: false,
        isDrawing: false,

        // 画布相关
        canvas: null,
        ctx: null,
        previewCanvas: null,
        previewCtx: null,
        brushPreviewCanvas: null,
        brushPreviewCtx: null,

        // 绘制状态
        currentStroke: null,
        strokes: [],
        undoStack: [],
        redoStack: [],

        // 鼠标/触摸状态
        lastX: 0,
        lastY: 0,
        lastPressure: 1,

        // 光标预览
        cursorX: 0,
        cursorY: 0,

        // 颜色选择器
        showColorPicker: false,

        // 可用画笔
        availableBrushes: [
          { type: 'pencil', name: '铅笔' },
          { type: 'brush', name: '毛笔' },
          { type: 'airbrush', name: '喷枪' },
          { type: 'watercolor', name: '水彩笔' },
          { type: 'marker', name: '马克笔' }
        ],

        // 混合模式
        blendModes: [
          { value: 'normal', name: '正常' },
          { value: 'multiply', name: '正片叠底' },
          { value: 'screen', name: '滤色' },
          { value: 'overlay', name: '叠加' },
          { value: 'soft-light', name: '柔光' },
          { value: 'hard-light', name: '强光' },
          { value: 'color-dodge', name: '颜色减淡' },
          { value: 'color-burn', name: '颜色加深' },
          { value: 'darken', name: '变暗' },
          { value: 'lighten', name: '变亮' }
        ]
      };
    },

  computed: {
      brushClasses() {
        return {
          [`variant-${this.variant}`]: true,
          'disabled': this.disabled,
          'eraser-mode': this.isEraserMode
        };
      },

      // 是否有笔触
      hasStrokes() {
        return this.strokes.length > 0;
      },

      // 是否可以撤销
      canUndo() {
        return this.undoStack.length > 0;
      },

      // 是否可以重做
      canRedo() {
        return this.redoStack.length > 0;
      },

      // 光标预览样式
      cursorPreviewStyle() {
        return {
          left: `${this.cursorX - this.brushSize / 2}px`,
          top: `${this.cursorY - this.brushSize / 2}px`,
          width: `${this.brushSize}px`,
          height: `${this.brushSize}px`,
          borderRadius: this.selectedBrushType === 'pencil' ? '0' : '50%',
          opacity: this.brushOpacity / 100
        };
      }
    },

    watch: {
      initialStrokes: {
        immediate: true,
        deep: true,
        handler(newStrokes) {
          this.strokes = [...newStrokes];
          this.redrawCanvas();
        }
      },

      strokes: {
        deep: true,
        handler(newStrokes) {
          this.$emit('strokes-change', newStrokes);
        }
      },

      // 监听画笔属性变化，更新预览
      brushSize() {
        this.updateBrushPreview();
      },
      brushColor() {
        this.updateBrushPreview();
      },
      brushOpacity() {
        this.updateBrushPreview();
      },
      brushHardness() {
        this.updateBrushPreview();
      },
      selectedBrushType() {
        this.updateBrushPreview();
      }
    },

    mounted() {
      this.initializeCanvas();

      // 监听全局鼠标和触摸事件
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
      document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      document.addEventListener('touchend', this.handleTouchEnd);
      document.addEventListener('click', this.handleDocumentClick);

      // 监听键盘事件
      document.addEventListener('keydown', this.handleKeyDown);

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleWindowResize);
    },

    beforeDestroy() {
      // 移除事件监听器
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
      document.removeEventListener('click', this.handleDocumentClick);
      document.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('resize', this.handleWindowResize);
    },

    methods: {
      /**
       * 初始化画布
       */
      initializeCanvas() {
        // 主画布
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');

        // 预览画布
        this.previewCanvas = this.$refs.previewCanvas;
        this.previewCtx = this.previewCanvas.getContext('2d');

        // 画笔预览画布
        if (this.$refs.brushPreviewCanvas) {
          this.brushPreviewCanvas = this.$refs.brushPreviewCanvas;
          this.brushPreviewCtx = this.brushPreviewCanvas.getContext('2d');
        }

        this.resizeCanvas();
        this.updateBrushPreview();
      },

      /**
       * 调整画布大小
       */
      resizeCanvas() {
        const container = this.$refs.canvasContainer;
        if (!container || !this.canvas || !this.previewCanvas) return;

        const rect = container.getBoundingClientRect();

        // 设置画布尺寸
        this.canvas.width = this.width || rect.width;
        this.canvas.height = this.height || rect.height;
        this.previewCanvas.width = this.canvas.width;
        this.previewCanvas.height = this.canvas.height;

        // 设置画笔预览画布尺寸
        if (this.brushPreviewCanvas) {
          this.brushPreviewCanvas.width = 150;
          this.brushPreviewCanvas.height = 150;
        }

        // 重绘画布
        this.redrawCanvas();
      },

      /**
       * 处理窗口大小变化
       */
      handleWindowResize() {
        this.resizeCanvas();
      },

      /**
       * 处理背景图像加载
       */
      handleBackgroundLoad() {
        this.redrawCanvas();
      },

      /**
       * 选择画笔类型
       */
      selectBrushType(type) {
        if (this.disabled) return;

        this.selectedBrushType = type;
        this.updateBrushPreview();
      },

      /**
       * 切换颜色选择器
       */
      toggleColorPicker() {
        this.showColorPicker = !this.showColorPicker;
      },

      /**
       * 处理颜色变化
       */
      handleColorChange(color) {
        this.brushColor = color;
      },

      /**
       * 处理画笔大小变化
       */
      handleBrushSizeChange() {
        // 已通过watch监听更新预览
      },

      /**
       * 处理画笔不透明度变化
       */
      handleBrushOpacityChange() {
        // 已通过watch监听更新预览
      },

      /**
       * 处理画笔硬度变化
       */
      handleBrushHardnessChange() {
        // 已通过watch监听更新预览
      },

      /**
       * 处理画笔流量变化
       */
      handleBrushFlowChange() {
        // 流量影响绘制时的不透明度变化
      },

      /**
       * 处理画笔间距变化
       */
      handleBrushSpacingChange() {
        // 间距影响绘制时的点之间的距离
      },

      /**
       * 处理画笔平滑度变化
       */
      handleBrushSmoothingChange() {
        // 平滑度影响绘制时的曲线平滑程度
      },

      /**
       * 处理混合模式变化
       */
      handleBlendModeChange() {
        // 混合模式影响绘制时的颜色混合方式
      },

      /**
       * 切换橡皮擦模式
       */
      toggleEraserMode() {
        if (this.disabled) return;

        this.isEraserMode = !this.isEraserMode;
        this.updateBrushPreview();
      },

      /**
       * 清空画布
       */
      clearCanvas() {
        if (this.disabled || !this.hasStrokes) return;

        // 保存当前状态到撤销栈
        this.undoStack.push([...this.strokes]);
        this.redoStack = [];

        // 清空笔触
        this.strokes = [];

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.$emit('canvas-clear');
      },

      /**
       * 撤销笔触
       */
      undoStroke() {
        if (this.disabled || !this.canUndo) return;

        // 保存当前状态到重做栈
        this.redoStack.push([...this.strokes]);

        // 恢复上一个状态
        this.strokes = this.undoStack.pop();

        // 重绘画布
        this.redrawCanvas();

        this.$emit('stroke-undo');
      },

      /**
       * 重做笔触
       */
      redoStroke() {
        if (this.disabled || !this.canRedo) return;

        // 保存当前状态到撤销栈
        this.undoStack.push([...this.strokes]);

        // 恢复下一个状态
        this.strokes = this.redoStack.pop();

        // 重绘画布
        this.redrawCanvas();

        this.$emit('stroke-redo');
      },

      /**
       * 处理画布鼠标按下
       */
      handleCanvasMouseDown(event) {
        if (this.disabled) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.startDrawing(x, y, event.pressure || 1);

        event.preventDefault();
      },

      /**
       * 处理画布触摸开始
       */
      handleCanvasTouchStart(event) {
        if (this.disabled) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 触摸压力，如果设备支持
        const pressure = touch.force || 1;

        this.startDrawing(x, y, pressure);

        event.preventDefault();
      },

      /**
       * 开始绘制
       */
      startDrawing(x, y, pressure) {
        this.isDrawing = true;

        // 记录起始点
        this.lastX = x;
        this.lastY = y;
        this.lastPressure = pressure;

        // 创建新笔触
        this.currentStroke = {
          type: this.selectedBrushType,
          color: this.isEraserMode ? 'transparent' : this.brushColor,
          size: this.brushSize,
          opacity: this.brushOpacity / 100,
          hardness: this.brushHardness / 100,
          flow: this.brushFlow / 100,
          spacing: this.brushSpacing / 100,
          blendMode: this.isEraserMode ? 'destination-out' : this.blendMode,
          isEraser: this.isEraserMode,
          points: [{ x, y, pressure }]
        };

        // 绘制第一个点
        this.drawPoint(this.previewCtx, x, y, pressure);
      },

      /**
       * 处理鼠标移动
       */
      handleMouseMove(event) {
        if (this.disabled) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 更新光标位置
        this.cursorX = x;
        this.cursorY = y;

        if (this.isDrawing) {
          const pressure = event.pressure || 1;
          this.continueDrawing(x, y, pressure);
        }
      },

      /**
       * 处理触摸移动
       */
      handleTouchMove(event) {
        if (this.disabled) return;

        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 更新光标位置
        this.cursorX = x;
        this.cursorY = y;

        if (this.isDrawing) {
          const pressure = touch.force || 1;
          this.continueDrawing(x, y, pressure);
        }

        event.preventDefault();
      },

      /**
       * 继续绘制
       */
      continueDrawing(x, y, pressure) {
        if (!this.currentStroke) return;

        // 添加点到当前笔触
        this.currentStroke.points.push({ x, y, pressure });

        // 应用平滑度
        const smoothing = this.brushSmoothing / 100;
        const smoothX = this.lastX + (x - this.lastX) * (1 - smoothing);
        const smoothY = this.lastY + (y - this.lastY) * (1 - smoothing);
        const smoothPressure = this.lastPressure + (pressure - this.lastPressure) * (1 - smoothing);

        // 绘制线段
        this.drawLine(
          this.previewCtx,
          this.lastX,
          this.lastY,
          smoothX,
          smoothY,
          this.lastPressure,
          smoothPressure
        );

        // 更新最后位置
        this.lastX = smoothX;
        this.lastY = smoothY;
        this.lastPressure = smoothPressure;
      },

      /**
       * 处理鼠标松开
       */
      handleMouseUp() {
        this.finishDrawing();
      },

      /**
       * 处理触摸结束
       */
      handleTouchEnd() {
        this.finishDrawing();
      },

      /**
       * 完成绘制
       */
      finishDrawing() {
        if (!this.isDrawing || !this.currentStroke) return;

        this.isDrawing = false;

        // 保存当前状态到撤销栈
        this.undoStack.push([...this.strokes]);
        this.redoStack = [];

        // 添加当前笔触到笔触列表
        this.strokes.push(this.currentStroke);

        // 将预览画布内容复制到主画布
        this.ctx.drawImage(this.previewCanvas, 0, 0);

        // 清除预览画布
        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        // 重置当前笔触
        this.currentStroke = null;

        this.$emit('stroke-add');
      },

      /**
       * 处理文档点击
       */
      handleDocumentClick(event) {
        // 关闭颜色选择器
        if (!event.target.closest('.color-picker-container') &&
          !event.target.closest('.color-preview')) {
          this.showColorPicker = false;
        }
      },

      /**
       * 处理键盘按下
       */
      handleKeyDown(event) {
        // 撤销 (Ctrl+Z)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
          event.preventDefault();
          this.undoStroke();
        }

        // 重做 (Ctrl+Y 或 Ctrl+Shift+Z)
        if ((event.ctrlKey || event.metaKey) &&
          (event.key === 'y' || (event.shiftKey && event.key === 'z'))) {
          event.preventDefault();
          this.redoStroke();
        }

        // 橡皮擦 (E)
        if (event.key === 'e') {
          this.toggleEraserMode();
        }

        // 增大画笔 (])
        if (event.key === ']') {
          this.brushSize = Math.min(this.brushSize + 5, 50);
        }

        // 减小画笔 ([)
        if (event.key === '[') {
          this.brushSize = Math.max(this.brushSize - 5, 1);
        }
      },

      /**
       * 绘制点
       */
      drawPoint(context, x, y, pressure) {
        if (!context) return;

        // 保存上下文
        context.save();

        // 设置混合模式
        context.globalCompositeOperation = this.currentStroke.isEraser ?
          'destination-out' : this.getCanvasBlendMode(this.currentStroke.blendMode);

        // 计算实际大小（考虑压力）
        const size = this.currentStroke.size * pressure;

        // 计算不透明度（考虑流量）
        const opacity = this.currentStroke.opacity * this.currentStroke.flow;

        // 设置不透明度
        context.globalAlpha = opacity;

        // 根据画笔类型绘制
        switch (this.currentStroke.type) {
          case 'pencil':
            this.drawPencilPoint(context, x, y, size);
            break;
          case 'brush':
            this.drawBrushPoint(context, x, y, size);
            break;
          case 'airbrush':
            this.drawAirbrushPoint(context, x, y, size);
            break;
          case 'watercolor':
            this.drawWatercolorPoint(context, x, y, size);
            break;
          case 'marker':
            this.drawMarkerPoint(context, x, y, size);
            break;
          default:
            this.drawBrushPoint(context, x, y, size);
        }

        // 恢复上下文
        context.restore();
      },

      /**
       * 绘制线段
       */
      drawLine(context, x1, y1, x2, y2, pressure1, pressure2) {
        if (!context) return;

        // 计算两点之间的距离
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 计算间距
        const spacing = Math.max(1, this.currentStroke.size * this.currentStroke.spacing);

        // 计算点的数量
        const numPoints = Math.max(2, Math.ceil(distance / spacing));

        // 绘制点
        for (let i = 0; i < numPoints; i++) {
          const t = i / (numPoints - 1);
          const x = x1 + dx * t;
          const y = y1 + dy * t;
          const pressure = pressure1 + (pressure2 - pressure1) * t;

          this.drawPoint(context, x, y, pressure);
        }
      },

      /**
       * 绘制铅笔点
       */
      drawPencilPoint(context, x, y, size) {
        context.fillStyle = this.currentStroke.color;
        context.fillRect(x - size / 2, y - size / 2, size, size);
      },

      /**
       * 绘制毛笔点
       */
      drawBrushPoint(context, x, y, size) {
        const hardness = this.currentStroke.hardness;

        // 创建径向渐变
        const gradient = context.createRadialGradient(
          x, y, 0,
          x, y, size / 2
        );

        gradient.addColorStop(0, this.currentStroke.color);
        gradient.addColorStop(hardness, this.currentStroke.color);
        gradient.addColorStop(1, this.hexToRgba(this.currentStroke.color, 0));

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, size / 2, 0, Math.PI * 2);
        context.fill();
      },

      /**
       * 绘制喷枪点
       */
      drawAirbrushPoint(context, x, y, size) {
        // 喷枪效果：多个随机点
        const numParticles = Math.floor(size * 2);
        const radius = size / 2;

        context.fillStyle = this.currentStroke.color;

        for (let i = 0; i < numParticles; i++) {
          // 随机位置（在圆内）
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * radius;
          const particleX = x + Math.cos(angle) * distance;
          const particleY = y + Math.sin(angle) * distance;

          // 随机大小
          const particleSize = Math.random() * 2 + 1;

          context.beginPath();
          context.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          context.fill();
        }
      },

      /**
       * 绘制水彩笔点
       */
      drawWatercolorPoint(context, x, y, size) {
        // 水彩效果：不规则形状和边缘
        const numPoints = 8;
        const radius = size / 2;
        const variance = radius * 0.3;

        context.fillStyle = this.hexToRgba(this.currentStroke.color, 0.5);
        context.beginPath();

        // 创建不规则多边形
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const r = radius + (Math.random() * variance * 2 - variance);
          const pointX = x + Math.cos(angle) * r;
          const pointY = y + Math.sin(angle) * r;

          if (i === 0) {
            context.moveTo(pointX, pointY);
          } else {
            context.lineTo(pointX, pointY);
          }
        }

        context.closePath();
        context.fill();
      },

      /**
       * 绘制马克笔点
       */
      drawMarkerPoint(context, x, y, size) {
        // 马克笔效果：矩形，半透明
        context.fillStyle = this.hexToRgba(this.currentStroke.color, 0.7);

        // 旋转矩形
        context.save();
        context.translate(x, y);
        context.rotate(Math.PI / 4); // 45度
        context.fillRect(-size / 2, -size / 2, size, size);
        context.restore();
      },

      /**
       * 重绘画布
       */
      redrawCanvas() {
        if (!this.ctx) return;

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制所有笔触
        this.strokes.forEach(stroke => {
          this.drawStroke(this.ctx, stroke);
        });
      },

      /**
       * 绘制笔触
       */
      drawStroke(context, stroke) {
        if (!context || !stroke || !stroke.points || stroke.points.length === 0) return;

        // 保存上下文
        context.save();

        // 设置混合模式
        context.globalCompositeOperation = stroke.isEraser ?
          'destination-out' : this.getCanvasBlendMode(stroke.blendMode);

        // 设置不透明度
        context.globalAlpha = stroke.opacity;

        // 如果只有一个点
        if (stroke.points.length === 1) {
          const point = stroke.points[0];

          // 临时设置当前笔触
          const oldStroke = this.currentStroke;
          this.currentStroke = stroke;

          // 绘制点
          this.drawPoint(context, point.x, point.y, point.pressure);

          // 恢复当前笔触
          this.currentStroke = oldStroke;
        } else {
          // 绘制线段
          for (let i = 1; i < stroke.points.length; i++) {
            const p1 = stroke.points[i - 1];
            const p2 = stroke.points[i];

            // 临时设置当前笔触
            const oldStroke = this.currentStroke;
            this.currentStroke = stroke;

            // 绘制线段
            this.drawLine(context, p1.x, p1.y, p2.x, p2.y, p1.pressure, p2.pressure);

            // 恢复当前笔触
            this.currentStroke = oldStroke;
          }
        }

        // 恢复上下文
        context.restore();
      },

      /**
       * 更新画笔预览
       */
      updateBrushPreview() {
        if (!this.brushPreviewCtx) return;

        // 清空预览画布
        this.brushPreviewCtx.clearRect(0, 0, this.brushPreviewCanvas.width, this.brushPreviewCanvas.height);

        // 创建临时笔触
        const tempStroke = {
          type: this.selectedBrushType,
          color: this.isEraserMode ? '#cccccc' : this.brushColor,
          size: this.brushSize,
          opacity: this.brushOpacity / 100,
          hardness: this.brushHardness / 100,
          flow: this.brushFlow / 100,
          spacing: this.brushSpacing / 100,
          blendMode: 'normal',
          isEraser: false
        };

        // 临时设置当前笔触
        const oldStroke = this.currentStroke;
        this.currentStroke = tempStroke;

        // 绘制预览点
        const centerX = this.brushPreviewCanvas.width / 2;
        const centerY = this.brushPreviewCanvas.height / 2;
        this.drawPoint(this.brushPreviewCtx, centerX, centerY, 1);

        // 恢复当前笔触
        this.currentStroke = oldStroke;
      },

      /**
       * 获取当前画笔名称
       */
      getCurrentBrushName() {
        const brush = this.availableBrushes.find(b => b.type === this.selectedBrushType);
        return brush ? brush.name : '未知画笔';
      },

      /**
       * 将Canvas混合模式转换为CSS混合模式
       */
      getCanvasBlendMode(mode) {
        const modeMap = {
          'normal': 'source-over',
          'multiply': 'multiply',
          'screen': 'screen',
          'overlay': 'overlay',
          'soft-light': 'soft-light',
          'hard-light': 'hard-light',
          'color-dodge': 'color-dodge',
          'color-burn': 'color-burn',
          'darken': 'darken',
          'lighten': 'lighten'
        };

        return modeMap[mode] || 'source-over';
      },

      /**
       * 将十六进制颜色转换为RGBA
       */
      hexToRgba(hex, alpha) {
        // 默认不透明度
        alpha = alpha === undefined ? 1 : alpha;

        // 扩展简写形式
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

        // 解析十六进制
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(0, 0, 0, ${alpha})`;

        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
  }
</script>

<style scoped>
.brush-tool {
  width: 100%;
  height: 100%;
  background-color: var(--brush-bg-color, #f5f5f5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 变体样式 */
.brush-tool.variant-default {
  --brush-bg-color: #f5f5f5;
  --brush-border-color: #ddd;
  --brush-toolbar-bg: #fff;
  --brush-text-color: #333;
  --brush-button-bg: #1890ff;
  --brush-button-hover: #40a9ff;
  --brush-active-color: #1890ff;
  --brush-canvas-bg: #fff;
}

.brush-tool.variant-minimal {
  --brush-bg-color: transparent;
  --brush-border-color: #ddd;
  --brush-toolbar-bg: rgba(255, 255, 255, 0.9);
  --brush-text-color: #333;
  --brush-button-bg: #1890ff;
  --brush-button-hover: #40a9ff;
  --brush-active-color: #1890ff;
  --brush-canvas-bg: rgba(255, 255, 255, 0.9);
}

.brush-tool.variant-compact {
  --brush-bg-color: #f0f0f0;
  --brush-border-color: #ccc;
  --brush-toolbar-bg: #f8f8f8;
  --brush-text-color: #333;
  --brush-button-bg: #1890ff;
  --brush-button-hover: #40a9ff;
  --brush-active-color: #1890ff;
  --brush-canvas-bg: #f8f8f8;
}

/* 工具栏 */
.brush-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--brush-toolbar-bg);
  border-bottom: 1px solid var(--brush-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--brush-text-color);
}

/* 画笔选择器 */
.brush-selector {
  display: flex;
  border: 1px solid var(--brush-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.brush-button {
  padding: 6px 8px;
  background-color: white;
  border: none;
  border-right: 1px solid var(--brush-border-color);
  color: var(--brush-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
}

.brush-button:last-child {
  border-right: none;
}

.brush-button:hover {
  background-color: #f0f0f0;
}

.brush-button.active {
  background-color: var(--brush-active-color);
  color: white;
}

.brush-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 颜色控制 */
.brush-color-control {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.brush-color-control label {
  font-size: 14px;
  color: var(--brush-text-color);
}

.color-preview {
  width: 24px;
  height: 24px;
  border: 1px solid var(--brush-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preview:hover {
  transform: scale(1.1);
}

.color-picker-container {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: 4px;
}

/* 画笔大小控制 */
.brush-size-control,
.brush-opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brush-size-control label,
.brush-opacity-control label {
  font-size: 14px;
  color: var(--brush-text-color);
  white-space: nowrap;
}

.brush-size-control input[type="range"],
.brush-opacity-control input[type="range"] {
  width: 100px;
  height: 4px;
  background: var(--brush-border-color);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.brush-size-control input[type="range"]::-webkit-slider-thumb,
.brush-opacity-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: var(--brush-active-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brush-size-control input[type="range"]::-moz-range-thumb,
.brush-opacity-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: var(--brush-active-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brush-size-value,
.brush-opacity-value {
  min-width: 40px;
  font-size: 14px;
  color: var(--brush-text-color);
}

/* 工具按钮 */
.tool-buttons {
  display: flex;
  gap: 8px;
}

.tool-button {
  width: 36px;
  height: 36px;
  background-color: white;
  border: 1px solid var(--brush-border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-button:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: var(--brush-active-color);
}

.tool-button.active {
  background-color: var(--brush-active-color);
  color: white;
  border-color: var(--brush-active-color);
}

.tool-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 高级设置面板 */
.advanced-settings {
  background-color: var(--brush-toolbar-bg);
  border-bottom: 1px solid var(--brush-border-color);
  padding: 12px 16px;
  flex-shrink: 0;
}

.settings-header {
  margin-bottom: 12px;
}

.settings-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--brush-text-color);
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-group label {
  min-width: 60px;
  font-size: 14px;
  color: var(--brush-text-color);
}

.setting-group input[type="range"] {
  flex: 1;
  height: 4px;
  background: var(--brush-border-color);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.setting-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: var(--brush-active-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-group input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: var(--brush-active-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.setting-value {
  min-width: 40px;
  font-size: 14px;
  color: var(--brush-text-color);
  text-align: right;
}

.setting-group select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--brush-border-color);
  border-radius: 4px;
  font-size: 14px;
  color: var(--brush-text-color);
  background-color: white;
}

/* 画布容器 */
.brush-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--brush-canvas-bg);
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.brush-canvas,
.preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

/* 光标预览 */
.cursor-preview {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 10;
}

.eraser-mode .cursor-preview {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px dashed rgba(0, 0, 0, 0.5);
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 8px 0;
}

.instruction-text {
  font-size: 14px;
  color: #666;
}

/* 画笔预览面板 */
.brush-preview-panel {
  background-color: var(--brush-toolbar-bg);
  border-top: 1px solid var(--brush-border-color);
  padding: 16px;
  flex-shrink: 0;
}

.preview-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--brush-text-color);
}

.brush-preview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brush-preview-canvas {
  width: 150px;
  height: 150px;
  background-color: white;
  border: 1px solid var(--brush-border-color);
  border-radius: 4px;
}

.brush-info {
  flex: 1;
}

.brush-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--brush-text-color);
}

/* 禁用状态 */
.brush-tool.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 图标样式 */
.icon-brush-pencil::before {
  content: '✏️';
  font-size: 18px;
}

.icon-brush-brush::before {
  content: '🖌️';
  font-size: 18px;
}

.icon-brush-airbrush::before {
  content: '🔫';
  font-size: 18px;
}

.icon-brush-watercolor::before {
  content: '💧';
  font-size: 18px;
}

.icon-brush-marker::before {
  content: '🖊️';
  font-size: 18px;
}

.icon-eraser::before {
  content: '🧽';
  font-size: 18px;
}

.icon-clear::before {
  content: '🗑️';
  font-size: 18px;
}

.icon-undo::before {
  content: '↩️';
  font-size: 18px;
}

.icon-redo::before {
  content: '↪️';
  font-size: 18px;
}

.icon-brush::before {
  content: '🎨';
  font-size: 24px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .brush-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .brush-size-control input[type="range"],
  .brush-opacity-control input[type="range"] {
    width: 80px;
  }

  .advanced-settings {
    padding: 8px 12px;
  }

  .setting-group label {
    min-width: 50px;
  }

  .brush-preview {
    flex-direction: column;
  }

  .brush-preview-canvas {
    width: 100px;
    height: 100px;
  }
}

/* 触摸设备优化 */
@media (hover: none) {

  .brush-button,
  .tool-button {
    width: 44px;
    height: 44px;
  }

  .cursor-preview {
    display: none;
  }
}
</style>
