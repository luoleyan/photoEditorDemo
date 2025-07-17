<template>
  <div class="shape-tool" :class="shapeClasses">
    <!-- 工具栏 -->
    <div class="shape-toolbar" v-if="showToolbar">
      <div class="toolbar-section">
        <h3 class="toolbar-title">{{ title }}</h3>
      </div>
      
      <div class="toolbar-section">
        <!-- 形状选择 -->
        <div class="shape-selector">
          <button 
            v-for="shape in availableShapes" 
            :key="shape.type"
            class="shape-button"
            :class="{ 'active': selectedShapeType === shape.type }"
            @click="selectShapeType(shape.type)"
            :title="shape.name"
            :disabled="disabled"
          >
            <i :class="`icon-shape-${shape.type}`"></i>
          </button>
        </div>
      </div>
      
      <div class="toolbar-section">
        <!-- 边框和填充控制 -->
        <div class="stroke-fill-controls">
          <div class="control-group">
            <label>边框:</label>
            <div 
              class="color-preview stroke-preview" 
              :style="{ backgroundColor: strokeColor }"
              @click="toggleStrokeColorPicker"
            ></div>
            <div v-if="showStrokeColorPicker" class="color-picker-container">
              <color-picker
                v-model="strokeColor"
                @change="handleStrokeColorChange"
                :disabled="disabled"
              />
            </div>
          </div>
          
          <div class="control-group">
            <label>填充:</label>
            <div 
              class="color-preview fill-preview" 
              :style="{ backgroundColor: fillColor }"
              @click="toggleFillColorPicker"
            ></div>
            <div v-if="showFillColorPicker" class="color-picker-container">
              <color-picker
                v-model="fillColor"
                @change="handleFillColorChange"
                :disabled="disabled"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="toolbar-section">
        <!-- 边框宽度控制 -->
        <div class="stroke-width-control">
          <label>边框宽度:</label>
          <input 
            type="range" 
            v-model.number="strokeWidth"
            min="0" 
            max="20" 
            step="1"
            @input="handleStrokeWidthChange"
            :disabled="disabled"
          />
          <span class="stroke-width-value">{{ strokeWidth }}px</span>
        </div>
      </div>
      
      <div class="toolbar-section">
        <!-- 圆角控制 (仅对矩形有效) -->
        <div class="corner-radius-control" v-if="selectedShapeType === 'rectangle'">
          <label>圆角半径:</label>
          <input 
            type="range" 
            v-model.number="cornerRadius"
            min="0" 
            max="50" 
            step="1"
            @input="handleCornerRadiusChange"
            :disabled="disabled"
          />
          <span class="corner-radius-value">{{ cornerRadius }}px</span>
        </div>
      </div>
    </div>
    
    <!-- 绘图区域 -->
    <div 
      class="shape-canvas-container"
      ref="canvasContainer"
      @mousedown="handleCanvasMouseDown"
      @touchstart="handleCanvasTouchStart"
    >
      <!-- 背景图像 -->
      <img 
        v-if="backgroundImage"
        :src="backgroundImage"
        class="background-image"
        alt="背景图像"
      />
      
      <!-- 形状元素 -->
      <div 
        v-for="shape in shapes" 
        :key="shape.id"
        class="shape-element"
        :class="{ 'active': activeShapeId === shape.id }"
        :style="getShapeStyle(shape)"
        @mousedown.stop="handleShapeMouseDown(shape, $event)"
        @touchstart.stop="handleShapeTouchStart(shape, $event)"
      >
        <!-- 形状内容 -->
        <div class="shape-content" :style="getShapeContentStyle(shape)">
          <!-- 矩形 -->
          <div 
            v-if="shape.type === 'rectangle'" 
            class="shape-rectangle"
            :style="getRectangleStyle(shape)"
          ></div>
          
          <!-- 圆形 -->
          <div 
            v-else-if="shape.type === 'circle'" 
            class="shape-circle"
            :style="getCircleStyle(shape)"
          ></div>
          
          <!-- 椭圆 -->
          <div 
            v-else-if="shape.type === 'ellipse'" 
            class="shape-ellipse"
            :style="getEllipseStyle(shape)"
          ></div>
          
          <!-- 线条 -->
          <div 
            v-else-if="shape.type === 'line'" 
            class="shape-line"
            :style="getLineStyle(shape)"
          ></div>
          
          <!-- 多边形 -->
          <div 
            v-else-if="shape.type === 'polygon'" 
            class="shape-polygon"
            :style="getPolygonStyle(shape)"
          ></div>
        </div>
        
        <!-- 变换控制 -->
        <div v-if="activeShapeId === shape.id" class="transform-controls">
          <!-- 旋转手柄 -->
          <div 
            class="rotate-handle"
            @mousedown.stop="handleRotateStart($event)"
            @touchstart.stop="handleRotateStart($event)"
          >
            <i class="icon-rotate"></i>
          </div>
          
          <!-- 调整大小手柄 -->
          <div 
            v-for="(handle, index) in resizeHandles" 
            :key="index"
            class="resize-handle"
            :class="handle.class"
            @mousedown.stop="handleResizeStart(handle.position, $event)"
            @touchstart.stop="handleResizeStart(handle.position, $event)"
          ></div>
        </div>
      </div>
      
      <!-- 绘制中的形状 -->
      <div 
        v-if="drawingShape"
        class="shape-element drawing"
        :style="getShapeStyle(drawingShape)"
      >
        <div class="shape-content" :style="getShapeContentStyle(drawingShape)">
          <!-- 矩形 -->
          <div 
            v-if="drawingShape.type === 'rectangle'" 
            class="shape-rectangle"
            :style="getRectangleStyle(drawingShape)"
          ></div>
          
          <!-- 圆形 -->
          <div 
            v-else-if="drawingShape.type === 'circle'" 
            class="shape-circle"
            :style="getCircleStyle(drawingShape)"
          ></div>
          
          <!-- 椭圆 -->
          <div 
            v-else-if="drawingShape.type === 'ellipse'" 
            class="shape-ellipse"
            :style="getEllipseStyle(drawingShape)"
          ></div>
          
          <!-- 线条 -->
          <div 
            v-else-if="drawingShape.type === 'line'" 
            class="shape-line"
            :style="getLineStyle(drawingShape)"
          ></div>
          
          <!-- 多边形 -->
          <div 
            v-else-if="drawingShape.type === 'polygon'" 
            class="shape-polygon"
            :style="getPolygonStyle(drawingShape)"
          ></div>
        </div>
      </div>
      
      <!-- 多边形绘制点 -->
      <div 
        v-for="(point, index) in polygonPoints" 
        :key="`point-${index}`"
        class="polygon-point"
        :style="{ left: point.x + 'px', top: point.y + 'px' }"
      ></div>
      
      <!-- 空状态 -->
      <div v-if="shapes.length === 0 && !drawingShape" class="empty-state">
        <i class="icon-shapes"></i>
        <p>{{ emptyText }}</p>
        <p class="instruction-text">{{ getInstructionText() }}</p>
      </div>
    </div>
    
    <!-- 形状操作面板 -->
    <div v-if="showOperations && activeShape" class="shape-operations">
      <h4 class="operations-title">形状操作</h4>
      
      <!-- 组合操作 -->
      <div class="operation-group" v-if="selectedShapes.length > 1">
        <button 
          class="operation-button"
          @click="handleGroupShapes"
          :disabled="disabled"
        >
          <i class="icon-group"></i>
          <span>组合形状</span>
        </button>
        
        <button 
          class="operation-button"
          @click="handleUngroupShapes"
          :disabled="disabled || !activeShape.isGroup"
        >
          <i class="icon-ungroup"></i>
          <span>取消组合</span>
        </button>
      </div>
      
      <!-- 对齐操作 -->
      <div class="operation-group" v-if="selectedShapes.length > 1">
        <div class="align-buttons">
          <button 
            class="align-button"
            @click="handleAlignShapes('left')"
            :disabled="disabled"
            title="左对齐"
          >
            <i class="icon-align-left"></i>
          </button>
          
          <button 
            class="align-button"
            @click="handleAlignShapes('center')"
            :disabled="disabled"
            title="水平居中"
          >
            <i class="icon-align-center"></i>
          </button>
          
          <button 
            class="align-button"
            @click="handleAlignShapes('right')"
            :disabled="disabled"
            title="右对齐"
          >
            <i class="icon-align-right"></i>
          </button>
          
          <button 
            class="align-button"
            @click="handleAlignShapes('top')"
            :disabled="disabled"
            title="顶部对齐"
          >
            <i class="icon-align-top"></i>
          </button>
          
          <button 
            class="align-button"
            @click="handleAlignShapes('middle')"
            :disabled="disabled"
            title="垂直居中"
          >
            <i class="icon-align-middle"></i>
          </button>
          
          <button 
            class="align-button"
            @click="handleAlignShapes('bottom')"
            :disabled="disabled"
            title="底部对齐"
          >
            <i class="icon-align-bottom"></i>
          </button>
        </div>
      </div>
      
      <!-- 分布操作 -->
      <div class="operation-group" v-if="selectedShapes.length > 2">
        <div class="distribute-buttons">
          <button 
            class="distribute-button"
            @click="handleDistributeShapes('horizontal')"
            :disabled="disabled"
            title="水平分布"
          >
            <i class="icon-distribute-horizontal"></i>
          </button>
          
          <button 
            class="distribute-button"
            @click="handleDistributeShapes('vertical')"
            :disabled="disabled"
            title="垂直分布"
          >
            <i class="icon-distribute-vertical"></i>
          </button>
        </div>
      </div>
      
      <!-- 删除操作 -->
      <div class="operation-group">
        <button 
          class="delete-button"
          @click="handleDeleteShapes"
          :disabled="disabled"
        >
          <i class="icon-delete"></i>
          <span>删除形状</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ColorPicker from './ColorPicker.vue';

