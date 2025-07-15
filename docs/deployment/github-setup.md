# GitHub 设置指南

本指南将帮助您将 PhotoEditor Demo 项目发布到 GitHub，并设置自动部署。

> 本文档基于原始的 GITHUB_SETUP.md 整理而来，原文档已移除。

## 📋 准备工作

### 环境要求

- Git 已安装并配置
- GitHub 账户
- 项目已在本地完成开发

### 检查项目状态

```bash
# 确保项目可以正常构建
npm run build

# 检查项目文件
ls -la
```

## 🚀 GitHub 仓库设置

### 1. 初始化 Git 仓库（如果尚未完成）

```bash
# 进入项目目录
cd path/to/photoEditorDemo

# 初始化 Git 仓库
git init

# 设置默认分支名
git branch -M main
```

### 2. 添加文件到 Git

```bash
# 添加所有文件到 Git
git add .

# 或者选择性添加特定文件
git add package.json README.md LICENSE docs/ src/ public/

# 检查暂存区状态
git status
```

### 3. 创建初始提交

```bash
# 创建初始提交
git commit -m "Initial commit: PhotoEditor Demo with multi-library adapter architecture"
```

### 4. 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com/)
2. 登录您的账户
3. 点击右上角的 "+" 图标
4. 选择 "New repository"
5. 填写仓库信息：
   - **Repository name**: `photoEditorDemo`
   - **Description**: "A comprehensive Vue.js image editor demo with multi-library adapter architecture"
   - **Visibility**: 选择 Public 或 Private
   - **不要**初始化 README、.gitignore 或 license（我们已经有了）
6. 点击 "Create repository"

### 5. 连接本地仓库到 GitHub

```bash
# 添加 GitHub 仓库作为远程仓库
git remote add origin https://github.com/YourUsername/photoEditorDemo.git

# 推送到 GitHub
git push -u origin main
```

如果您的默认分支名是 `master`：

```bash
git push -u origin master
```

## 🌐 GitHub Pages 部署

### 方法一：手动部署

1. **配置 Vue.js 项目**

创建或更新 `vue.config.js`：

```javascript
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/photoEditorDemo/'  // 替换为您的仓库名
    : '/',
  outputDir: 'dist'
}
```

2. **构建和部署脚本**

创建 `deploy.sh` 文件：

```bash
#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 构建
npm run build

# 进入生成的文件夹
cd dist

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:YourUsername/photoEditorDemo.git master:gh-pages

cd -
```

3. **执行部署**

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 方法二：GitHub Actions 自动部署

1. **创建工作流文件**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. **启用 GitHub Pages**

- 进入仓库的 Settings 页面
- 滚动到 "Pages" 部分
- 在 "Source" 下选择 "Deploy from a branch"
- 选择 `gh-pages` 分支
- 点击 "Save"

## ⚙️ 仓库配置优化

### 1. 添加仓库主题和描述

在仓库主页：
- 点击设置图标（齿轮）
- 添加 Topics: `vue`, `image-editor`, `canvas`, `graphics`, `konva`, `fabric`
- 更新描述
- 添加网站链接（如果部署了 GitHub Pages）

### 2. 配置 .gitignore

确保 `.gitignore` 文件包含：

```gitignore
# 依赖
node_modules/

# 构建输出
dist/
build/

# 环境变量
.env.local
.env.*.local

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 编辑器
.vscode/
.idea/

# 操作系统
.DS_Store
Thumbs.db
```

### 3. 设置分支保护规则

在仓库 Settings > Branches：
- 添加规则保护 `main` 分支
- 要求 PR 审查
- 要求状态检查通过

## 🔄 持续集成/持续部署

### 1. 代码质量检查

添加到 GitHub Actions：

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint
    
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    - run: npm ci
    - run: npm run test:unit
```

### 2. 自动版本管理

使用语义化版本：

```bash
# 安装语义化版本工具
npm install --save-dev semantic-release

# 配置 package.json
{
  "scripts": {
    "semantic-release": "semantic-release"
  }
}
```

## 🔧 故障排除

### 认证问题

如果遇到认证问题：

```bash
# 使用 GitHub CLI
gh auth login

# 或设置 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"
# 然后将公钥添加到 GitHub
```

### 大文件问题

如果有超过 GitHub 文件大小限制的大文件：

```bash
# 安装 Git LFS
git lfs install

# 跟踪大文件
git lfs track "*.psd" "*.ai" "*.sketch"
git add .gitattributes
```

### 合并冲突

如果遇到合并冲突：

```bash
# 拉取最新更改
git pull origin main

# 手动解决冲突
# 然后提交解决后的更改
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

## 📊 仓库维护

### 定期更新

```bash
# 更新依赖
npm update

# 检查安全漏洞
npm audit

# 修复安全问题
npm audit fix
```

### 发布管理

```bash
# 创建发布标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 在 GitHub 上创建 Release
# 访问仓库的 Releases 页面，点击 "Create a new release"
```

## 📞 获取帮助

### 官方资源

- [GitHub 文档](https://docs.github.com/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

### 社区支持

- GitHub Community Forum
- Stack Overflow
- 项目 Issues 页面

---

*设置完成后，查看 [生产环境构建指南](production-build.md) 了解更多部署选项。*
