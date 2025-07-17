/**
 * ErrorNotification 单元测试
 */
import { shallowMount, mount } from "@vue/test-utils";
import ErrorNotification from "@/components/ui/ErrorNotification.vue";
import { errorHandler } from "@/utils/ErrorHandler.js";

// Mock errorHandler
jest.mock("@/utils/ErrorHandler.js", () => ({
  errorHandler: {
    // 用户通知相关方法
    onUserNotification: jest.fn(),
    offUserNotification: jest.fn(),

    // 用户指导相关方法
    onUserGuidance: jest.fn(),
    onContextualHelp: jest.fn(),

    // 错误恢复相关方法
    onErrorRecovery: jest.fn(),

    // 故障排除相关方法
    onTroubleshootingStep: jest.fn(),

    // 获取信息的方法
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
        { step: "刷新页面", description: "重新加载页面", action: "refresh" },
      ],
    })),
    getErrorStats: jest.fn(() => ({
      total: 5,
      recent: 2,
      byType: { network: 2, file: 1, ui: 2 },
      byLevel: { medium: 3, high: 2 },
    })),
    getUserFriendlyMessage: jest.fn(() => ({
      title: "网络错误",
      message: "网络连接超时",
      icon: "🌐",
      severity: "medium",
    })),

    // 触发方法
    triggerUserGuidance: jest.fn(),
    triggerContextualHelp: jest.fn(),

    // 错误处理方法
    handleError: jest.fn(),

    // 错误类型和级别常量
    errorTypes: {
      NETWORK: "network",
      VALIDATION: "validation",
      ADAPTER: "adapter",
      MEMORY: "memory",
      FILE: "file",
      PERMISSION: "permission",
      UI: "ui",
      STATE: "state",
      UNKNOWN: "unknown",
    },
    errorLevels: {
      LOW: "low",
      MEDIUM: "medium",
      HIGH: "high",
      CRITICAL: "critical",
    },
  },
}));

