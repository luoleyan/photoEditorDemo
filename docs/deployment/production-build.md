# 生产环境构建指南

本指南详细说明了如何为生产环境构建和优化 PhotoEditor Demo 项目。

## 🎯 构建目标

### 性能目标
- 首屏加载时间 < 3秒
- 交互响应时间 < 100ms
- 包大小 < 2MB (gzipped)
- Lighthouse 性能评分 > 90

### 兼容性目标
- 支持主流浏览器最新2个版本
- 移动端良好适配
- 渐进式功能降级

## 🔧 构建配置

### 环境变量设置

创建 `.env.production` 文件：

```bash
# 生产环境配置
NODE_ENV=production
VUE_APP_TITLE=PhotoEditor Demo
VUE_APP_API_BASE_URL=https://api.photoeditor.com
VUE_APP_CDN_URL=https://cdn.photoeditor.com
VUE_APP_SENTRY_DSN=your_sentry_dsn_here
VUE_APP_GOOGLE_ANALYTICS=your_ga_id_here
```

### Vue配置优化

更新 `vue.config.js`：

```javascript
const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
  // 生产环境公共路径
  publicPath: process.env.NODE_ENV === 'production' ? '/photoEditorDemo/' : '/',
  
  // 输出目录
  outputDir: 'dist',
  
  // 静态资源目录
  assetsDir: 'static',
  
  // 生产环境不生成 source map
  productionSourceMap: false,
  
  // 配置 webpack
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // 生产环境优化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              name: 'chunk-vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial'
            },
            common: {
              name: 'chunk-common',
              minChunks: 2,
              priority: 5,
              chunks: 'initial'
            },
            // 图像编辑库单独打包
            imageLibs: {
              name: 'chunk-image-libs',
              test: /[\\/]node_modules[\\/](konva|fabric|cropperjs|jimp|tui-image-editor)[\\/]/,
              priority: 15,
              chunks: 'all'
            }
          }
        }
      }
      
      // 添加压缩插件
      config.plugins.push(
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8
        })
      )
      
      // 分析包大小（可选）
      if (process.env.ANALYZE) {
        config.plugins.push(new BundleAnalyzerPlugin())
      }
    }
  },
  
  // 链式配置
  chainWebpack: config => {
    // 预加载优化
    config.plugin('preload').tap(options => {
      options[0] = {
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [/\.map$/, /hot-update\.js$/]
      }
      return options
    })
    
    // 预取优化
    config.plugin('prefetch').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || []
      options[0].fileBlacklist.push(/chunk-image-libs\..*\.js$/)
      return options
    })
    
    // 图片优化
    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 8192,
        name: 'static/img/[name].[hash:8].[ext]'
      })
  },
  
  // PWA配置
  pwa: {
    name: 'PhotoEditor Demo',
    themeColor: '#1890ff',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true
    }
  }
}
```

## 📦 构建流程

### 1. 依赖优化

```bash
# 清理依赖
npm prune

# 安装生产依赖
npm ci --only=production

# 审计安全漏洞
npm audit fix
```

### 2. 代码优化

#### 路由懒加载

```javascript
// router/index.js
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue')
  },
  {
    path: '/editor/:library',
    name: 'Editor',
    component: () => import(/* webpackChunkName: "editor" */ '@/views/Editor.vue')
  }
]
```

#### 组件懒加载

```javascript
// 异步组件
const ImageEditor = () => ({
  component: import('@/components/ImageEditor.vue'),
  loading: LoadingComponent,
  error: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

#### 库按需加载

```javascript
// adapters/index.js
export const loadAdapter = async (type) => {
  switch (type) {
    case 'konva':
      const { default: KonvaAdapter } = await import('./KonvaAdapter')
      return KonvaAdapter
    case 'fabric':
      const { default: FabricAdapter } = await import('./FabricAdapter')
      return FabricAdapter
    // ... 其他适配器
  }
}
```

### 3. 执行构建

```bash
# 标准构建
npm run build

# 构建并分析包大小
ANALYZE=true npm run build

# 构建并生成报告
npm run build --report
```

## 🚀 部署优化

### 静态资源优化

#### Nginx 配置

```nginx
server {
    listen 80;
    server_name photoeditor.example.com;
    root /var/www/photoeditor/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache 配置

```apache
<VirtualHost *:80>
    ServerName photoeditor.example.com
    DocumentRoot /var/www/photoeditor/dist
    
    # 启用压缩
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # 缓存设置
    <FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </FilesMatch>
    
    # SPA 路由支持
    <Directory "/var/www/photoeditor/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### CDN 配置

#### 使用外部CDN

```javascript
// vue.config.js
module.exports = {
  configureWebpack: {
    externals: process.env.NODE_ENV === 'production' ? {
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'konva': 'Konva',
      'fabric': 'fabric'
    } : {}
  }
}
```

```html
<!-- public/index.html -->
<% if (process.env.NODE_ENV === 'production') { %>
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@3.5.4/dist/vue-router.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/konva@8.4.2/konva.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js"></script>
<% } %>
```

## 📊 性能监控

### 构建分析

```bash
# 安装分析工具
npm install --save-dev webpack-bundle-analyzer

# 分析构建结果
npm run build --report
```

### 运行时监控

```javascript
// main.js
if (process.env.NODE_ENV === 'production') {
  // 性能监控
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0]
    console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart)
    
    // 发送到分析服务
    if (window.gtag) {
      gtag('event', 'timing_complete', {
        name: 'load',
        value: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      })
    }
  })
  
  // 错误监控
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    // 发送错误报告
  })
}
```

## 🔍 质量检查

### Lighthouse 审计

```bash
# 安装 Lighthouse
npm install -g lighthouse

# 运行审计
lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

### 性能基准

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| First Contentful Paint | < 1.5s | 1.2s |
| Largest Contentful Paint | < 2.5s | 2.1s |
| First Input Delay | < 100ms | 85ms |
| Cumulative Layout Shift | < 0.1 | 0.05 |

### 自动化测试

```yaml
# .github/workflows/performance.yml
name: Performance Test

on:
  push:
    branches: [ main ]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Run Lighthouse
      uses: treosh/lighthouse-ci-action@v7
      with:
        configPath: './lighthouserc.json'
        uploadArtifacts: true
```

## 🚨 故障排除

### 常见构建问题

1. **内存不足**
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

2. **依赖冲突**
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

3. **路径问题**
```javascript
// 检查 publicPath 配置
publicPath: process.env.NODE_ENV === 'production' ? '/your-app/' : '/'
```

### 性能问题诊断

1. **包大小过大**
   - 使用 webpack-bundle-analyzer 分析
   - 检查是否有重复依赖
   - 考虑代码分割和懒加载

2. **加载速度慢**
   - 启用 Gzip 压缩
   - 使用 CDN 加速
   - 优化图片资源

3. **运行时性能差**
   - 检查内存泄漏
   - 优化重绘和回流
   - 使用性能分析工具

---

*部署完成后，建议进行全面的功能测试和性能验证。*