export default {
  name: 'ShapeTool',
  components: {
    ColorPicker
  },
  
  props: {
    // 工具标题
    title: {
      type: String,
      default: '形状工具'
    },
    
    // 背景图像
    backgroundImage: {
      type: String,
      default: ''
    },
    
    // 初始形状
    initialShapes: {
      type: Array,
      default: () => []
    },
    
    // 显示选项
    showToolbar: {
      type: Boolean,
      default: true
    },
    showOperations: {
      type: Boolean,
      default: true
    },
    
    // 状态
    disabled: {
      type: Boolean,
      default: false
    },
    
    // 文本选项
    emptyText: {
      type: String,
      default: '暂无形状'
    },
    
    // 样式
    variant: {
      type: String,
      default: 'default',
      validator: value => ['default', 'minimal', 'compact'].includes(value)
    }
  },

  data() {
    return {
      // 形状数据
      shapes: [],

      // 活动形状
      activeShapeId: '',
      selectedShapeIds: [],

      // 绘制状态
      isDrawing: false,
      drawingShape: null,
      drawStartX: 0,
      drawStartY: 0,

      // 多边形绘制点
      polygonPoints: [],

      // 形状属性
      selectedShapeType: 'rectangle',
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 2,
      cornerRadius: 0,

      // 交互状态
      isDragging: false,
      isResizing: false,
      isRotating: false,
      interactionStartX: 0,
      interactionStartY: 0,
      interactionStartShape: null,
      resizeDirection: '',

      // 颜色选择器
      showStrokeColorPicker: false,
      showFillColorPicker: false,

      // 可用形状
      availableShapes: [
        { type: 'rectangle', name: '矩形' },
        { type: 'circle', name: '圆形' },
        { type: 'ellipse', name: '椭圆' },
        { type: 'line', name: '线条' },
        { type: 'polygon', name: '多边形' }
      ],

      // 调整大小手柄
      resizeHandles: [
        { position: 'nw', class: 'nw-handle' },
        { position: 'n', class: 'n-handle' },
        { position: 'ne', class: 'ne-handle' },
        { position: 'e', class: 'e-handle' },
        { position: 'se', class: 'se-handle' },
        { position: 's', class: 's-handle' },
        { position: 'sw', class: 'sw-handle' },
        { position: 'w', class: 'w-handle' }
      ],

      // 防抖相关
      shapesChangeTimeout: null
    };
  },

  computed: {
    shapeClasses() {
      return {
        [`variant-${this.variant}`]: true,
        'disabled': this.disabled
      };
    },

    // 当前活动形状
    activeShape() {
      return this.shapes.find(shape => shape.id === this.activeShapeId) || null;
    },

    // 选中的形状
    selectedShapes() {
      return this.shapes.filter(shape => this.selectedShapeIds.includes(shape.id));
    }
  },

  watch: {
    initialShapes: {
      immediate: true,
      deep: true,
      handler(newShapes) {
        this.shapes = [...newShapes];
      }
    },

    shapes: {
      deep: true,
      handler(newShapes) {
        // 防抖处理，避免频繁触发事件
        if (this.shapesChangeTimeout) {
          clearTimeout(this.shapesChangeTimeout);
        }

        this.shapesChangeTimeout = setTimeout(() => {
          this.$emit('shapes-change', newShapes);
        }, 50); // 50ms防抖延迟
      }
    },

    activeShape: {
      immediate: true,
      handler(newShape) {
        if (newShape) {
          this.strokeColor = newShape.strokeColor || '#000000';
          this.fillColor = newShape.fillColor || '#ffffff';
          this.strokeWidth = newShape.strokeWidth || 2;
          this.cornerRadius = newShape.cornerRadius || 0;
        }
      }
    }
  },

  mounted() {
    // 监听全局鼠标和触摸事件
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    document.addEventListener('click', this.handleDocumentClick);

    // 监听键盘事件
    document.addEventListener('keydown', this.handleKeyDown);
  },

  beforeDestroy() {
    // 清理防抖定时器
    if (this.shapesChangeTimeout) {
      clearTimeout(this.shapesChangeTimeout);
      this.shapesChangeTimeout = null;
    }

    // 移除事件监听器
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  },

  methods: {
    /**
     * 选择形状类型
     */
    selectShapeType(type) {
      if (this.disabled) return;

      this.selectedShapeType = type;

      // 如果正在绘制多边形，完成绘制
      if (this.selectedShapeType !== 'polygon' && this.polygonPoints.length > 0) {
        this.finishPolygonDrawing();
      }
    },

    /**
     * 切换边框颜色选择器
     */
    toggleStrokeColorPicker() {
      this.showStrokeColorPicker = !this.showStrokeColorPicker;
      this.showFillColorPicker = false;
    },

    /**
     * 切换填充颜色选择器
     */
    toggleFillColorPicker() {
      this.showFillColorPicker = !this.showFillColorPicker;
      this.showStrokeColorPicker = false;
    },

    /**
     * 处理边框颜色变化
     */
    handleStrokeColorChange(color) {
      this.strokeColor = color;

      if (this.activeShape) {
        this.activeShape.strokeColor = color;
        this.$emit('shape-style-change', this.activeShape);
      }
    },

    /**
     * 处理填充颜色变化
     */
    handleFillColorChange(color) {
      this.fillColor = color;

      if (this.activeShape) {
        this.activeShape.fillColor = color;
        this.$emit('shape-style-change', this.activeShape);
      }
    },

    /**
     * 处理边框宽度变化
     */
    handleStrokeWidthChange() {
      if (this.activeShape) {
        this.activeShape.strokeWidth = this.strokeWidth;
        this.$emit('shape-style-change', this.activeShape);
      }
    },

    /**
     * 处理圆角半径变化
     */
    handleCornerRadiusChange() {
      if (this.activeShape && this.activeShape.type === 'rectangle') {
        this.activeShape.cornerRadius = this.cornerRadius;
        this.$emit('shape-style-change', this.activeShape);
      }
    },

    /**
     * 处理画布鼠标按下
     */
    handleCanvasMouseDown(event) {
      if (this.disabled) return;

      const rect = this.$refs.canvasContainer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 如果是多边形模式
      if (this.selectedShapeType === 'polygon') {
        this.handlePolygonClick(x, y);
        return;
      }

      // 开始绘制新形状
      this.startDrawing(x, y);

      event.preventDefault();
    },

    /**
     * 处理画布触摸开始
     */
    handleCanvasTouchStart(event) {
      if (this.disabled) return;

      const touch = event.touches[0];
      const rect = this.$refs.canvasContainer.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (this.selectedShapeType === 'polygon') {
        this.handlePolygonClick(x, y);
        return;
      }

      this.startDrawing(x, y);

      event.preventDefault();
    },

    /**
     * 开始绘制形状
     */
    startDrawing(x, y) {
      this.isDrawing = true;
      this.drawStartX = x;
      this.drawStartY = y;

      // 创建新形状
      this.drawingShape = {
        id: `shape-${Date.now()}`,
        type: this.selectedShapeType,
        x: x,
        y: y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: this.strokeColor,
        fillColor: this.fillColor,
        strokeWidth: this.strokeWidth,
        cornerRadius: this.cornerRadius
      };

      // 清除选择
      this.activeShapeId = '';
      this.selectedShapeIds = [];
    },

    /**
     * 处理多边形点击
     */
    handlePolygonClick(x, y) {
      // 添加点
      this.polygonPoints.push({ x, y });

      // 如果是第一个点，开始绘制
      if (this.polygonPoints.length === 1) {
        this.drawingShape = {
          id: `polygon-${Date.now()}`,
          type: 'polygon',
          points: [...this.polygonPoints],
          strokeColor: this.strokeColor,
          fillColor: this.fillColor,
          strokeWidth: this.strokeWidth
        };
      } else {
        // 更新多边形点
        this.drawingShape.points = [...this.polygonPoints];
      }
    },

    /**
     * 完成多边形绘制
     */
    finishPolygonDrawing() {
      if (this.polygonPoints.length >= 3 && this.drawingShape) {
        // 计算边界框
        const minX = Math.min(...this.polygonPoints.map(p => p.x));
        const minY = Math.min(...this.polygonPoints.map(p => p.y));
        const maxX = Math.max(...this.polygonPoints.map(p => p.x));
        const maxY = Math.max(...this.polygonPoints.map(p => p.y));

        this.drawingShape.x = minX;
        this.drawingShape.y = minY;
        this.drawingShape.width = maxX - minX;
        this.drawingShape.height = maxY - minY;

        // 转换为相对坐标
        this.drawingShape.points = this.polygonPoints.map(p => ({
          x: p.x - minX,
          y: p.y - minY
        }));

        this.shapes.push(this.drawingShape);
        this.activeShapeId = this.drawingShape.id;

        this.$emit('shape-add', this.drawingShape);
      }

      // 重置状态
      this.polygonPoints = [];
      this.drawingShape = null;
    },

    /**
     * 处理形状鼠标按下
     */
    handleShapeMouseDown(shape, event) {
      if (this.disabled) return;

      this.activeShapeId = shape.id;

      // 多选处理
      if (event.ctrlKey || event.metaKey) {
        const index = this.selectedShapeIds.indexOf(shape.id);
        if (index !== -1) {
          this.selectedShapeIds.splice(index, 1);
        } else {
          this.selectedShapeIds.push(shape.id);
        }
      } else {
        this.selectedShapeIds = [shape.id];
      }

      // 开始拖拽
      this.isDragging = true;
      this.interactionStartX = event.clientX;
      this.interactionStartY = event.clientY;
      this.interactionStartShape = { ...shape };

      this.$emit('shape-select', shape);

      event.preventDefault();
    },

    /**
     * 处理形状触摸开始
     */
    handleShapeTouchStart(shape, event) {
      if (this.disabled) return;

      this.activeShapeId = shape.id;
      this.selectedShapeIds = [shape.id];

      const touch = event.touches[0];
      this.isDragging = true;
      this.interactionStartX = touch.clientX;
      this.interactionStartY = touch.clientY;
      this.interactionStartShape = { ...shape };

      this.$emit('shape-select', shape);

      event.preventDefault();
    },

    /**
     * 处理旋转开始
     */
    handleRotateStart(event) {
      if (this.disabled || !this.activeShape) return;

      this.isRotating = true;

      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      this.interactionStartX = clientX;
      this.interactionStartY = clientY;
      this.interactionStartShape = { ...this.activeShape };

      event.preventDefault();
    },

    /**
     * 处理调整大小开始
     */
    handleResizeStart(direction, event) {
      if (this.disabled || !this.activeShape) return;

      this.isResizing = true;
      this.resizeDirection = direction;

      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      this.interactionStartX = clientX;
      this.interactionStartY = clientY;
      this.interactionStartShape = { ...this.activeShape };

      event.preventDefault();
    },

    /**
     * 处理鼠标移动
     */
    handleMouseMove(event) {
      if (this.disabled) return;

      if (this.isDrawing) {
        this.updateDrawingShape(event.clientX, event.clientY);
      } else if (this.isDragging) {
        this.handleDrag(event.clientX, event.clientY);
      } else if (this.isRotating) {
        this.handleRotate(event.clientX, event.clientY);
      } else if (this.isResizing) {
        this.handleResize(event.clientX, event.clientY);
      }
    },

    /**
     * 处理触摸移动
     */
    handleTouchMove(event) {
      if (this.disabled) return;

      const touch = event.touches[0];

      if (this.isDrawing) {
        this.updateDrawingShape(touch.clientX, touch.clientY);
      } else if (this.isDragging) {
        this.handleDrag(touch.clientX, touch.clientY);
      } else if (this.isRotating) {
        this.handleRotate(touch.clientX, touch.clientY);
      } else if (this.isResizing) {
        this.handleResize(touch.clientX, touch.clientY);
      }

      event.preventDefault();
    },

    /**
     * 更新绘制中的形状
     */
    updateDrawingShape(clientX, clientY) {
      if (!this.drawingShape) return;

      const rect = this.$refs.canvasContainer.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      const width = Math.abs(currentX - this.drawStartX);
      const height = Math.abs(currentY - this.drawStartY);

      this.drawingShape.x = Math.min(this.drawStartX, currentX);
      this.drawingShape.y = Math.min(this.drawStartY, currentY);
      this.drawingShape.width = width;
      this.drawingShape.height = height;

      // 对于圆形，保持宽高相等
      if (this.drawingShape.type === 'circle') {
        const size = Math.min(width, height);
        this.drawingShape.width = size;
        this.drawingShape.height = size;
      }
    },

    /**
     * 处理拖拽
     */
    handleDrag(clientX, clientY) {
      if (!this.activeShape || !this.interactionStartShape) return;

      const deltaX = clientX - this.interactionStartX;
      const deltaY = clientY - this.interactionStartY;

      this.activeShape.x = this.interactionStartShape.x + deltaX;
      this.activeShape.y = this.interactionStartShape.y + deltaY;

      this.$emit('shape-move', this.activeShape);
    },

    /**
     * 处理旋转
     */
    handleRotate(clientX, clientY) {
      if (!this.activeShape || !this.interactionStartShape) return;

      // 计算形状中心点
      const centerX = this.activeShape.x + this.activeShape.width / 2;
      const centerY = this.activeShape.y + this.activeShape.height / 2;

      // 计算角度
      const startAngle = Math.atan2(
        this.interactionStartY - centerY,
        this.interactionStartX - centerX
      );

      const currentAngle = Math.atan2(
        clientY - centerY,
        clientX - centerX
      );

      let angleDiff = currentAngle - startAngle;
      angleDiff = angleDiff * (180 / Math.PI);

      this.activeShape.rotation = this.interactionStartShape.rotation + angleDiff;

      this.$emit('shape-rotate', this.activeShape);
    },

    /**
     * 处理调整大小
     */
    handleResize(clientX, clientY) {
      if (!this.activeShape || !this.interactionStartShape) return;

      const deltaX = clientX - this.interactionStartX;
      const deltaY = clientY - this.interactionStartY;

      const shape = { ...this.interactionStartShape };

      // 根据调整方向更新形状
      switch (this.resizeDirection) {
        case 'nw':
          shape.x += deltaX;
          shape.y += deltaY;
          shape.width -= deltaX;
          shape.height -= deltaY;
          break;
        case 'n':
          shape.y += deltaY;
          shape.height -= deltaY;
          break;
        case 'ne':
          shape.y += deltaY;
          shape.width += deltaX;
          shape.height -= deltaY;
          break;
        case 'e':
          shape.width += deltaX;
          break;
        case 'se':
          shape.width += deltaX;
          shape.height += deltaY;
          break;
        case 's':
          shape.height += deltaY;
          break;
        case 'sw':
          shape.x += deltaX;
          shape.width -= deltaX;
          shape.height += deltaY;
          break;
        case 'w':
          shape.x += deltaX;
          shape.width -= deltaX;
          break;
      }

      // 确保最小尺寸
      if (shape.width < 10) shape.width = 10;
      if (shape.height < 10) shape.height = 10;

      // 对于圆形，保持宽高相等
      if (shape.type === 'circle') {
        const size = Math.min(shape.width, shape.height);

        if (this.resizeDirection.includes('w')) {
          shape.x = shape.x + shape.width - size;
        }

        if (this.resizeDirection.includes('n')) {
          shape.y = shape.y + shape.height - size;
        }

        shape.width = size;
        shape.height = size;
      }

      // 更新形状
      Object.assign(this.activeShape, shape);

      this.$emit('shape-resize', this.activeShape);
    },

    /**
     * 处理鼠标松开
     */
    handleMouseUp() {
      if (this.isDrawing && this.drawingShape) {
        this.finishDrawing();
      }

      this.isDrawing = false;
      this.isDragging = false;
      this.isResizing = false;
      this.isRotating = false;
      this.interactionStartShape = null;
    },

    /**
     * 处理触摸结束
     */
    handleTouchEnd() {
      if (this.isDrawing && this.drawingShape) {
        this.finishDrawing();
      }

      this.isDrawing = false;
      this.isDragging = false;
      this.isResizing = false;
      this.isRotating = false;
      this.interactionStartShape = null;
    },

    /**
     * 完成绘制
     */
    finishDrawing() {
      // 确保形状有最小尺寸
      if (this.drawingShape.width < 10 || this.drawingShape.height < 10) {
        this.drawingShape = null;
        return;
      }

      // 添加形状
      this.shapes.push(this.drawingShape);
      this.activeShapeId = this.drawingShape.id;
      this.selectedShapeIds = [this.drawingShape.id];

      this.$emit('shape-add', this.drawingShape);

      this.drawingShape = null;
    },

    /**
     * 处理文档点击
     */
    handleDocumentClick(event) {
      // 关闭颜色选择器
      if (!event.target.closest('.color-picker-container') &&
          !event.target.closest('.color-preview')) {
        this.showStrokeColorPicker = false;
        this.showFillColorPicker = false;
      }

      // 如果点击了画布外部，完成多边形绘制
      if (this.selectedShapeType === 'polygon' &&
          this.polygonPoints.length >= 3 &&
          !event.target.closest('.shape-canvas-container')) {
        this.finishPolygonDrawing();
      }
    },

    /**
     * 处理键盘按下
     */
    handleKeyDown(event) {
      // 删除选中的形状
      if (event.key === 'Delete' && this.selectedShapeIds.length > 0) {
        this.handleDeleteShapes();
      }

      // 完成多边形绘制
      if (event.key === 'Enter' &&
          this.selectedShapeType === 'polygon' &&
          this.polygonPoints.length >= 3) {
        this.finishPolygonDrawing();
      }

      // 取消绘制
      if (event.key === 'Escape') {
        if (this.drawingShape) {
          this.drawingShape = null;
          this.isDrawing = false;
        }

        if (this.polygonPoints.length > 0) {
          this.polygonPoints = [];
        }
      }
    },

    /**
     * 处理组合形状
     */
    handleGroupShapes() {
      if (this.disabled || this.selectedShapeIds.length <= 1) return;

      const selectedShapes = this.shapes.filter(shape =>
        this.selectedShapeIds.includes(shape.id)
      );

      // 计算组合边界
      const minX = Math.min(...selectedShapes.map(s => s.x));
      const minY = Math.min(...selectedShapes.map(s => s.y));
      const maxX = Math.max(...selectedShapes.map(s => s.x + s.width));
      const maxY = Math.max(...selectedShapes.map(s => s.y + s.height));

      // 创建组合形状
      const groupShape = {
        id: `group-${Date.now()}`,
        type: 'group',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        strokeColor: this.strokeColor,
        fillColor: 'transparent',
        strokeWidth: 1,
        isGroup: true,
        children: selectedShapes.map(s => {
          // 转换为相对坐标
          const clone = { ...s };
          clone.x = clone.x - minX;
          clone.y = clone.y - minY;
          return clone;
        })
      };

      // 移除原始形状
      this.shapes = this.shapes.filter(shape =>
        !this.selectedShapeIds.includes(shape.id)
      );

      // 添加组合形状
      this.shapes.push(groupShape);
      this.activeShapeId = groupShape.id;
      this.selectedShapeIds = [groupShape.id];

      this.$emit('shapes-group', groupShape);
    },

    /**
     * 处理取消组合
     */
    handleUngroupShapes() {
      if (this.disabled || !this.activeShape || !this.activeShape.isGroup) return;

      const groupShape = this.activeShape;

      // 恢复子形状的绝对坐标
      const ungroupedShapes = groupShape.children.map(child => {
        const shape = { ...child };
        shape.x = shape.x + groupShape.x;
        shape.y = shape.y + groupShape.y;
        return shape;
      });

      // 移除组合形状
      const index = this.shapes.findIndex(s => s.id === groupShape.id);
      if (index !== -1) {
        this.shapes.splice(index, 1);
      }

      // 添加子形状
      this.shapes.push(...ungroupedShapes);

      // 选中所有子形状
      this.selectedShapeIds = ungroupedShapes.map(s => s.id);
      this.activeShapeId = ungroupedShapes[0]?.id || '';

      this.$emit('shapes-ungroup', ungroupedShapes);
    },

    /**
     * 处理对齐形状
     */
    handleAlignShapes(alignment) {
      if (this.disabled || this.selectedShapeIds.length <= 1) return;

      const selectedShapes = this.shapes.filter(shape =>
        this.selectedShapeIds.includes(shape.id)
      );

      // 计算对齐基准
      let alignValue;

      switch (alignment) {
        case 'left':
          alignValue = Math.min(...selectedShapes.map(s => s.x));
          selectedShapes.forEach(shape => { shape.x = alignValue; });
          break;
        case 'center':
          alignValue = (Math.min(...selectedShapes.map(s => s.x)) +
                       Math.max(...selectedShapes.map(s => s.x + s.width))) / 2;
          selectedShapes.forEach(shape => {
            shape.x = alignValue - shape.width / 2;
          });
          break;
        case 'right':
          alignValue = Math.max(...selectedShapes.map(s => s.x + s.width));
          selectedShapes.forEach(shape => {
            shape.x = alignValue - shape.width;
          });
          break;
        case 'top':
          alignValue = Math.min(...selectedShapes.map(s => s.y));
          selectedShapes.forEach(shape => { shape.y = alignValue; });
          break;
        case 'middle':
          alignValue = (Math.min(...selectedShapes.map(s => s.y)) +
                       Math.max(...selectedShapes.map(s => s.y + s.height))) / 2;
          selectedShapes.forEach(shape => {
            shape.y = alignValue - shape.height / 2;
          });
          break;
        case 'bottom':
          alignValue = Math.max(...selectedShapes.map(s => s.y + s.height));
          selectedShapes.forEach(shape => {
            shape.y = alignValue - shape.height;
          });
          break;
      }

      this.$emit('shapes-align', { alignment, shapes: selectedShapes });
    },

    /**
     * 处理分布形状
     */
    handleDistributeShapes(direction) {
      if (this.disabled || this.selectedShapeIds.length <= 2) return;

      const selectedShapes = this.shapes.filter(shape =>
        this.selectedShapeIds.includes(shape.id)
      );

      if (direction === 'horizontal') {
        // 按x坐标排序
        selectedShapes.sort((a, b) => a.x - b.x);

        const totalWidth = selectedShapes[selectedShapes.length - 1].x +
                          selectedShapes[selectedShapes.length - 1].width -
                          selectedShapes[0].x;

        const shapeWidthSum = selectedShapes.reduce((sum, s) => sum + s.width, 0);
        const spacing = (totalWidth - shapeWidthSum) / (selectedShapes.length - 1);

        let currentX = selectedShapes[0].x;
        selectedShapes.forEach((shape, index) => {
          if (index > 0) {
            currentX += selectedShapes[index - 1].width + spacing;
            shape.x = currentX;
          }
        });
      } else {
        // 按y坐标排序
        selectedShapes.sort((a, b) => a.y - b.y);

        const totalHeight = selectedShapes[selectedShapes.length - 1].y +
                           selectedShapes[selectedShapes.length - 1].height -
                           selectedShapes[0].y;

        const shapeHeightSum = selectedShapes.reduce((sum, s) => sum + s.height, 0);
        const spacing = (totalHeight - shapeHeightSum) / (selectedShapes.length - 1);

        let currentY = selectedShapes[0].y;
        selectedShapes.forEach((shape, index) => {
          if (index > 0) {
            currentY += selectedShapes[index - 1].height + spacing;
            shape.y = currentY;
          }
        });
      }

      this.$emit('shapes-distribute', { direction, shapes: selectedShapes });
    },

    /**
     * 处理删除形状
     */
    handleDeleteShapes() {
      if (this.disabled || this.selectedShapeIds.length === 0) return;

      const deletedShapes = this.shapes.filter(shape =>
        this.selectedShapeIds.includes(shape.id)
      );

      this.shapes = this.shapes.filter(shape =>
        !this.selectedShapeIds.includes(shape.id)
      );

      this.activeShapeId = '';
      this.selectedShapeIds = [];

      this.$emit('shapes-delete', deletedShapes);
    },

    /**
     * 获取指令文本
     */
    getInstructionText() {
      const instructions = {
        'rectangle': '点击并拖拽绘制矩形',
        'circle': '点击并拖拽绘制圆形',
        'ellipse': '点击并拖拽绘制椭圆',
        'line': '点击并拖拽绘制线条',
        'polygon': '点击添加多边形顶点，按Enter完成'
      };

      return instructions[this.selectedShapeType] || '选择形状类型开始绘制';
    },

    /**
     * 获取形状样式
     */
    getShapeStyle(shape) {
      return {
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        transform: `rotate(${shape.rotation || 0}deg)`
      };
    },

    /**
     * 获取形状内容样式
     */
    getShapeContentStyle(shape) {
      return {
        width: '100%',
        height: '100%'
      };
    },

    /**
     * 获取矩形样式
     */
    getRectangleStyle(shape) {
      return {
        width: '100%',
        height: '100%',
        backgroundColor: shape.fillColor || 'transparent',
        border: `${shape.strokeWidth}px solid ${shape.strokeColor || 'black'}`,
        borderRadius: `${shape.cornerRadius || 0}px`
      };
    },

    /**
     * 获取圆形样式
     */
    getCircleStyle(shape) {
      return {
        width: '100%',
        height: '100%',
        backgroundColor: shape.fillColor || 'transparent',
        border: `${shape.strokeWidth}px solid ${shape.strokeColor || 'black'}`,
        borderRadius: '50%'
      };
    },

    /**
     * 获取椭圆样式
     */
    getEllipseStyle(shape) {
      return {
        width: '100%',
        height: '100%',
        backgroundColor: shape.fillColor || 'transparent',
        border: `${shape.strokeWidth}px solid ${shape.strokeColor || 'black'}`,
        borderRadius: '50%'
      };
    },

    /**
     * 获取线条样式
     */
    getLineStyle(shape) {
      // 计算线条角度
      const angle = Math.atan2(shape.height, shape.width) * (180 / Math.PI);
      const length = Math.sqrt(shape.width * shape.width + shape.height * shape.height);

      return {
        width: `${length}px`,
        height: `${shape.strokeWidth}px`,
        backgroundColor: shape.strokeColor || 'black',
        transformOrigin: 'left center',
        transform: `rotate(${angle}deg)`
      };
    },

    /**
     * 获取多边形样式
     */
    getPolygonStyle(shape) {
      if (!shape.points || shape.points.length < 3) {
        return {};
      }

      // 创建SVG路径
      const pathPoints = shape.points.map(p => `${p.x},${p.y}`).join(' ');

      return {
        width: '100%',
        height: '100%',
        position: 'relative',
        clipPath: `polygon(${pathPoints})`,
        backgroundColor: shape.fillColor || 'transparent',
        border: `${shape.strokeWidth}px solid ${shape.strokeColor || 'black'}`
      };
    }
  }
};
</script>

