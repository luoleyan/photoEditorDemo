<template>
  <div class="low-priority-components-demo">
    <div class="demo-header">
      <h1>低优先级功能组件演示</h1>
      <p>展示ShapeTool、BrushTool和ExportPanel组件的专业功能和交互</p>
    </div>

    <!-- 形状工具演示 -->
    <div class="demo-section">
      <h2>ShapeTool 形状工具</h2>
      <div class="demo-description">
        <p>支持基本形状绘制、属性调整、变换操作和组合功能</p>
      </div>
      
      <div class="shape-demo-container">
        <div class="shape-wrapper">
          <shape-tool
            :background-image="shapeBackgroundImage"
            :initial-shapes="shapeElements"
            :variant="shapeVariant"
            @shapes-change="handleShapesChange"
            @shape-add="handleShapeAdd"
            @shape-select="handleShapeSelect"
            @shape-style-change="handleShapeStyleChange"
            @shape-move="handleShapeMove"
            @shape-rotate="handleShapeRotate"
            @shape-resize="handleShapeResize"
            @shapes-group="handleShapesGroup"
            @shapes-ungroup="handleShapesUngroup"
            @shapes-align="handleShapesAlign"
            @shapes-distribute="handleShapesDistribute"
            @shapes-delete="handleShapesDelete"
          />
        </div>
        
        <div class="shape-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>背景图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in shapeBackgroundImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': shapeBackgroundImage === image.src }"
                @click="selectShapeBackground(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <button @click="addSampleShapes">添加示例形状</button>
            <button @click="clearAllShapes">清空所有形状</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="shapeVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="compact">紧凑</option>
            </select>
          </div>
          
          <div class="shape-info">
            <h4>形状信息</h4>
            <p>形状数量: {{ shapeElements.length }}</p>
            <p>选中形状: {{ selectedShapeId ? '是' : '否' }}</p>
            <div v-if="selectedShape">
              <p>类型: {{ selectedShape.type }}</p>
              <p>位置: {{ Math.round(selectedShape.x) }}, {{ Math.round(selectedShape.y) }}</p>
              <p>尺寸: {{ Math.round(selectedShape.width) }} × {{ Math.round(selectedShape.height) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 画笔工具演示 -->
    <div class="demo-section">
      <h2>BrushTool 画笔工具</h2>
      <div class="demo-description">
        <p>支持多种画笔类型、属性调整、压力感应和混合模式</p>
      </div>
      
      <div class="brush-demo-container">
        <div class="brush-wrapper">
          <brush-tool
            :background-image="brushBackgroundImage"
            :initial-strokes="brushStrokes"
            :variant="brushVariant"
            :width="800"
            :height="600"
            @strokes-change="handleStrokesChange"
            @stroke-add="handleStrokeAdd"
            @stroke-undo="handleStrokeUndo"
            @stroke-redo="handleStrokeRedo"
            @canvas-clear="handleCanvasClear"
          />
        </div>
        
        <div class="brush-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>背景图像:</label>
            <div class="image-selector">
              <div 
                v-for="(image, index) in brushBackgroundImages" 
                :key="index"
                class="image-option"
                :class="{ 'active': brushBackgroundImage === image.src }"
                @click="selectBrushBackground(image.src)"
              >
                <img :src="image.src" :alt="image.name" />
              </div>
            </div>
          </div>
          
          <div class="control-group">
            <button @click="loadSampleStrokes">加载示例笔触</button>
            <button @click="clearAllStrokes">清空画布</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="brushVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="compact">紧凑</option>
            </select>
          </div>
          
          <div class="brush-info">
            <h4>画笔信息</h4>
            <p>笔触数量: {{ brushStrokes.length }}</p>
            <p>画布状态: {{ brushStrokes.length > 0 ? '有内容' : '空白' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出面板演示 -->
    <div class="demo-section">
      <h2>ExportPanel 导出面板</h2>
      <div class="demo-description">
        <p>支持多格式导出、质量设置、批量导出和导出预览</p>
      </div>
      
      <div class="export-demo-container">
        <div class="export-wrapper">
          <export-panel
            :source-canvas="exportSourceCanvas"
            :variant="exportVariant"
            @export-complete="handleExportComplete"
            @export-cancel="handleExportCancel"
            @file-download="handleFileDownload"
            @all-files-download="handleAllFilesDownload"
            @results-clear="handleResultsClear"
          />
        </div>
        
        <div class="export-controls">
          <h3>控制选项</h3>
          <div class="control-group">
            <label>源画布:</label>
            <div class="canvas-selector">
              <button 
                class="canvas-option"
                :class="{ 'active': currentExportSource === 'sample' }"
                @click="setExportSource('sample')"
              >
                示例图像
              </button>
              <button 
                class="canvas-option"
                :class="{ 'active': currentExportSource === 'shapes' }"
                @click="setExportSource('shapes')"
              >
                形状画布
              </button>
              <button 
                class="canvas-option"
                :class="{ 'active': currentExportSource === 'brush' }"
                @click="setExportSource('brush')"
              >
                画笔画布
              </button>
            </div>
          </div>
          
          <div class="control-group">
            <button @click="generateSampleCanvas">生成示例画布</button>
            <button @click="clearExportSource">清空源画布</button>
          </div>
          
          <div class="control-group">
            <label>变体样式:</label>
            <select v-model="exportVariant">
              <option value="default">默认</option>
              <option value="minimal">简约</option>
              <option value="compact">紧凑</option>
            </select>
          </div>
          
          <div class="export-info">
            <h4>导出信息</h4>
            <p>源画布: {{ getExportSourceName() }}</p>
            <p>画布尺寸: {{ exportCanvasWidth }} × {{ exportCanvasHeight }}</p>
            <p>导出次数: {{ exportCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 集成演示 -->
    <div class="demo-section">
      <h2>组件集成演示</h2>
      <div class="demo-description">
        <p>展示三个低优先级组件的集成效果，模拟完整的创作和导出工作流</p>
      </div>
      
      <div class="integrated-demo-container">
        <div class="integrated-editor">
          <editor-container
            :theme="integratedTheme"
            :loading="integratedLoading"
            loading-text="正在处理..."
          >
            <!-- 顶部工具栏 -->
            <template #toolbar-top>
              <div class="integrated-toolbar">
                <div class="toolbar-section">
                  <h3>创作工作台</h3>
                </div>
                <div class="toolbar-section">
                  <button 
                    class="mode-button"
                    :class="{ 'active': integratedMode === 'shape' }"
                    @click="setIntegratedMode('shape')"
                  >
                    形状绘制
                  </button>
                  <button 
                    class="mode-button"
                    :class="{ 'active': integratedMode === 'brush' }"
                    @click="setIntegratedMode('brush')"
                  >
                    自由绘制
                  </button>
                  <button 
                    class="mode-button"
                    :class="{ 'active': integratedMode === 'export' }"
                    @click="setIntegratedMode('export')"
                  >
                    导出作品
                  </button>
                </div>
              </div>
            </template>

            <!-- 画布区域 -->
            <template #canvas>
              <shape-tool
                v-if="integratedMode === 'shape'"
                :show-toolbar="false"
                :initial-shapes="integratedShapes"
                @shapes-change="handleIntegratedShapesChange"
                @shape-add="handleIntegratedShapeAdd"
              />
              
              <brush-tool
                v-else-if="integratedMode === 'brush'"
                :show-toolbar="false"
                :initial-strokes="integratedStrokes"
                :width="800"
                :height="600"
                @strokes-change="handleIntegratedStrokesChange"
                @stroke-add="handleIntegratedStrokeAdd"
              />
              
              <export-panel
                v-else-if="integratedMode === 'export'"
                :show-header="false"
                :source-canvas="integratedCanvas"
                @export-complete="handleIntegratedExportComplete"
              />
              
              <div v-else class="canvas-placeholder">
                <i class="icon-canvas"></i>
                <p>选择工具开始创作</p>
              </div>
            </template>

            <!-- 右侧面板 -->
            <template #sidebar-right>
              <div class="integrated-properties">
                <h4>属性面板</h4>
                <div v-if="integratedMode === 'shape'" class="shape-properties">
                  <p>形状工具属性</p>
                  <p>形状数量: {{ integratedShapes.length }}</p>
                </div>
                <div v-else-if="integratedMode === 'brush'" class="brush-properties">
                  <p>画笔工具属性</p>
                  <p>笔触数量: {{ integratedStrokes.length }}</p>
                </div>
                <div v-else-if="integratedMode === 'export'" class="export-properties">
                  <p>导出工具属性</p>
                  <p>准备导出作品</p>
                </div>
              </div>
            </template>

            <!-- 状态栏 -->
            <template #status-bar>
              <div class="integrated-status">
                <span>当前模式: {{ getIntegratedModeTitle() }}</span>
                <span>形状: {{ integratedShapes.length }}</span>
                <span>笔触: {{ integratedStrokes.length }}</span>
              </div>
            </template>
          </editor-container>
        </div>
        
        <div class="integrated-controls">
          <h3>集成控制</h3>
          <div class="control-group">
            <label>编辑器主题:</label>
            <select v-model="integratedTheme">
              <option value="light">亮色</option>
              <option value="dark">暗色</option>
            </select>
          </div>
          
          <div class="control-group">
            <button @click="simulateIntegratedLoading">模拟加载</button>
            <button @click="resetIntegratedDemo">重置演示</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ShapeTool from '@/components/ui/ShapeTool.vue';
import BrushTool from '@/components/ui/BrushTool.vue';
import ExportPanel from '@/components/ui/ExportPanel.vue';
import EditorContainer from '@/components/ui/EditorContainer.vue';

export default {
  name: 'LowPriorityComponentsDemo',
  components: {
    ShapeTool,
    BrushTool,
    ExportPanel,
    EditorContainer
  },

  data() {
    return {
      // 形状工具相关
      shapeElements: [],
      selectedShapeId: '',
      shapeBackgroundImage: 'https://picsum.photos/800/600?random=40',
      shapeVariant: 'default',
      shapeBackgroundImages: [
        { name: '背景1', src: 'https://picsum.photos/800/600?random=40' },
        { name: '背景2', src: 'https://picsum.photos/800/600?random=41' },
        { name: '背景3', src: 'https://picsum.photos/800/600?random=42' },
        { name: '背景4', src: 'https://picsum.photos/800/600?random=43' }
      ],

      // 画笔工具相关
      brushStrokes: [],
      brushBackgroundImage: 'https://picsum.photos/800/600?random=50',
      brushVariant: 'default',
      brushBackgroundImages: [
        { name: '背景1', src: 'https://picsum.photos/800/600?random=50' },
        { name: '背景2', src: 'https://picsum.photos/800/600?random=51' },
        { name: '背景3', src: 'https://picsum.photos/800/600?random=52' },
        { name: '背景4', src: 'https://picsum.photos/800/600?random=53' }
      ],

      // 导出面板相关
      exportSourceCanvas: null,
      exportVariant: 'default',
      currentExportSource: 'sample',
      exportCanvasWidth: 800,
      exportCanvasHeight: 600,
      exportCount: 0,

      // 集成演示相关
      integratedTheme: 'light',
      integratedLoading: false,
      integratedMode: 'shape',
      integratedShapes: [],
      integratedStrokes: [],
      integratedCanvas: null
    };
  },

  computed: {
    // 选中的形状
    selectedShape() {
      return this.shapeElements.find(shape => shape.id === this.selectedShapeId) || null;
    }
  },

  mounted() {
    // 初始化示例数据
    this.initializeShapeElements();
    this.generateSampleCanvas();
  },

  methods: {
    // ========== 形状工具相关方法 ==========

    /**
     * 初始化形状元素
     */
    initializeShapeElements() {
      this.shapeElements = [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          rotation: 0,
          strokeColor: '#1890ff',
          fillColor: 'rgba(24, 144, 255, 0.2)',
          strokeWidth: 2,
          cornerRadius: 0
        }
      ];
    },

    /**
     * 选择形状背景
     */
    selectShapeBackground(src) {
      this.shapeBackgroundImage = src;
    },

    /**
     * 添加示例形状
     */
    addSampleShapes() {
      const shapes = [
        {
          id: `circle-${Date.now()}`,
          type: 'circle',
          x: 300,
          y: 200,
          width: 100,
          height: 100,
          rotation: 0,
          strokeColor: '#52c41a',
          fillColor: 'rgba(82, 196, 26, 0.2)',
          strokeWidth: 2
        },
        {
          id: `ellipse-${Date.now() + 1}`,
          type: 'ellipse',
          x: 500,
          y: 300,
          width: 150,
          height: 100,
          rotation: 30,
          strokeColor: '#722ed1',
          fillColor: 'rgba(114, 46, 209, 0.2)',
          strokeWidth: 2
        },
        {
          id: `line-${Date.now() + 2}`,
          type: 'line',
          x: 200,
          y: 400,
          width: 200,
          height: 100,
          rotation: 0,
          strokeColor: '#fa8c16',
          strokeWidth: 3
        }
      ];

      this.shapeElements.push(...shapes);
    },

    /**
     * 清空所有形状
     */
    clearAllShapes() {
      this.shapeElements = [];
      this.selectedShapeId = '';
    },

    /**
     * 处理形状变化
     */
    handleShapesChange(shapes) {
      console.log('形状变化:', shapes);
    },

    /**
     * 处理形状添加
     */
    handleShapeAdd(shape) {
      console.log('形状添加:', shape);
    },

    /**
     * 处理形状选择
     */
    handleShapeSelect(shape) {
      this.selectedShapeId = shape.id;
      console.log('形状选择:', shape);
    },

    /**
     * 处理形状样式变化
     */
    handleShapeStyleChange(shape) {
      console.log('形状样式变化:', shape);
    },

    /**
     * 处理形状移动
     */
    handleShapeMove(shape) {
      console.log('形状移动:', shape);
    },

    /**
     * 处理形状旋转
     */
    handleShapeRotate(shape) {
      console.log('形状旋转:', shape);
    },

    /**
     * 处理形状调整大小
     */
    handleShapeResize(shape) {
      console.log('形状调整大小:', shape);
    },

    /**
     * 处理形状组合
     */
    handleShapesGroup(groupShape) {
      console.log('形状组合:', groupShape);
    },

    /**
     * 处理形状取消组合
     */
    handleShapesUngroup(shapes) {
      console.log('形状取消组合:', shapes);
    },

    /**
     * 处理形状对齐
     */
    handleShapesAlign(data) {
      console.log('形状对齐:', data);
    },

    /**
     * 处理形状分布
     */
    handleShapesDistribute(data) {
      console.log('形状分布:', data);
    },

    /**
     * 处理形状删除
     */
    handleShapesDelete(shapes) {
      console.log('形状删除:', shapes);
    },

    // ========== 画笔工具相关方法 ==========

    /**
     * 选择画笔背景
     */
    selectBrushBackground(src) {
      this.brushBackgroundImage = src;
    },

    /**
     * 加载示例笔触
     */
    loadSampleStrokes() {
      // 在实际应用中，这里应该加载真实的笔触数据
      // 这里只是模拟一些笔触
      this.brushStrokes = [
        {
          type: 'pencil',
          color: '#000000',
          size: 5,
          opacity: 0.8,
          hardness: 1,
          flow: 1,
          spacing: 0.25,
          blendMode: 'normal',
          isEraser: false,
          points: [
            { x: 100, y: 100, pressure: 1 },
            { x: 200, y: 150, pressure: 1 },
            { x: 300, y: 100, pressure: 1 }
          ]
        },
        {
          type: 'brush',
          color: '#ff0000',
          size: 20,
          opacity: 0.5,
          hardness: 0.8,
          flow: 0.9,
          spacing: 0.3,
          blendMode: 'normal',
          isEraser: false,
          points: [
            { x: 400, y: 200, pressure: 1 },
            { x: 500, y: 250, pressure: 0.8 },
            { x: 600, y: 200, pressure: 0.6 }
          ]
        }
      ];
    },

    /**
     * 清空所有笔触
     */
    clearAllStrokes() {
      this.brushStrokes = [];
    },

    /**
     * 处理笔触变化
     */
    handleStrokesChange(strokes) {
      console.log('笔触变化:', strokes);
    },

    /**
     * 处理笔触添加
     */
    handleStrokeAdd() {
      console.log('笔触添加');
    },

    /**
     * 处理笔触撤销
     */
    handleStrokeUndo() {
      console.log('笔触撤销');
    },

    /**
     * 处理笔触重做
     */
    handleStrokeRedo() {
      console.log('笔触重做');
    },

    /**
     * 处理画布清空
     */
    handleCanvasClear() {
      console.log('画布清空');
    },

    // ========== 导出面板相关方法 ==========

    /**
     * 设置导出源
     */
    setExportSource(source) {
      this.currentExportSource = source;

      // 更新导出源画布
      switch (source) {
        case 'sample':
          this.generateSampleCanvas();
          break;
        case 'shapes':
          // 在实际应用中，这里应该从形状工具获取画布
          this.generateSampleCanvas();
          break;
        case 'brush':
          // 在实际应用中，这里应该从画笔工具获取画布
          this.generateSampleCanvas();
          break;
      }
    },

    /**
     * 生成示例画布
     */
    generateSampleCanvas() {
      // 创建示例画布
      const canvas = document.createElement('canvas');
      canvas.width = this.exportCanvasWidth;
      canvas.height = this.exportCanvasHeight;

      const ctx = canvas.getContext('2d');

      // 绘制背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制一些形状
      ctx.fillStyle = 'rgba(24, 144, 255, 0.2)';
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(100, 100, 200, 150);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(82, 196, 26, 0.2)';
      ctx.strokeStyle = '#52c41a';
      ctx.beginPath();
      ctx.arc(400, 200, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(250, 140, 22, 0.2)';
      ctx.strokeStyle = '#fa8c16';
      ctx.beginPath();
      ctx.moveTo(500, 300);
      ctx.lineTo(600, 350);
      ctx.lineTo(700, 300);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 绘制文本
      ctx.fillStyle = '#333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('示例画布', canvas.width / 2, 50);

      this.exportSourceCanvas = canvas;
    },

    /**
     * 清空导出源
     */
    clearExportSource() {
      const canvas = document.createElement('canvas');
      canvas.width = this.exportCanvasWidth;
      canvas.height = this.exportCanvasHeight;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.exportSourceCanvas = canvas;
    },

    /**
     * 获取导出源名称
     */
    getExportSourceName() {
      const names = {
        'sample': '示例图像',
        'shapes': '形状画布',
        'brush': '画笔画布'
      };
      return names[this.currentExportSource] || '未知源';
    },

    /**
     * 处理导出完成
     */
    handleExportComplete(results) {
      this.exportCount++;
      console.log('导出完成:', results);
      alert(`导出完成！共导出 ${results.length} 个文件`);
    },

    /**
     * 处理导出取消
     */
    handleExportCancel() {
      console.log('导出取消');
      alert('导出已取消');
    },

    /**
     * 处理文件下载
     */
    handleFileDownload(result) {
      console.log('文件下载:', result);
    },

    /**
     * 处理全部文件下载
     */
    handleAllFilesDownload(results) {
      console.log('全部文件下载:', results);
    },

    /**
     * 处理结果清空
     */
    handleResultsClear() {
      console.log('结果清空');
    },

    // ========== 集成演示相关方法 ==========

    /**
     * 设置集成模式
     */
    setIntegratedMode(mode) {
      this.integratedMode = mode;
    },

    /**
     * 获取集成模式标题
     */
    getIntegratedModeTitle() {
      const titles = {
        'shape': '形状绘制',
        'brush': '自由绘制',
        'export': '导出作品'
      };
      return titles[this.integratedMode] || '未知模式';
    },

    /**
     * 处理集成形状变化
     */
    handleIntegratedShapesChange(shapes) {
      this.integratedShapes = shapes;
      this.updateIntegratedCanvas();
    },

    /**
     * 处理集成形状添加
     */
    handleIntegratedShapeAdd(shape) {
      console.log('集成形状添加:', shape);
      this.updateIntegratedCanvas();
    },

    /**
     * 处理集成笔触变化
     */
    handleIntegratedStrokesChange(strokes) {
      this.integratedStrokes = strokes;
      this.updateIntegratedCanvas();
    },

    /**
     * 处理集成笔触添加
     */
    handleIntegratedStrokeAdd() {
      console.log('集成笔触添加');
      this.updateIntegratedCanvas();
    },

    /**
     * 处理集成导出完成
     */
    handleIntegratedExportComplete(results) {
      console.log('集成导出完成:', results);
      alert(`集成导出完成！共导出 ${results.length} 个文件`);
    },

    /**
     * 更新集成画布
     */
    updateIntegratedCanvas() {
      // 在实际应用中，这里应该合并形状和笔触到一个画布
      // 这里只是创建一个示例画布
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      const ctx = canvas.getContext('2d');

      // 绘制背景
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制形状（简化）
      if (this.integratedShapes.length > 0) {
        ctx.fillStyle = 'rgba(24, 144, 255, 0.3)';
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(100, 100, 200, 150);
        ctx.fill();
        ctx.stroke();
      }

      // 绘制笔触（简化）
      if (this.integratedStrokes.length > 0) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(300, 300);
        ctx.lineTo(400, 350);
        ctx.lineTo(500, 300);
        ctx.stroke();
      }

      this.integratedCanvas = canvas;
    },

    /**
     * 模拟集成加载
     */
    simulateIntegratedLoading() {
      this.integratedLoading = true;

      setTimeout(() => {
        this.integratedLoading = false;
      }, 2000);
    },

    /**
     * 重置集成演示
     */
    resetIntegratedDemo() {
      this.integratedMode = 'shape';
      this.integratedShapes = [];
      this.integratedStrokes = [];
      this.integratedCanvas = null;
      this.integratedLoading = false;
    }
  }
};
</script>

<style scoped>
.low-priority-components-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.demo-header p {
  color: #666;
  font-size: 16px;
}

.demo-section {
  margin-bottom: 40px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.demo-description {
  margin-bottom: 20px;
  color: #666;
}

/* 形状演示 */
.shape-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.shape-wrapper {
  flex: 1;
  min-width: 400px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.shape-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.shape-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.shape-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.shape-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.shape-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 画笔演示 */
.brush-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.brush-wrapper {
  flex: 1;
  min-width: 400px;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.brush-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.brush-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.brush-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.brush-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.brush-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 导出演示 */
.export-demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.export-wrapper {
  flex: 1;
  min-width: 400px;
  max-height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-y: auto;
}

.export-controls {
  width: 250px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.export-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.canvas-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.canvas-option {
  padding: 8px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.canvas-option:hover {
  border-color: #007bff;
}

.canvas-option.active {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.export-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.export-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.export-info p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}

/* 集成演示 */
.integrated-demo-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.integrated-editor {
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.integrated-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.mode-button {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.mode-button:hover {
  background-color: #e8e8e8;
}

.mode-button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.canvas-placeholder i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.canvas-placeholder p {
  font-size: 16px;
}

.integrated-properties {
  padding: 20px;
  background-color: #f9f9f9;
  height: 100%;
}

.integrated-properties h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.shape-properties,
.brush-properties,
.export-properties {
  color: #666;
}

.shape-properties p,
.brush-properties p,
.export-properties p {
  margin: 8px 0;
  font-size: 14px;
}

.integrated-controls {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.integrated-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.integrated-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

/* 通用控件样式 */
.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

.image-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-option {
  width: 50px;
  height: 50px;
  border: 2px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-option:hover {
  transform: scale(1.05);
}

.image-option.active {
  border-color: #007bff;
}

.image-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

button {
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin-right: 8px;
}

button:hover {
  background-color: #0069d9;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  background-color: white;
}

/* 图标样式 */
.icon-canvas::before { content: '🎨'; font-size: 24px; }

/* 响应式样式 */
@media (max-width: 768px) {
  .shape-demo-container,
  .brush-demo-container,
  .export-demo-container {
    flex-direction: column;
  }

  .shape-wrapper,
  .brush-wrapper,
  .export-wrapper {
    height: 350px;
  }

  .shape-controls,
  .brush-controls,
  .export-controls {
    width: 100%;
  }

  .integrated-editor {
    height: 500px;
  }

  .integrated-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .toolbar-section {
    justify-content: center;
  }

  .canvas-selector {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
