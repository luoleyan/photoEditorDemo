# 部署指南

本指南提供了 PhotoEditor Demo 项目的完整部署方案，包括开发环境、测试环境和生产环境的部署步骤。

## 📋 目录

- [GitHub设置](github-setup.md) - GitHub仓库设置和发布
- [生产环境构建](production-build.md) - 生产环境部署指南

## 🚀 部署概览

### 支持的部署方式

1. **静态网站托管**
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting

2. **传统服务器**
   - Apache
   - Nginx
   - IIS

3. **容器化部署**
   - Docker
   - Kubernetes

4. **CDN部署**
   - AWS CloudFront
   - Cloudflare
   - 阿里云CDN

## 🏗️ 构建准备

### 环境要求

- **Node.js**: 14.0 或更高版本
- **npm**: 6.0 或更高版本
- **Git**: 用于版本控制

### 构建配置

#### vue.config.js 配置

```javascript
module.exports = {
  // 生产环境公共路径
  publicPath: process.env.NODE_ENV === 'production'
    ? '/photoEditorDemo/'  // GitHub Pages 路径
    : '/',
    
  // 输出目录
  outputDir: 'dist',
  
  // 静态资源目录
  assetsDir: 'static',
  
  // 生产环境不生成 source map
  productionSourceMap: false,
  
  // 配置 webpack
  configureWebpack: {
    optimization: {
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
          }
        }
      }
    }
  }
}
```

### 环境变量配置

创建 `.env.production` 文件：

```bash
# 生产环境配置
NODE_ENV=production
VUE_APP_API_BASE_URL=https://api.example.com
VUE_APP_CDN_URL=https://cdn.example.com
VUE_APP_VERSION=1.0.0
```

## 📦 构建流程

### 1. 安装依赖

```bash
# 清理缓存
npm cache clean --force

# 安装生产依赖
npm ci --only=production
```

### 2. 执行构建

```bash
# 生产环境构建
npm run build

# 构建并分析包大小
npm run build --report
```

### 3. 构建优化

#### 代码分割

```javascript
// 路由懒加载
const Home = () => import(/* webpackChunkName: "home" */ '@/views/Home.vue')
const Editor = () => import(/* webpackChunkName: "editor" */ '@/views/Editor.vue')
```

#### 资源压缩

```javascript
// vue.config.js
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  configureWebpack: {
    plugins: [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      })
    ]
  }
}
```

## 🌐 静态网站部署

### GitHub Pages 部署

1. **自动部署脚本**

```bash
#!/usr/bin/env sh

# 构建
npm run build

# 进入生成的文件夹
cd dist

# 初始化 git 仓库
git init
git add -A
git commit -m 'deploy'

# 推送到 gh-pages 分支
git push -f git@github.com:LuoLeYan/photoEditorDemo.git master:gh-pages

cd -
```

2. **GitHub Actions 自动部署**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Netlify 部署

1. **netlify.toml 配置**

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "16"
```

2. **部署步骤**
   - 连接 GitHub 仓库
   - 设置构建命令：`npm run build`
   - 设置发布目录：`dist`
   - 配置环境变量

## 🐳 容器化部署

### Dockerfile

```dockerfile
# 构建阶段
FROM node:16-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### Docker Compose

```yaml
version: '3.8'

services:
  photoeditor:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 📊 性能优化

### 构建优化

1. **Bundle 分析**

```bash
# 安装分析工具
npm install --save-dev webpack-bundle-analyzer

# 分析构建结果
npm run build --report
```

2. **代码分割策略**

```javascript
// 按路由分割
const routes = [
  {
    path: '/editor/:library',
    component: () => import('@/views/Editor.vue')
  }
]

// 按功能分割
const ImageEditor = () => import('@/components/ImageEditor.vue')
```

### 运行时优化

1. **资源预加载**

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/js/chunk-vendors.js" as="script">
```

2. **CDN 配置**

```javascript
// vue.config.js
module.exports = {
  configureWebpack: {
    externals: {
      'vue': 'Vue',
      'vue-router': 'VueRouter',
      'konva': 'Konva',
      'fabric': 'fabric'
    }
  }
}
```

## 🔍 部署验证

### 功能测试清单

- [ ] 页面正常加载
- [ ] 图片上传功能正常
- [ ] 各个编辑库功能正常
- [ ] 图片下载功能正常
- [ ] 响应式布局正常
- [ ] 浏览器兼容性正常

### 性能测试

```bash
# 使用 Lighthouse 进行性能测试
npm install -g lighthouse

# 测试网站性能
lighthouse https://your-domain.com --output html --output-path ./lighthouse-report.html
```

### 监控配置

```javascript
// 错误监控
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // 发送错误报告到监控服务
})

// 性能监控
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0]
  console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart)
})
```

## 📞 部署支持

### 常见问题

1. **路径问题** - 检查 `publicPath` 配置
2. **资源加载失败** - 检查 CDN 配置和跨域设置
3. **路由问题** - 配置服务器重定向规则

### 获取帮助

- 查看 [GitHub设置指南](github-setup.md)
- 查看 [生产环境构建指南](production-build.md)
- 在 GitHub 上提交 Issue

---

*准备开始部署？从 [GitHub设置](github-setup.md) 开始吧！*
