# PhotoEditor Demo

A comprehensive Vue.js image editor demonstration showcasing professional image editing components with multi-library adapter architecture.

## 📚 文档导航

本项目的文档已重新组织，请访问 **[文档中心](docs/README.md)** 获取完整的文档导航。

### 🚀 快速链接

- **[快速开始](docs/user-guide/getting-started.md)** - 安装和基本使用
- **[使用指南](docs/user-guide/usage-guide.md)** - 详细功能说明
- **[开发者指南](docs/developer-guide/README.md)** - 技术文档和API参考
- **[部署指南](docs/deployment/README.md)** - 项目部署相关
- **[故障排除](docs/troubleshooting/README.md)** - 问题解决方案

## 🌟 Features

### Core Architecture
- **Multi-Library Adapter System**: Seamlessly integrates Konva.js, Fabric.js, and TUI Image Editor
- **Unified API Layer**: Consistent interface across different rendering engines
- **Performance Optimization**: Automatic library selection based on operation type
- **Modular Design**: Pluggable components for maximum flexibility

### High Priority Components
- **ImagePreview**: Advanced image viewing with zoom, pan, thumbnail navigation, and comparison mode
- **HistoryPanel**: Visual undo/redo system with operation thumbnails and search functionality
- **FilterPanel**: Real-time filter preview with presets and custom combinations

### Medium Priority Components
- **LayerPanel**: Complete layer management with drag-and-drop reordering, blend modes, and opacity control
- **CropTool**: Flexible cropping with aspect ratio constraints, grid lines, and reference guides
- **TextTool**: Rich text editing with fonts, styles, effects, and transformations

### Low Priority Components
- **ShapeTool**: Vector shape creation with properties, transformations, and grouping operations
- **BrushTool**: Advanced painting system with multiple brush types, pressure sensitivity, and blend modes
- **ExportPanel**: Multi-format export with quality settings, batch processing, and preview

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/LuoLeYan/photoEditorDemo.git
cd photoEditorDemo

# Install dependencies
npm install

# Start development server
npm run serve
```

### Build for Production
```bash
npm run build
```

## 📖 Usage

### Basic Setup
```javascript
import { ImageAdapter } from '@/adapters/ImageAdapter'
import ImagePreview from '@/components/ui/ImagePreview.vue'

// Initialize adapter
const adapter = new ImageAdapter('konva') // or 'fabric', 'tui'

// Use in component
export default {
  components: { ImagePreview },
  data() {
    return {
      imageAdapter: adapter,
      imageSrc: 'path/to/image.jpg'
    }
  }
}
```

### Component Examples

#### Image Preview with Zoom and Pan
```vue
<template>
  <image-preview
    :image-src="imageSrc"
    :zoom-enabled="true"
    :pan-enabled="true"
    :show-thumbnail="true"
    @zoom-change="handleZoomChange"
    @pan-change="handlePanChange"
  />
</template>
```

#### Layer Management
```vue
<template>
  <layer-panel
    :layers="layers"
    :selected-layer-ids="selectedLayers"
    @layer-select="handleLayerSelect"
    @layer-visibility-change="handleVisibilityChange"
    @layers-reorder="handleReorder"
  />
</template>
```

#### Advanced Cropping
```vue
<template>
  <crop-tool
    :image-src="imageSrc"
    :aspect-ratio="16/9"
    :show-grid="true"
    :show-guides="true"
    @crop-change="handleCropChange"
    @apply="handleCropApply"
  />