<style scoped>
.shape-tool {
  width: 100%;
  height: 100%;
  background-color: var(--shape-bg-color, #f5f5f5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 变体样式 */
.shape-tool.variant-default {
  --shape-bg-color: #f5f5f5;
  --shape-border-color: #ddd;
  --shape-toolbar-bg: #fff;
  --shape-text-color: #333;
  --shape-button-bg: #1890ff;
  --shape-button-hover: #40a9ff;
  --shape-active-color: #1890ff;
  --shape-canvas-bg: #fff;
}

.shape-tool.variant-minimal {
  --shape-bg-color: transparent;
  --shape-border-color: #ddd;
  --shape-toolbar-bg: rgba(255, 255, 255, 0.9);
  --shape-text-color: #333;
  --shape-button-bg: #1890ff;
  --shape-button-hover: #40a9ff;
  --shape-active-color: #1890ff;
  --shape-canvas-bg: rgba(255, 255, 255, 0.9);
}

.shape-tool.variant-compact {
  --shape-bg-color: #f0f0f0;
  --shape-border-color: #ccc;
  --shape-toolbar-bg: #f8f8f8;
  --shape-text-color: #333;
  --shape-button-bg: #1890ff;
  --shape-button-hover: #40a9ff;
  --shape-active-color: #1890ff;
  --shape-canvas-bg: #f8f8f8;
}

/* 工具栏 */
.shape-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--shape-toolbar-bg);
  border-bottom: 1px solid var(--shape-border-color);
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
  color: var(--shape-text-color);
}

