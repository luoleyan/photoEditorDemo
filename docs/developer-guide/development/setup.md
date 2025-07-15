# 开发环境设置

本指南将帮助您设置 PhotoEditor Demo 项目的完整开发环境。

## 🎯 环境要求

### 系统要求
- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **内存**: 最少 4GB RAM，推荐 8GB+
- **存储**: 至少 2GB 可用空间
- **网络**: 稳定的互联网连接（用于下载依赖）

### 必需软件

#### 1. Node.js
```bash
# 检查当前版本
node --version
npm --version

# 推荐版本
Node.js: 16.x 或更高版本
npm: 8.x 或更高版本
```

**安装方法**:
- 访问 [Node.js官网](https://nodejs.org/) 下载LTS版本
- 或使用版本管理器：
  ```bash
  # 使用 nvm (推荐)
  nvm install 16
  nvm use 16
  
  # 使用 fnm
  fnm install 16
  fnm use 16
  ```

#### 2. Git
```bash
# 检查版本
git --version

# 推荐版本: 2.30+
```

**安装方法**:
- Windows: 下载 [Git for Windows](https://git-scm.com/download/win)
- macOS: `brew install git` 或使用 Xcode Command Line Tools
- Linux: `sudo apt-get install git` (Ubuntu/Debian)

#### 3. 代码编辑器

**推荐 Visual Studio Code**:
- 下载地址: [VS Code官网](https://code.visualstudio.com/)
- 必装扩展:
  - Vue Language Features (Volar)
  - ESLint
  - Prettier - Code formatter
  - GitLens
  - Auto Rename Tag

**或者 WebStorm**:
- 专业的JavaScript IDE
- 内置Vue.js支持
- 强大的调试功能

## 🚀 项目设置

### 1. 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/LuoLeYan/photoEditorDemo.git

# 或使用 SSH (推荐)
git clone git@github.com:LuoLeYan/photoEditorDemo.git

# 进入项目目录
cd photoEditorDemo
```

### 2. 安装依赖

```bash
# 使用 npm (推荐)
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm (更快)
pnpm install
```

**如果遇到安装问题**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install

# 使用淘宝镜像 (中国用户)
npm config set registry https://registry.npmmirror.com
npm install
```

### 3. 环境配置

#### 创建环境变量文件

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
# .env.local
VUE_APP_TITLE=PhotoEditor Demo - Dev
VUE_APP_API_BASE_URL=http://localhost:3000
VUE_APP_DEBUG=true
```

#### 配置开发工具

**VS Code 配置** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "vetur.validation.template": false,
  "vetur.validation.script": false,
  "vetur.validation.style": false,
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**VS Code 调试配置** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run serve

# 或指定端口
npm run serve -- --port 3000

# 启动并自动打开浏览器
npm run serve -- --open
```

成功启动后，您将看到：
```
App running at:
- Local:   http://localhost:8080/
- Network: http://192.168.1.100:8080/
```

## 🔧 开发工具配置

### ESLint 配置

项目使用 ESLint 进行代码检查：

```bash
# 运行代码检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix
```

**自定义规则** (`.eslintrc.js`):
```javascript
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off'
  }
}
```

### Prettier 配置

代码格式化配置 (`.prettierrc`):
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Git Hooks

使用 husky 和 lint-staged 确保代码质量：

```bash
# 安装 husky
npm install --save-dev husky lint-staged

# 初始化 husky
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**lint-staged 配置** (`package.json`):
```json
{
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "prettier --write"
    ],
    "*.md": [
      "prettier --write"
    ]
  }
}
```

## 🧪 测试环境设置

### 单元测试

```bash
# 运行单元测试
npm run test:unit

# 监听模式
npm run test:unit -- --watch

# 生成覆盖率报告
npm run test:unit -- --coverage
```

### 端到端测试

```bash
# 安装 Cypress
npm install --save-dev cypress

# 运行 E2E 测试
npm run test:e2e

# 打开 Cypress 界面
npx cypress open
```

## 🔍 调试技巧

### 浏览器调试

1. **Vue DevTools**
   - 安装 Vue DevTools 浏览器扩展
   - 在开发者工具中查看 Vue 组件状态

2. **Chrome DevTools**
   - 使用 Sources 面板设置断点
   - 使用 Console 面板调试
   - 使用 Network 面板监控请求

### VS Code 调试

1. **设置断点**
   - 在代码行号左侧点击设置断点
   - 使用 F5 启动调试

2. **调试配置**
   - 配置 `.vscode/launch.json`
   - 支持源码映射调试

### 常用调试命令

```javascript
// 在组件中添加调试信息
console.log('Component data:', this.$data)
console.log('Component props:', this.$props)

// 性能监控
console.time('operation')
// ... 执行操作
console.timeEnd('operation')

// 条件断点
if (condition) {
  debugger
}
```

## 📊 性能监控

### 开发环境性能分析

```bash
# 构建分析
npm run build -- --report

# 启动性能分析
npm run serve -- --analyze
```

### 内存监控

```javascript
// 监控内存使用
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
    })
  }
}, 5000)
```

## 🚨 常见问题

### 依赖安装问题

1. **网络问题**
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 或临时使用
npm install --registry https://registry.npmmirror.com
```

2. **权限问题**
```bash
# macOS/Linux
sudo npm install -g npm

# Windows (以管理员身份运行)
npm install -g npm
```

3. **版本冲突**
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json
npm install
```

### 开发服务器问题

1. **端口占用**
```bash
# 查看端口占用
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# 使用其他端口
npm run serve -- --port 3000
```

2. **热重载不工作**
```bash
# 检查文件监听限制 (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 📚 学习资源

### 官方文档
- [Vue.js 官方文档](https://vuejs.org/)
- [Vue CLI 文档](https://cli.vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/)

### 图像编辑库文档
- [Konva.js 文档](https://konvajs.org/docs/)
- [Fabric.js 文档](http://fabricjs.com/docs/)
- [TUI Image Editor 文档](https://ui.toast.com/tui-image-editor)

### 开发工具
- [VS Code 文档](https://code.visualstudio.com/docs)
- [Chrome DevTools 指南](https://developers.google.com/web/tools/chrome-devtools)

---

*环境设置完成后，查看 [贡献指南](contributing.md) 了解开发流程。*
