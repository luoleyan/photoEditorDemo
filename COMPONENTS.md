# Components Documentation

This document provides detailed information about all components in the PhotoEditor Demo project.

## Architecture Overview

The project follows a modular architecture with three main layers:

1. **UI Components Layer**: Vue.js components for user interface
2. **Unified API Layer**: Consistent interface across different libraries
3. **Adapter Layer**: Library-specific implementations (Konva.js, Fabric.js, TUI Image Editor)

## Component Categories

### High Priority Components

#### ImagePreview
Advanced image viewing component with comprehensive navigation and comparison features.

**Props:**
- `imageSrc` (String): Source image URL
- `zoomEnabled` (Boolean): Enable zoom functionality
- `panEnabled` (Boolean): Enable pan functionality
- `showThumbnail` (Boolean): Show thumbnail navigation
- `comparisonMode` (Boolean): Enable before/after comparison

**Events:**
- `zoom-change`: Emitted when zoom level changes
- `pan-change`: Emitted when pan position changes
- `image-load`: Emitted when image loads successfully

**Usage:**
```vue
<image-preview
  :image-src="imageSrc"
  :zoom-enabled="true"
  :show-thumbnail="true"
  @zoom-change="handleZoomChange"
/>
```

#### HistoryPanel
Visual undo/redo system with operation thumbnails and search functionality.

**Props:**
- `history` (Array): Array of history operations
- `currentIndex` (Number): Current position in history
- `maxHistorySize` (Number): Maximum number of history items
- `showThumbnails` (Boolean): Show operation thumbnails

**Events:**
- `undo`: Emitted when undo is requested
- `redo`: Emitted when redo is requested
- `goto`: Emitted when jumping to specific history point

#### FilterPanel
Real-time filter preview with presets and custom combinations.

**Props:**
- `filters` (Array): Available filters
- `presets` (Array): Filter presets
- `realTimePreview` (Boolean): Enable real-time preview
- `allowCustom` (Boolean): Allow custom filter combinations

**Events:**
- `filter-apply`: Emitted when filter is applied
- `filter-preview`: Emitted during preview
- `preset-select`: Emitted when preset is selected

### Medium Priority Components

#### LayerPanel
Complete layer management with drag-and-drop reordering and blend modes.

**Props:**
- `layers` (Array): Array of layer objects
- `selectedLayerIds` (Array): Currently selected layer IDs
- `allowReorder` (Boolean): Enable drag-and-drop reordering
- `showBlendModes` (Boolean): Show blend mode options

**Events:**
- `layer-select`: Emitted when layer is selected
- `layer-visibility-change`: Emitted when visibility changes
- `layers-reorder`: Emitted when layers are reordered
- `layer-delete`: Emitted when layer is deleted

#### CropTool
Flexible cropping with aspect ratio constraints and guide lines.

**Props:**
- `imageSrc` (String): Source image URL
- `aspectRatio` (Number): Fixed aspect ratio (optional)
- `showGrid` (Boolean): Show grid lines
- `showGuides` (Boolean): Show guide lines
- `minSize` (Object): Minimum crop size

**Events:**
- `crop-change`: Emitted when crop area changes
- `crop-apply`: Emitted when crop is applied
- `crop-cancel`: Emitted when crop is cancelled

#### TextTool
Rich text editing with fonts, styles, and effects.

**Props:**
- `textElements` (Array): Array of text elements
- `fonts` (Array): Available fonts
- `allowEffects` (Boolean): Enable text effects
- `backgroundImage` (String): Background image URL

**Events:**
- `text-add`: Emitted when text is added
- `text-edit`: Emitted when text is edited
- `text-delete`: Emitted when text is deleted
- `text-style-change`: Emitted when text style changes

### Low Priority Components

#### ShapeTool
Vector shape creation with properties and transformations.

**Props:**
- `shapes` (Array): Array of shape objects
- `selectedShapeType` (String): Currently selected shape type
- `allowGrouping` (Boolean): Enable shape grouping
- `showGrid` (Boolean): Show alignment grid

**Events:**
- `shape-add`: Emitted when shape is added
- `shape-select`: Emitted when shape is selected
- `shapes-group`: Emitted when shapes are grouped
- `shapes-align`: Emitted when shapes are aligned

#### BrushTool
Advanced painting system with multiple brush types and pressure sensitivity.

**Props:**
- `brushTypes` (Array): Available brush types
- `pressureSensitive` (Boolean): Enable pressure sensitivity
- `smoothing` (Number): Brush smoothing level
- `backgroundImage` (String): Background image URL

**Events:**
- `stroke-start`: Emitted when stroke starts
- `stroke-end`: Emitted when stroke ends
- `brush-change`: Emitted when brush settings change

#### ExportPanel
Multi-format export with quality settings and batch processing.

**Props:**
- `formats` (Array): Available export formats
- `qualitySettings` (Object): Quality configuration
- `batchMode` (Boolean): Enable batch export
- `sourceCanvas` (HTMLCanvasElement): Source canvas element

**Events:**
- `export-start`: Emitted when export starts
- `export-complete`: Emitted when export completes
- `export-error`: Emitted when export fails

## Common Props

All components support these common props:

- `variant` (String): Visual style variant ('default', 'minimal', 'compact')
- `disabled` (Boolean): Disable component interaction
- `theme` (String): Color theme ('light', 'dark')
- `customStyles` (Object): Custom CSS properties

## Styling

Components use CSS custom properties for theming:

```css
.component {
  --primary-color: #1890ff;
  --background-color: #ffffff;
  --text-color: #333333;
  --border-color: #d9d9d9;
}
```

## Adapter Integration

Components integrate with the adapter system through events:

```javascript
// Example adapter integration
methods: {
  handleFilterApply(filter) {
    this.imageAdapter.applyFilter(filter.type, filter.params);
  },
  
  handleCropApply(cropData) {
    this.imageAdapter.cropImage(cropData);
  }
}
```

## Performance Considerations

- Components use lazy loading for heavy operations
- Image processing is performed in web workers when possible
- Canvas operations are optimized for smooth interaction
- Memory management includes proper cleanup of resources

## Browser Compatibility

All components are tested and compatible with:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Testing

Components include comprehensive test suites:
- Unit tests for component logic
- Integration tests for adapter communication
- Visual regression tests for UI consistency
- Performance tests for heavy operations