/* 形状选择器 */
.shape-selector {
  display: flex;
  border: 1px solid var(--shape-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.shape-button {
  padding: 6px 8px;
  background-color: white;
  border: none;
  border-right: 1px solid var(--shape-border-color);
  color: var(--shape-text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
}

.shape-button:last-child {
  border-right: none;
}

.shape-button:hover {
  background-color: #f0f0f0;
}

.shape-button.active {
  background-color: var(--shape-active-color);
  color: white;
}

.shape-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 边框和填充控制 */
.stroke-fill-controls {
  display: flex;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.control-group label {
  font-size: 14px;
  color: var(--shape-text-color);
}

.color-preview {
  width: 24px;
  height: 24px;
  border: 1px solid var(--shape-border-color);
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

/* 边框宽度控制 */
.stroke-width-control,
.corner-radius-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stroke-width-control label,
.corner-radius-control label {
  font-size: 14px;
  color: var(--shape-text-color);
  white-space: nowrap;
}

.stroke-width-control input[type="range"],
.corner-radius-control input[type="range"] {
  width: 100px;
  height: 4px;
  background: var(--shape-border-color);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.stroke-width-control input[type="range"]::-webkit-slider-thumb,
.corner-radius-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background-color: var(--shape-active-color);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stroke-width-control input[type="range"]::-moz-range-thumb,
.corner-radius-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background-color: var(--shape-active-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stroke-width-value,
.corner-radius-value {
  min-width: 40px;
  font-size: 14px;
  color: var(--shape-text-color);
}

/* 画布容器 */
.shape-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: var(--shape-canvas-bg);
  cursor: crosshair;
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

/* 形状元素 */
.shape-element {
  position: absolute;
  cursor: move;
  user-select: none;
}

.shape-element.active {
  outline: 2px dashed var(--shape-active-color);
  outline-offset: 2px;
}

.shape-element.drawing {
  pointer-events: none;
}

/* 多边形点 */
.polygon-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: var(--shape-active-color);
  border: 1px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 变换控制 */
.transform-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.rotate-handle {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background-color: var(--shape-active-color);
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: grab;
  pointer-events: auto;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--shape-active-color);
  border: 1px solid white;
  border-radius: 50%;
  pointer-events: auto;
}

/* 调整手柄位置 */
.nw-handle {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.n-handle {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.ne-handle {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.e-handle {
  top: 50%;
  right: -5px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.se-handle {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

.s-handle {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.sw-handle {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.w-handle {
  top: 50%;
  left: -5px;
  transform: translateY(-50%);
  cursor: w-resize;
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

/* 形状操作面板 */
.shape-operations {
  background-color: var(--shape-toolbar-bg);
  border-top: 1px solid var(--shape-border-color);
  padding: 16px;
  flex-shrink: 0;
}

.operations-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--shape-text-color);
}

.operation-group {
  margin-bottom: 16px;
}

.operation-group:last-child {
  margin-bottom: 0;
}

.operation-button {
  padding: 6px 12px;
  background-color: var(--shape-button-bg);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.operation-button:hover:not(:disabled) {
  background-color: var(--shape-button-hover);
}

.operation-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-button {
  background-color: #ff4d4f;
}

.delete-button:hover:not(:disabled) {
  background-color: #ff7875;
}

/* 对齐和分布按钮 */
.align-buttons,
.distribute-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.align-button,
.distribute-button {
  width: 36px;
  height: 36px;
  background-color: white;
  border: 1px solid var(--shape-border-color);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.align-button:hover:not(:disabled),
.distribute-button:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: var(--shape-active-color);
}

.align-button:disabled,
.distribute-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 禁用状态 */
.shape-tool.disabled {
  opacity: 0.7;
  pointer-events: none;
}

/* 图标样式 */
.icon-shape-rectangle::before { content: '□'; font-size: 18px; }
.icon-shape-circle::before { content: '○'; font-size: 18px; }
.icon-shape-ellipse::before { content: '⬭'; font-size: 18px; }
.icon-shape-line::before { content: '╱'; font-size: 18px; }
.icon-shape-polygon::before { content: '⬟'; font-size: 18px; }
.icon-rotate::before { content: '↻'; font-size: 12px; }
.icon-group::before { content: '⊞'; font-size: 14px; }
.icon-ungroup::before { content: '⊟'; font-size: 14px; }
.icon-delete::before { content: '✕'; font-size: 14px; }
.icon-shapes::before { content: '◩'; font-size: 24px; }
.icon-align-left::before { content: '◧'; font-size: 14px; }
.icon-align-center::before { content: '⧠'; font-size: 14px; }
.icon-align-right::before { content: '◨'; font-size: 14px; }
.icon-align-top::before { content: '◤'; font-size: 14px; }
.icon-align-middle::before { content: '⧠'; font-size: 14px; transform: rotate(90deg); }
.icon-align-bottom::before { content: '◢'; font-size: 14px; }
.icon-distribute-horizontal::before { content: '⫴'; font-size: 14px; }
.icon-distribute-vertical::before { content: '⫶'; font-size: 14px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .shape-toolbar {
    padding: 8px 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .stroke-width-control input[type="range"],
  .corner-radius-control input[type="range"] {
    width: 80px;
  }

  .shape-operations {
    padding: 12px;
  }

  .align-buttons,
  .distribute-buttons {
    justify-content: center;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .resize-handle {
    width: 16px;
    height: 16px;
  }

  .rotate-handle {
    width: 32px;
    height: 32px;
    top: -40px;
  }

  .shape-button,
  .align-button,
  .distribute-button {
    width: 44px;
    height: 44px;
  }
}
</style>