</template>
```

## 🏗️ Architecture

### Adapter Pattern Implementation
```
┌─────────────────────────────────────────┐
│              UI Components              │
├─────────────────────────────────────────┤
│            Unified API Layer            │
├─────────────────────────────────────────┤
│              Adapter System             │
├─────────┬─────────────┬─────────────────┤
│ Konva.js│  Fabric.js  │ TUI Image Editor│
│ Adapter │   Adapter   │     Adapter     │
└─────────┴─────────────┴─────────────────┘
```

### Component Hierarchy
- **Core Components**: Essential editing functionality
- **UI Components**: User interface elements
- **Adapters**: Library-specific implementations
- **Utils**: Helper functions and utilities

## 📱 Demo Pages

Visit the following routes to explore different component categories:

- `/basic-components` - Basic UI components and adapters
- `/advanced-components` - High-priority editing features
- `/mid-priority-components` - Layer, crop, and text tools
- `/low-priority-components` - Shape, brush, and export tools

## 🛠️ Development

### Project Structure
```
src/
├── adapters/           # Library adapters
│   ├── ImageAdapter.js
│   ├── KonvaAdapter.js
│   ├── FabricAdapter.js
│   └── TUIAdapter.js
├── components/
│   └── ui/            # UI components
├── views/             # Demo pages
├── utils/             # Utilities
└── router/            # Vue Router config
```

### Adding New Components
1. Create component in `src/components/ui/`
2. Follow Vue 2 syntax and naming conventions
3. Implement adapter integration
4. Add to appropriate demo page
5. Update documentation

### Adapter Integration
```javascript
// Example adapter method
async processImage(operation, params) {
  switch(this.library) {
    case 'konva':
      return this.konvaAdapter.process(operation, params)
    case 'fabric':
      return this.fabricAdapter.process(operation, params)
    case 'tui':
      return this.tuiAdapter.process(operation, params)
  }
}
```

## 🎨 Customization

### Themes
Components support multiple themes:
- `default`: Standard appearance
- `minimal`: Clean, minimal design
- `compact`: Space-efficient layout

### Styling
```vue
<template>
  <image-preview
    variant="minimal"
    :theme="currentTheme"
    :custom-styles="customStyles"
  />
</template>
```

## 📋 API Reference

### ImageAdapter
- `setLibrary(library)`: Switch rendering library
- `loadImage(src)`: Load image for editing
- `applyFilter(filter, params)`: Apply image filter
- `exportImage(format, quality)`: Export processed image

### Component Props
Each component accepts:
- `variant`: Visual style variant
- `disabled`: Disable component
- `theme`: Color theme
- `customStyles`: Custom CSS properties

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**LuoLeYan**
- GitHub: [@LuoLeYan](https://github.com/LuoLeYan)

## 🙏 Acknowledgments

- [Konva.js](https://konvajs.org/) - 2D canvas library
- [Fabric.js](http://fabricjs.com/) - Interactive canvas library
- [TUI Image Editor](https://ui.toast.com/tui-image-editor) - Full-featured image editor
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework

## 📊 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔧 Configuration

See [Vue CLI Configuration Reference](https://cli.vuejs.org/config/) for build customization.

---

## 📖 完整文档

本 README 提供了项目的基本概览。要获取完整的文档，请访问：

### 📚 [文档中心](docs/README.md)
完整的文档导航和索引，包含所有详细信息。

### 👥 用户文档
- **[快速开始](docs/user-guide/getting-started.md)** - 项目安装和基本使用
- **[使用指南](docs/user-guide/usage-guide.md)** - 详细的功能使用说明
- **[浏览器兼容性](docs/user-guide/browser-compatibility.md)** - 支持的浏览器和版本

### 👨‍💻 开发者文档
- **[开发者指南](docs/developer-guide/README.md)** - 完整的开发者文档
- **[架构设计](docs/developer-guide/architecture/README.md)** - 项目架构和设计理念
- **[API参考](docs/developer-guide/api-reference/README.md)** - 详细的API文档

### 🚀 部署文档
- **[部署指南](docs/deployment/README.md)** - 项目部署相关文档
- **[GitHub设置](docs/deployment/github-setup.md)** - GitHub仓库设置和发布

### 🔧 故障排除
- **[故障排除](docs/troubleshooting/README.md)** - 问题解决和优化指南
- **[修复记录](docs/troubleshooting/bug-fixes/README.md)** - 历史问题修复记录

> 💡 **提示**: 如果您是第一次使用，建议从 [快速开始](docs/user-guide/getting-started.md) 开始。