describe("ErrorNotification", () => {
  let wrapper;

  beforeEach(() => {
    // 使用mount而不是shallowMount来确保完整渲染
    wrapper = mount(ErrorNotification, {
      stubs: {
        // 如果有子组件需要stub，在这里添加
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.destroy();
    }
  });

  describe("基本功能", () => {
    test("应该正确渲染组件", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();

      // 检查组件基本属性
      expect(wrapper.vm.notifications).toEqual([]);
      expect(wrapper.vm.maxNotifications).toBe(5);
      expect(wrapper.vm.showStats).toBe(false);
    });

    test("应该正确处理错误通知", () => {
      const notification = {
        type: "network",
        level: "medium",
        message: "网络连接超时",
        icon: "🌐",
      };

      wrapper.vm.handleErrorNotification(notification);

      expect(wrapper.vm.notifications.length).toBe(1);
      expect(wrapper.vm.notifications[0].message).toBe("网络连接超时");
      expect(wrapper.vm.notifications[0].icon).toBe("🌐");
    });

    test("应该限制通知数量", () => {
      // 添加超过最大数量的通知
      for (let i = 0; i < 8; i++) {
        wrapper.vm.handleErrorNotification({
          type: "test",
          level: "low",
          message: `Test notification ${i}`,
        });
      }

      expect(wrapper.vm.visibleNotifications.length).toBeLessThanOrEqual(
        wrapper.vm.maxNotifications
      );
    });

    test("应该自动关闭非关键错误", (done) => {
      const notification = {
        type: "network",
        level: "medium",
        message: "Test message",
      };

      wrapper.vm.handleErrorNotification(notification);
      expect(wrapper.vm.notifications.length).toBe(1);

      // 模拟自动关闭
      setTimeout(() => {
        wrapper.vm.dismissNotification(wrapper.vm.notifications[0].id);
        expect(wrapper.vm.notifications.length).toBe(0);
        done();
      }, 100);
    });
  });

  describe("操作指导功能", () => {
    test("应该检查是否有操作指导", () => {
      errorHandler.getOperationGuidance.mockReturnValue({
        title: "文件上传指南",
        steps: ["步骤1", "步骤2"],
        tips: ["提示1"],
      });

      const notification = {
        type: "file",
        context: { operation: "file_upload" },
      };

      const hasGuidance = wrapper.vm.hasOperationGuidance(notification);
      expect(hasGuidance).toBe(true);
      expect(errorHandler.getOperationGuidance).toHaveBeenCalledWith(
        "file_upload"
      );
    });

    test("应该正确推断操作类型", () => {
      // 文件操作
      let notification = { type: "file" };
      expect(wrapper.vm.getOperationType(notification)).toBe("file_upload");

      // UI操作 - 文本工具
      notification = {
        type: "ui",
        context: { component: "TextTool" },
      };
      expect(wrapper.vm.getOperationType(notification)).toBe("text_editing");

      // UI操作 - 画笔工具
      notification = {
        type: "ui",
        context: { component: "BrushTool" },
      };
      expect(wrapper.vm.getOperationType(notification)).toBe("brush_drawing");

      // 适配器操作
      notification = { type: "adapter" };
      expect(wrapper.vm.getOperationType(notification)).toBe(
        "filter_application"
      );
    });

    test("应该显示操作指导", () => {
      const mockGuidance = {
        title: "文本编辑指南",
        steps: ["添加文本", "编辑内容"],
        tips: ["双击编辑"],
      };

      errorHandler.getOperationGuidance.mockReturnValue(mockGuidance);

      const notification = {
        type: "ui",
        context: { component: "TextTool" },
      };

      wrapper.vm.showOperationGuidance(notification);

      expect(wrapper.vm.showGuidance).toBe(true);
      expect(wrapper.vm.currentGuidance).toEqual(mockGuidance);
    });

    test("应该关闭操作指导", () => {
      wrapper.vm.showGuidance = true;
      wrapper.vm.currentGuidance = { title: "Test" };

      wrapper.vm.closeGuidance();

      expect(wrapper.vm.showGuidance).toBe(false);
      expect(wrapper.vm.currentGuidance).toBeNull();
    });
  });

  describe("故障排除功能", () => {
    test("应该检查是否有故障排除步骤", () => {
      errorHandler.getTroubleshootingSteps.mockReturnValue({
        title: "网络问题排除",
        steps: [
          {
            step: "检查连接",
            description: "检查网络",
            action: "check_connection",
          },
        ],
      });

      const notification = { type: "network" };
      const hasSteps = wrapper.vm.hasTroubleshootingSteps(notification);

      expect(hasSteps).toBe(true);
      expect(errorHandler.getTroubleshootingSteps).toHaveBeenCalledWith(
        "network_issues"
      );
    });

    test("应该正确推断问题类型", () => {
      expect(wrapper.vm.getIssueType({ type: "network" })).toBe(
        "network_issues"
      );
      expect(wrapper.vm.getIssueType({ type: "memory" })).toBe(
        "performance_issues"
      );
      expect(wrapper.vm.getIssueType({ type: "adapter" })).toBe(
        "feature_issues"
      );
      expect(wrapper.vm.getIssueType({ type: "ui" })).toBe("feature_issues");
      expect(wrapper.vm.getIssueType({ type: "unknown" })).toBe(
        "feature_issues"
      );
    });

    test("应该显示故障排除步骤", () => {
      const mockTroubleshooting = {
        title: "性能问题排除",
        steps: [
          { step: "关闭标签页", description: "释放内存", action: "close_tabs" },
          {
            step: "清理历史",
            description: "清除记录",
            action: "clear_history",
          },
        ],
      };

      errorHandler.getTroubleshootingSteps.mockReturnValue(mockTroubleshooting);

      const notification = { type: "memory" };
      wrapper.vm.showTroubleshootingSteps(notification);

      expect(wrapper.vm.showTroubleshooting).toBe(true);
      expect(wrapper.vm.currentTroubleshooting).toEqual(mockTroubleshooting);
      expect(wrapper.vm.completedSteps).toEqual([]);
    });

    test("应该切换步骤完成状态", () => {
      wrapper.vm.toggleStepCompletion(0);
      expect(wrapper.vm.completedSteps).toContain(0);

      wrapper.vm.toggleStepCompletion(0);
      expect(wrapper.vm.completedSteps).not.toContain(0);
    });

    test("应该执行故障排除操作", () => {
      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      // Mock window.location.reload
      Object.defineProperty(window, "location", {
        value: { reload: jest.fn() },
        writable: true,
      });

      // 测试刷新页面操作
      wrapper.vm.executeTroubleshootingAction("refresh_page", 0);
      expect(window.location.reload).toHaveBeenCalled();
      expect(wrapper.vm.completedSteps).toContain(0);

      // 测试清除缓存操作
      // Mock localStorage and sessionStorage
      Storage.prototype.clear = jest.fn();

      wrapper.vm.executeTroubleshootingAction("clear_cache", 1);
      expect(localStorage.clear).toHaveBeenCalled();
      expect(sessionStorage.clear).toHaveBeenCalled();
      expect(wrapper.vm.completedSteps).toContain(1);
    });

    test("应该报告故障排除结果", () => {
      wrapper.vm.currentTroubleshooting = {
        steps: [{ step: "test1" }, { step: "test2" }],
      };
      wrapper.vm.completedSteps = [0, 1];

      wrapper.vm.reportTroubleshootingResult();

      expect(wrapper.emitted("troubleshooting-completed")).toBeTruthy();
      expect(wrapper.emitted("troubleshooting-completed")[0][0]).toEqual({
        issueType: "feature_issues",
        completedSteps: [0, 1],
        totalSteps: 2,
        resolved: true,
      });

      expect(wrapper.vm.showTroubleshooting).toBe(false);
    });
  });

  describe("网络连接检查", () => {
    test("应该检查网络连接成功", async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
        })
      );

      await wrapper.vm.checkNetworkConnection();

      expect(fetch).toHaveBeenCalledWith("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });
      expect(wrapper.emitted("info-message")).toBeTruthy();
      expect(wrapper.emitted("info-message")[0][0]).toBe("✅ 网络连接正常");
    });

    test("应该检查网络连接失败", async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error("Network error")));

      await wrapper.vm.checkNetworkConnection();

      expect(wrapper.emitted("error-message")).toBeTruthy();
      expect(wrapper.emitted("error-message")[0][0]).toBe("❌ 网络连接失败");
    });

    test("应该检查网络连接不稳定", async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      );

      await wrapper.vm.checkNetworkConnection();

      expect(wrapper.emitted("warning-message")).toBeTruthy();
      expect(wrapper.emitted("warning-message")[0][0]).toBe(
        "⚠️ 网络连接不稳定"
      );
    });
  });

  describe("错误统计", () => {
    test("应该更新错误统计", () => {
      wrapper.vm.updateErrorStats();

      expect(errorHandler.getErrorStats).toHaveBeenCalled();
      expect(wrapper.vm.errorStats.total).toBe(5);
      expect(wrapper.vm.errorStats.recent).toBe(2);
    });

    test("应该切换统计显示", () => {
      expect(wrapper.vm.showStats).toBe(false);

      wrapper.vm.toggleStats();
      expect(wrapper.vm.showStats).toBe(true);
      expect(errorHandler.getErrorStats).toHaveBeenCalled();

      wrapper.vm.toggleStats();
      expect(wrapper.vm.showStats).toBe(false);
    });
  });

  describe("通知管理", () => {
    test("应该关闭通知", () => {
      wrapper.vm.handleErrorNotification({
        type: "test",
        level: "low",
        message: "Test",
      });

      const notificationId = wrapper.vm.notifications[0].id;
      wrapper.vm.dismissNotification(notificationId);

      expect(wrapper.vm.notifications.length).toBe(0);
    });

    test("应该清除所有通知", () => {
      // 添加多个通知
      for (let i = 0; i < 3; i++) {
        wrapper.vm.handleErrorNotification({
          type: "test",
          level: "low",
          message: `Test ${i}`,
        });
      }

      expect(wrapper.vm.notifications.length).toBe(3);

      wrapper.vm.clearAllNotifications();
      expect(wrapper.vm.notifications.length).toBe(0);
    });

    test("应该获取正确的通知标题", () => {
      const notification = {
        type: "network",
        level: "high",
        message: "Connection failed",
      };

      const title = wrapper.vm.getNotificationTitle(notification);
      expect(typeof title).toBe("string");
      expect(title.length).toBeGreaterThan(0);
    });
  });
});
