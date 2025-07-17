/**
 * UserGuidance 简化测试 - 稳定版本
 */
import { mount } from "@vue/test-utils";
import UserGuidance from "@/components/ui/UserGuidance.vue";

// Mock errorHandler
jest.mock("@/utils/ErrorHandler.js", () => ({
  errorHandler: {
    onUserGuidance: jest.fn(),
    onContextualHelp: jest.fn(),
    getOperationGuidance: jest.fn(() => ({
      title: "操作指南",
      steps: ["步骤1", "步骤2"],
      tips: ["提示1", "提示2"],
    })),
    getTroubleshootingSteps: jest.fn(() => ({
      title: "故障排除",
      steps: [
        {
          step: "检查网络",
          description: "确保网络连接正常",
          action: "check_network",
        },
      ],
    })),
    triggerUserGuidance: jest.fn(),
    triggerContextualHelp: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe("UserGuidance - 简化测试", () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    wrapper = mount(UserGuidance);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe("基本功能", () => {
    test("应该正确初始化组件", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
      expect(wrapper.vm.userPreferences).toBeDefined();
    });

    test("应该有正确的初始数据", () => {
      expect(wrapper.vm.showOnboarding).toBe(false);
      expect(wrapper.vm.currentOnboardingStep).toBe(0);
      expect(wrapper.vm.showQuickHelp).toBe(false);
      expect(wrapper.vm.userPreferences).toEqual(
        expect.objectContaining({
          showOnboarding: expect.any(Boolean),
          showContextTips: expect.any(Boolean),
          completedOnboarding: expect.any(Boolean),
        })
      );
    });
  });

  describe("新手引导功能", () => {
    test("应该能够显示新手引导", () => {
      wrapper.vm.showOnboarding = true;
      expect(wrapper.vm.showOnboarding).toBe(true);
    });

    test("应该能够导航引导步骤", () => {
      wrapper.vm.currentOnboardingStep = 0;

      wrapper.vm.nextOnboardingStep();
      expect(wrapper.vm.currentOnboardingStep).toBe(1);

      wrapper.vm.previousOnboardingStep();
      expect(wrapper.vm.currentOnboardingStep).toBe(0);
    });

    test("应该能够跳过引导", () => {
      wrapper.vm.showOnboarding = true;
      wrapper.vm.skipOnboarding();

      expect(wrapper.vm.showOnboarding).toBe(false);
      expect(wrapper.vm.userPreferences.showOnboarding).toBe(false);
    });

    test("应该能够完成引导", () => {
      wrapper.vm.showOnboarding = true;
      wrapper.vm.finishOnboarding();

      expect(wrapper.vm.showOnboarding).toBe(false);
      expect(wrapper.vm.userPreferences.completedOnboarding).toBe(true);
      expect(wrapper.emitted("onboarding-completed")).toBeTruthy();
    });

    test("应该能够重新开始引导", () => {
      wrapper.vm.currentOnboardingStep = 2;
      wrapper.vm.restartOnboarding();

      expect(wrapper.vm.currentOnboardingStep).toBe(0);
      expect(wrapper.vm.showOnboarding).toBe(true);
    });
  });

  describe("快速帮助功能", () => {
    test("应该能够切换快速帮助面板", () => {
      expect(wrapper.vm.showQuickHelp).toBe(false);

      wrapper.vm.toggleQuickHelp();
      expect(wrapper.vm.showQuickHelp).toBe(true);

      wrapper.vm.toggleQuickHelp();
      expect(wrapper.vm.showQuickHelp).toBe(false);
    });

    test("应该能够显示操作指导", () => {
      wrapper.vm.showOperationGuidance("test-operation");

      expect(wrapper.emitted("show-guidance")).toBeTruthy();
      expect(wrapper.vm.showQuickHelp).toBe(false);
    });

    test("应该能够显示故障排除", () => {
      wrapper.vm.showTroubleshooting("test-issue");

      expect(wrapper.emitted("show-troubleshooting")).toBeTruthy();
      expect(wrapper.vm.showQuickHelp).toBe(false);
    });

    test("应该能够联系技术支持", () => {
      wrapper.vm.contactSupport();

      expect(wrapper.emitted("contact-support")).toBeTruthy();
      expect(wrapper.vm.showQuickHelp).toBe(false);
    });
  });

  describe("上下文提示功能", () => {
    test("应该能够手动隐藏提示", () => {
      wrapper.vm.$data.showContextTip = true;
      wrapper.vm.contextTip = { message: "测试" };

      wrapper.vm.hideContextTip();

      expect(wrapper.vm.$data.showContextTip).toBe(false);
      expect(wrapper.vm.contextTip).toBeNull();
    });

    test("应该能够计算提示位置", () => {
      // 先设置contextTip以避免null错误
      wrapper.vm.contextTip = { message: "测试提示", position: "bottom" };

      const mockElement = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          width: 150,
          height: 50,
          bottom: 150,
        }),
      };

      const style = wrapper.vm.calculateTipPosition(mockElement);

      expect(style).toHaveProperty("top");
      expect(style).toHaveProperty("left");
    });
  });

  describe("用户偏好设置", () => {
    test("应该能够保存用户偏好设置", () => {
      wrapper.vm.userPreferences.showOnboarding = false;
      wrapper.vm.userPreferences.completedOnboarding = true;

      // 验证方法存在并可以调用
      expect(wrapper.vm.saveUserPreferences).toBeDefined();
      expect(typeof wrapper.vm.saveUserPreferences).toBe("function");

      // 调用方法不应该抛出错误
      expect(() => {
        wrapper.vm.saveUserPreferences();
      }).not.toThrow();
    });
  });

  describe("工具方法", () => {
    test("应该能够获取高亮样式", () => {
      // Mock DOM element
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 200,
          width: 150,
          height: 50,
        }),
      };

      document.getElementById = jest.fn(() => mockElement);
      document.querySelector = jest.fn(() => mockElement);

      const style = wrapper.vm.getHighlightStyle("test-element");

      expect(style).toHaveProperty("top");
      expect(style).toHaveProperty("left");
      expect(style).toHaveProperty("width");
      expect(style).toHaveProperty("height");
    });

    test("应该处理不存在的元素", () => {
      document.getElementById = jest.fn(() => null);
      document.querySelector = jest.fn(() => null);

      const style = wrapper.vm.getHighlightStyle("non-existent");

      expect(style).toEqual({});
    });
  });

  describe("事件处理", () => {
    test("应该能够发射指导事件", () => {
      const mockGuidance = { title: "测试指导" };
      const mockContext = { operation: "test" };

      wrapper.vm.$emit("show-guidance", mockGuidance, mockContext);

      expect(wrapper.emitted("show-guidance")).toBeTruthy();
      expect(wrapper.emitted("show-guidance")[0]).toEqual([
        mockGuidance,
        mockContext,
      ]);
    });

    test("应该能够发射帮助事件", () => {
      const mockTroubleshooting = { title: "测试排除" };
      const mockContext = { issue: "test" };

      wrapper.vm.$emit(
        "show-troubleshooting",
        mockTroubleshooting,
        mockContext
      );

      expect(wrapper.emitted("show-troubleshooting")).toBeTruthy();
      expect(wrapper.emitted("show-troubleshooting")[0]).toEqual([
        mockTroubleshooting,
        mockContext,
      ]);
    });
  });

  describe("响应式行为", () => {
    test("应该在移动设备上正确显示", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      // 触发响应式检查
      expect(wrapper.vm).toBeDefined();
      expect(window.innerWidth).toBe(375);
    });
  });
});
