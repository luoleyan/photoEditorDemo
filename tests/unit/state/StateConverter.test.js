/**
 * StateConverter 单元测试
 */
import StateConverter from '@/components/state/StateConverter.js';

describe('StateConverter', () => {
  let converter;

  beforeEach(() => {
    converter = new StateConverter();
  });

  describe('初始化', () => {
    test('应该正确初始化转换器', () => {
      expect(converter).toBeDefined();
      expect(converter.conversionRules).toBeDefined();
      expect(converter.conversionRules.size).toBeGreaterThan(0);
    });

    test('应该包含所有必要的转换规则', () => {
      const expectedRules = [
        'fabric_to_konva',
        'fabric_to_tui',
        'fabric_to_jimp',
        'fabric_to_cropper',
        'konva_to_fabric',
        'konva_to_tui',
        'konva_to_jimp',
        'konva_to_cropper'
      ];

      expectedRules.forEach(rule => {
        expect(converter.conversionRules.has(rule)).toBe(true);
      });
    });
  });

  describe('转换支持检查', () => {
    test('应该正确检查转换支持', () => {
      expect(converter.isConversionSupported('fabric', 'konva')).toBe(true);
      expect(converter.isConversionSupported('konva', 'fabric')).toBe(true);
      expect(converter.isConversionSupported('unknown', 'fabric')).toBe(false);
      expect(converter.isConversionSupported('fabric', 'unknown')).toBe(false);
    });

    test('应该返回支持的目标类型', () => {
      const targets = converter.getSupportedTargets('fabric');
      
      expect(targets).toContain('konva');
      expect(targets).toContain('tui');
      expect(targets).toContain('jimp');
      expect(targets).toContain('cropper');
      expect(targets).not.toContain('fabric');
    });

    test('应该处理未知源类型', () => {
      const targets = converter.getSupportedTargets('unknown');
      expect(targets).toEqual([]);
    });
  });

  describe('Fabric到Konva转换', () => {
    test('应该正确转换基本状态', () => {
      const fabricState = {
        id: 'state1',
        libraryType: 'fabric',
        imageData: { src: 'test.jpg' },
        objects: []
      };

      const konvaState = converter.convertState(fabricState, 'konva');

      expect(konvaState.libraryType).toBe('konva');
      expect(konvaState.imageData.src).toBe('test.jpg');
      expect(konvaState.id).toBe('state1');
    });

    test('应该正确转换对象位置属性', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: [{
          id: 'obj1',
          type: 'text',
          left: 100,
          top: 200,
          angle: 45,
          text: 'Hello'
        }]
      };

      const konvaState = converter.convertState(fabricState, 'konva');
      const convertedObj = konvaState.objects[0];

      expect(convertedObj.x).toBe(100);
      expect(convertedObj.y).toBe(200);
      expect(convertedObj.rotation).toBe(45);
      expect(convertedObj.left).toBeUndefined();
      expect(convertedObj.top).toBeUndefined();
      expect(convertedObj.angle).toBeUndefined();
    });

    test('应该保留其他属性', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: [{
          id: 'obj1',
          type: 'text',
          text: 'Hello',
          fill: '#ff0000',
          fontSize: 24
        }]
      };

      const konvaState = converter.convertState(fabricState, 'konva');
      const convertedObj = konvaState.objects[0];

      expect(convertedObj.id).toBe('obj1');
      expect(convertedObj.type).toBe('text');
      expect(convertedObj.text).toBe('Hello');
      expect(convertedObj.fill).toBe('#ff0000');
      expect(convertedObj.fontSize).toBe(24);
    });
  });

  describe('Fabric到TUI转换', () => {
    test('应该正确转换为TUI格式', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: [{
          id: 'text1',
          type: 'text',
          left: 150,
          top: 250,
          text: 'TUI Text',
          fill: '#0000ff',
          fontSize: 18,
          fontFamily: 'Arial'
        }]
      };

      const tuiState = converter.convertState(fabricState, 'tui');
      const convertedObj = tuiState.objects[0];

      expect(tuiState.libraryType).toBe('tui');
      expect(convertedObj.position).toEqual({ x: 150, y: 250 });
      expect(convertedObj.styles).toEqual({
        fill: '#0000ff',
        fontSize: 18,
        fontFamily: 'Arial'
      });
    });

    test('应该处理缺失的位置属性', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: [{
          id: 'text1',
          type: 'text',
          text: 'No Position'
        }]
      };

      const tuiState = converter.convertState(fabricState, 'tui');
      const convertedObj = tuiState.objects[0];

      expect(convertedObj.position).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Fabric到Jimp转换', () => {
    test('应该过滤不支持的对象类型', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: [
          { id: 'text1', type: 'text' },
          { id: 'img1', type: 'image' },
          { id: 'path1', type: 'path' }, // 不支持
          { id: 'shape1', type: 'shape' } // 不支持
        ]
      };

      const jimpState = converter.convertState(fabricState, 'jimp');

      expect(jimpState.libraryType).toBe('jimp');
      expect(jimpState.objects).toHaveLength(2);
      expect(jimpState.objects[0].type).toBe('text');
      expect(jimpState.objects[1].type).toBe('image');
    });
  });

  describe('Fabric到Cropper转换', () => {
    test('应该正确转换裁剪数据', () => {
      const fabricState = {
        libraryType: 'fabric',
        transform: {
          cropData: { x: 10, y: 20, width: 300, height: 400 },
          rotation: 90,
          scale: { x: 1.5, y: 1.2 }
        },
        objects: [
          { id: 'obj1', type: 'text' }
        ]
      };

      const cropperState = converter.convertState(fabricState, 'cropper');

      expect(cropperState.libraryType).toBe('cropper');
      expect(cropperState.cropperData).toEqual({
        x: 10,
        y: 20,
        width: 300,
        height: 400,
        rotate: 90,
        scaleX: 1.5,
        scaleY: 1.2
      });
      expect(cropperState.objects).toEqual([]); // 应该清空对象
    });

    test('应该处理缺失的变换数据', () => {
      const fabricState = {
        libraryType: 'fabric',
        objects: []
      };

      const cropperState = converter.convertState(fabricState, 'cropper');

      expect(cropperState.libraryType).toBe('cropper');
      expect(cropperState.cropperData).toBeUndefined();
      expect(cropperState.objects).toEqual([]);
    });
  });

  describe('Konva到Fabric转换', () => {
    test('应该正确转换位置属性', () => {
      const konvaState = {
        libraryType: 'konva',
        objects: [{
          id: 'obj1',
          type: 'text',
          x: 300,
          y: 400,
          rotation: 30,
          text: 'Konva Text'
        }]
      };

      const fabricState = converter.convertState(konvaState, 'fabric');
      const convertedObj = fabricState.objects[0];

      expect(fabricState.libraryType).toBe('fabric');
      expect(convertedObj.left).toBe(300);
      expect(convertedObj.top).toBe(400);
      expect(convertedObj.angle).toBe(30);
      expect(convertedObj.x).toBeUndefined();
      expect(convertedObj.y).toBeUndefined();
      expect(convertedObj.rotation).toBeUndefined();
    });
  });

  describe('批量转换', () => {
    test('应该正确批量转换状态', () => {
      const states = [
        { id: 'state1', libraryType: 'fabric', objects: [] },
        { id: 'state2', libraryType: 'fabric', objects: [] },
        { id: 'state3', libraryType: 'fabric', objects: [] }
      ];

      const convertedStates = converter.batchConvertStates(states, 'konva');

      expect(convertedStates).toHaveLength(3);
      convertedStates.forEach(state => {
        expect(state.libraryType).toBe('konva');
      });
    });

    test('应该处理转换失败的状态', () => {
      const states = [
        { id: 'state1', libraryType: 'fabric', objects: [] },
        { id: 'state2', libraryType: 'unknown', objects: [] }, // 会失败
        { id: 'state3', libraryType: 'fabric', objects: [] }
      ];

      const convertedStates = converter.batchConvertStates(states, 'konva');

      expect(convertedStates).toHaveLength(2); // 只有2个成功
      convertedStates.forEach(state => {
        expect(state.libraryType).toBe('konva');
      });
    });
  });

  describe('错误处理', () => {
    test('应该在不支持的转换时抛出错误', () => {
      const state = { libraryType: 'unknown' };

      expect(() => {
        converter.convertState(state, 'fabric');
      }).toThrow('No conversion rule found for unknown_to_fabric');
    });

    test('应该在缺少libraryType时使用unknown', () => {
      const state = { id: 'state1' }; // 没有libraryType

      expect(() => {
        converter.convertState(state, 'fabric');
      }).toThrow('No conversion rule found for unknown_to_fabric');
    });
  });
});
