/**
 * TextTool 单元测试
 */
import { shallowMount } from "@vue/test-utils";
import TextTool from "@/components/ui/TextTool.vue";

// Mock 适配器
const mockAdapter = {
  addText: jest.fn().mockResolvedValue("text-id-123"),
  removeText: jest.fn().mockResolvedValue(),
  updateText: jest.fn().mockResolvedValue(),
  removeObject: jest.fn().mockResolvedValue(),
  updateObject: jest.fn().mockResolvedValue(),
};

describe("TextTool", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(TextTool, {
      propsData: {
        adapter: mockAdapter,
        adapterType: "fabric",
      },
    });

    // 重置所有mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe("适配器集成", () => {
    test("应该正确验证适配器prop", () => {
      expect(wrapper.props("adapter")).toBe(mockAdapter);
      expect(wrapper.props("adapterType")).toBe("fabric");
    });

    test("应该在添加文本时调用适配器", async () => {
      await wrapper.vm.handleAddText();

      expect(mockAdapter.addText).toHaveBeenCalledWith(
        "双击编辑文本",
        100,
        100,
        expect.objectContaining({
          fontFamily: expect.any(String),
          fontSize: expect.any(Number),
          fill: expect.any(String),
        })
      );
    });

    test("应该在删除文本时调用适配器", async () => {
      // 先添加文本
      await wrapper.vm.handleAddText();
      const textElement = wrapper.vm.textElements[0];
      wrapper.vm.activeTextId = textElement.id;

      // 删除文本
      await wrapper.vm.handleDeleteText();

      expect(mockAdapter.removeText).toHaveBeenCalledWith("text-id-123");
    });

    test("应该在更新文本样式时调用适配器", async () => {
      // 先添加文本
      await wrapper.vm.handleAddText();
      const textElement = wrapper.vm.textElements[0];
      wrapper.vm.activeTextId = textElement.id;

      // 更新字体
      wrapper.vm.selectedFont = "Arial";
      await wrapper.vm.handleFontChange();

      expect(mockAdapter.updateText).toHaveBeenCalled();
    });

    test("应该在更新文本内容时调用适配器", async () => {
      // 先添加文本
      await wrapper.vm.handleAddText();
      const textElement = wrapper.vm.textElements[0];
      wrapper.vm.editingTextId = textElement.id;
      wrapper.vm.editingContent = "新的文本内容";

      // 完成编辑
      await wrapper.vm.handleTextEditComplete();

      expect(mockAdapter.updateText).toHaveBeenCalled();
    });
  });

  describe("适配器格式转换", () => {
    test("应该正确转换Fabric格式", () => {
      const textData = {
        x: 100,
        y: 200,
        fontFamily: "Arial",
        fontSize: 24,
        color: "#000000",
        rotation: 45,
        scale: 1.5,
        effects: {
          shadow: {
            enabled: true,
            color: "#666666",
            blur: 5,
            offsetX: 2,
            offsetY: 2,
          },
        },
      };

      const result = wrapper.vm._convertToAdapterFormat(textData);

      expect(result).toEqual({
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#000000",
        left: 100,
        top: 200,
        angle: 45,
        scaleX: 1.5,
        scaleY: 1.5,
        shadow: {
          color: "#666666",
          blur: 5,
          offsetX: 2,
          offsetY: 2,
        },
        stroke: null,
        strokeWidth: 0,
      });
    });

    test("应该正确转换Konva格式", async () => {
      await wrapper.setProps({ adapterType: "konva" });

      const textData = {
        x: 100,
        y: 200,
        fontFamily: "Arial",
        fontSize: 24,
        color: "#000000",
        effects: {
          stroke: {
            enabled: true,
            color: "#ff0000",
            width: 2,
          },
        },
      };

      const result = wrapper.vm._convertToAdapterFormat(textData);

      expect(result).toEqual({
        fontFamily: "Arial",
        fontSize: 24,
        fill: "#000000",
        x: 100,
        y: 200,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        shadowColor: null,
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        stroke: "#ff0000",
        strokeWidth: 2,
      });
    });

    test("应该正确转换TUI格式", async () => {
      await wrapper.setProps({ adapterType: "tui" });

      const textData = {
        x: 100,
        y: 200,
        fontFamily: "Arial",
        fontSize: 24,
        color: "#000000",
        effects: {
          shadow: {
            enabled: true,
            color: "#666666",
            blur: 5,
            offsetX: 2,
            offsetY: 2,
          },
        },
      };

      const result = wrapper.vm._convertToAdapterFormat(textData);

      expect(result).toEqual({
        styles: {
          fontFamily: "Arial",
          fontSize: 24,
          fill: "#000000",
          textShadow: "2px 2px 5px #666666",
        },
        position: { x: 100, y: 200 },
      });
    });
  });

  describe("错误处理", () => {
    test("应该处理适配器添加文本失败", async () => {
      mockAdapter.addText.mockRejectedValueOnce(new Error("Add text failed"));

      await wrapper.vm.handleAddText();

      expect(wrapper.emitted("error")).toBeTruthy();
      expect(wrapper.emitted("error")[0][0]).toEqual({
        type: "text-add-failed",
        message: "添加文本失败",
        error: expect.any(Error),
      });
    });

    test("应该处理适配器删除文本失败", async () => {
      // 先添加文本
      await wrapper.vm.handleAddText();
      const textElement = wrapper.vm.textElements[0];
      wrapper.vm.activeTextId = textElement.id;

      mockAdapter.removeText.mockRejectedValueOnce(
        new Error("Remove text failed")
      );

      await wrapper.vm.handleDeleteText();

      expect(wrapper.emitted("error")).toBeTruthy();
      expect(wrapper.emitted("error")[0][0]).toEqual({
        type: "text-delete-failed",
        message: "删除文本失败",
        error: expect.any(Error),
      });
    });

    test("应该处理适配器更新文本失败", async () => {
      // 先添加文本
      await wrapper.vm.handleAddText();
      const textElement = wrapper.vm.textElements[0];
      wrapper.vm.activeTextId = textElement.id;

      mockAdapter.updateText.mockRejectedValueOnce(
        new Error("Update text failed")
      );

      await wrapper.vm.handleFontChange();

      expect(wrapper.emitted("error")).toBeTruthy();
      expect(wrapper.emitted("error")[0][0]).toEqual({
        type: "text-style-update-failed",
        message: "更新字体失败",
        error: expect.any(Error),
      });
    });
  });

  describe("适配器兼容性", () => {
    test("应该处理不支持addText方法的适配器", async () => {
      const incompatibleAdapter = {};
      await wrapper.setProps({ adapter: incompatibleAdapter });

      const result = await wrapper.vm._addTextToAdapter({});

      expect(result).toBeNull();
    });

    test("应该处理不支持removeText方法的适配器", async () => {
      const partialAdapter = {
        addText: jest.fn().mockResolvedValue("text-id"),
        removeObject: jest.fn().mockResolvedValue(),
      };
      await wrapper.setProps({ adapter: partialAdapter });

      await wrapper.vm._removeTextFromAdapter({ adapterId: "text-id" });

      expect(partialAdapter.removeObject).toHaveBeenCalledWith("text-id");
    });

    test("应该处理没有更新方法的适配器", async () => {
      const limitedAdapter = {
        addText: jest.fn().mockResolvedValue("new-text-id"),
        removeText: jest.fn().mockResolvedValue(),
      };
      await wrapper.setProps({ adapter: limitedAdapter });

      const textData = { adapterId: "old-text-id" };
      await wrapper.vm._updateTextInAdapter(textData);

      expect(limitedAdapter.removeText).toHaveBeenCalledWith("old-text-id");
      expect(limitedAdapter.addText).toHaveBeenCalled();
      expect(textData.adapterId).toBe("new-text-id");
    });
  });
});
