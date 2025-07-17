<template>
  <div class="home">
    <div class="hero-section">
      <h1>JavaScript 图片编辑库演示</h1>
      <p class="hero-description">
        这个演示应用展示了5个流行的JavaScript图片编辑库的核心功能，包括图片裁剪、旋转、亮度和对比度调节。
      </p>
    </div>

    <div class="libraries-grid">
      <div class="library-card" @click="$router.push('/tui-editor')">
        <div class="card-header">
          <h3>TUI Image Editor</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 功能全面，UI界面完整，开箱即用</p>
          <p><strong>适用场景：</strong> 需要快速集成完整图片编辑功能的项目</p>
          <div class="features">
            <span class="feature-tag">裁剪</span>
            <span class="feature-tag">旋转</span>
            <span class="feature-tag">滤镜</span>
            <span class="feature-tag">文本</span>
          </div>
        </div>
      </div>

      <div class="library-card" @click="$router.push('/fabric-editor')">
        <div class="card-header">
          <h3>Fabric.js</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 高度可定制，Canvas API封装，灵活性极高</p>
          <p><strong>适用场景：</strong> 需要高度定制化图片编辑功能的项目</p>
          <div class="features">
            <span class="feature-tag">Canvas</span>
            <span class="feature-tag">交互</span>
            <span class="feature-tag">动画</span>
            <span class="feature-tag">滤镜</span>
          </div>
        </div>
      </div>

      <div class="library-card" @click="$router.push('/cropper-editor')">
        <div class="card-header">
          <h3>Cropper.js</h3>
          <span class="rating">⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 专业裁剪功能，轻量级，易于使用</p>
          <p><strong>适用场景：</strong> 主要需求是图片裁剪的项目</p>
          <div class="features">
            <span class="feature-tag">裁剪</span>
            <span class="feature-tag">缩放</span>
            <span class="feature-tag">旋转</span>
            <span class="feature-tag">触摸</span>
          </div>
        </div>
      </div>

      <div class="library-card" @click="$router.push('/jimp-editor')">
        <div class="card-header">
          <h3>Jimp</h3>
          <span class="rating">⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 纯JavaScript，Node.js兼容，零依赖</p>
          <p><strong>适用场景：</strong> 服务端图片处理或Web Worker中处理</p>
          <div class="features">
            <span class="feature-tag">服务端</span>
            <span class="feature-tag">滤镜</span>
            <span class="feature-tag">调色</span>
            <span class="feature-tag">格式转换</span>
          </div>
        </div>
      </div>

      <div class="library-card" @click="$router.push('/konva-editor')">
        <div class="card-header">
          <h3>Konva.js</h3>
          <span class="rating">⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 高性能2D图形库，丰富的动画支持</p>
          <p><strong>适用场景：</strong> 需要复杂图形交互和动画效果的应用</p>
          <div class="features">
            <span class="feature-tag">高性能</span>
            <span class="feature-tag">动画</span>
            <span class="feature-tag">事件</span>
            <span class="feature-tag">图层</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/unified-editor')"
      >
        <div class="card-header">
          <h3>统一图像编辑器</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 整合多个库优势，统一API，智能库选择</p>
          <p>
            <strong>适用场景：</strong> 需要全面图像编辑功能且追求最佳性能的应用
          </p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">多库整合</span>
            <span class="feature-tag">统一API</span>
            <span class="feature-tag">高性能</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/ui-components')"
      >
        <div class="card-header">
          <h3>UI组件库演示</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 响应式设计，主题支持，丰富的交互组件</p>
          <p><strong>适用场景：</strong> 需要专业UI界面的图像编辑应用</p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">响应式</span>
            <span class="feature-tag">主题化</span>
            <span class="feature-tag">组件化</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/advanced-ui')"
      >
        <div class="card-header">
          <h3>高级UI组件演示</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 完整编辑器界面，图像调整面板，变换控制</p>
          <p><strong>适用场景：</strong> 专业图像编辑软件，照片处理应用</p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">高级组件</span>
            <span class="feature-tag">集成演示</span>
            <span class="feature-tag">适配器兼容</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/advanced-components')"
      >
        <div class="card-header">
          <h3>高级功能组件演示</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 图像预览，历史记录，滤镜效果</p>
          <p><strong>适用场景：</strong> 专业图像编辑器，照片处理应用</p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">图像预览</span>
            <span class="feature-tag">历史记录</span>
            <span class="feature-tag">滤镜效果</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/mid-priority-components')"
      >
        <div class="card-header">
          <h3>中优先级功能组件演示</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 图层管理，裁剪工具，文本编辑</p>
          <p><strong>适用场景：</strong> 专业图像编辑器，照片处理应用</p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">图层管理</span>
            <span class="feature-tag">裁剪工具</span>
            <span class="feature-tag">文本编辑</span>
          </div>
        </div>
      </div>

      <div
        class="library-card special-card"
        @click="$router.push('/low-priority-components')"
      >
        <div class="card-header">
          <h3>低优先级功能组件演示</h3>
          <span class="rating">⭐⭐⭐⭐⭐</span>
        </div>
        <div class="card-content">
          <p><strong>特点：</strong> 形状工具，画笔工具，导出面板</p>
          <p><strong>适用场景：</strong> 创意设计工具，绘图应用，内容导出</p>
          <div class="features">
            <span class="feature-tag highlight">新功能</span>
            <span class="feature-tag">形状绘制</span>
            <span class="feature-tag">自由绘制</span>
            <span class="feature-tag">多格式导出</span>
          </div>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h2>功能对比</h2>
      <div class="comparison-table">
        <table>
          <thead>
            <tr>
              <th>库名称</th>
              <th>文件大小</th>
              <th>学习难度</th>
              <th>定制化程度</th>
              <th>移动端支持</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TUI Image Editor</td>
              <td>~200KB</td>
              <td>简单</td>
              <td>中等</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Fabric.js</td>
              <td>~150KB</td>
              <td>中等</td>
              <td>很高</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Cropper.js</td>
              <td>~50KB</td>
              <td>简单</td>
              <td>低</td>
              <td>✅</td>
            </tr>
            <tr>
              <td>Jimp</td>
              <td>~100KB</td>
              <td>简单</td>
              <td>中等</td>
              <td>❌</td>
            </tr>
            <tr>
              <td>Konva.js</td>
              <td>~120KB</td>
              <td>中等</td>
              <td>高</td>
              <td>✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomeView",
};
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-description {
  font-size: 1.2rem;
  color: #5a6c7d;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.libraries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.library-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.library-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.rating {
  font-size: 1rem;
}

.card-content p {
  margin-bottom: 0.8rem;
  color: #5a6c7d;
  line-height: 1.5;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.feature-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-section h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.comparison-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e1e8ed;
}

th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

tr:hover {
  background-color: #f8f9fa;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
    padding: 0 1rem;
  }

  .libraries-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .library-card {
    padding: 1rem;
  }

  .info-section {
    padding: 1rem;
  }

  .comparison-table {
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.5rem;
  }
}
</style>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-description {
  font-size: 1.2rem;
  color: #5a6c7d;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.libraries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.library-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.library-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.rating {
  font-size: 1rem;
}

.card-content p {
  margin-bottom: 0.8rem;
  color: #5a6c7d;
  line-height: 1.5;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.feature-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.feature-tag.highlight {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.special-card {
  border: 2px solid #ff6b6b;
  background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
}

.special-card .card-header h3 {
  color: #c92a2a;
}

.info-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.info-section h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.comparison-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e1e8ed;
}

th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

tr:hover {
  background-color: #f8f9fa;
}

@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
    padding: 0 1rem;
  }

  .libraries-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .library-card {
    padding: 1rem;
  }

  .info-section {
    padding: 1rem;
  }

  .comparison-table {
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.5rem;
  }
}
</style>
