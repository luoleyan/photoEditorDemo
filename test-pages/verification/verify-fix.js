/**
 * BrushTool修复验证脚本
 * 用于验证adapter属性修复是否成功
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 开始验证BrushTool修复...\n");

// 验证文件路径
const filesToCheck = [
  {
    path: "src/views/LowPriorityComponentsDemo.vue",
    description: "LowPriorityComponentsDemo组件",
  },
];

// 验证项
const verificationChecks = [
  {
    name: "导入AdapterFactory",
    pattern:
      /import\s+AdapterFactory\s+from\s+['"]@\/components\/adapters\/AdapterFactory\.js['"];?/,
    required: true,
  },
  {
    name: "brushAdapter数据属性",
    pattern: /brushAdapter:\s*null/,
    required: true,
  },
  {
    name: "brushAdapterType数据属性",
    pattern: /brushAdapterType:\s*['"]fabric['"],?/,
    required: true,
  },
  {
    name: "brushAdapterInitialized数据属性",
    pattern: /brushAdapterInitialized:\s*false/,
    required: true,
  },
  {
    name: "integratedBrushAdapter数据属性",
    pattern: /integratedBrushAdapter:\s*null/,
    required: true,
  },
  {
    name: "integratedBrushAdapterInitialized数据属性",
    pattern: /integratedBrushAdapterInitialized:\s*false/,
    required: true,
  },
  {
    name: "createMockAdapter方法",
    pattern: /createMockAdapter\(\)\s*{/,
    required: true,
  },
  {
    name: "initializeAdapters方法",
    pattern: /async\s+initializeAdapters\(\)\s*{/,
    required: true,
  },
  {
    name: "BrushTool组件条件渲染",
    pattern: /v-if="brushAdapterInitialized && brushAdapter"/,
    required: true,
  },
  {
    name: "BrushTool组件adapter属性传递",
    pattern: /:adapter="brushAdapter"/,
    required: true,
  },
  {
    name: "BrushTool组件adapter-type属性传递",
    pattern: /:adapter-type="brushAdapterType"/,
    required: true,
  },
  {
    name: "集成BrushTool组件条件渲染",
    pattern:
      /v-else-if="integratedMode === 'brush' && integratedBrushAdapterInitialized && integratedBrushAdapter"/,
    required: true,
  },
  {
    name: "集成BrushTool组件adapter属性传递",
    pattern: /:adapter="integratedBrushAdapter"/,
    required: true,
  },
  {
    name: "beforeDestroy生命周期",
    pattern: /beforeDestroy\(\)\s*{/,
    required: true,
  },
  {
    name: "适配器加载状态样式",
    pattern: /\.adapter-loading\s*{/,
    required: true,
  },
];

let allChecksPass = true;
let totalChecks = 0;
let passedChecks = 0;

// 检查每个文件
filesToCheck.forEach((fileInfo) => {
  console.log(`📁 检查文件: ${fileInfo.description}`);
  console.log(`   路径: ${fileInfo.path}`);

  try {
    const content = fs.readFileSync(fileInfo.path, "utf8");

    verificationChecks.forEach((check) => {
      totalChecks++;
      const found = check.pattern.test(content);

      if (found) {
        console.log(`   ✅ ${check.name}`);
        passedChecks++;
      } else {
        console.log(`   ❌ ${check.name}`);
        if (check.required) {
          allChecksPass = false;
        }
      }
    });
  } catch (error) {
    console.log(`   ❌ 无法读取文件: ${error.message}`);
    allChecksPass = false;
  }

  console.log("");
});

// 输出总结
console.log("📊 验证结果总结:");
console.log(`   总检查项: ${totalChecks}`);
console.log(`   通过检查: ${passedChecks}`);
console.log(`   通过率: ${Math.round((passedChecks / totalChecks) * 100)}%`);
console.log("");

if (allChecksPass && passedChecks === totalChecks) {
  console.log("🎉 所有验证检查都通过！");
  console.log("✅ BrushTool组件的adapter属性修复成功");
  console.log("");
  console.log("🧪 建议测试步骤:");
  console.log("1. 访问 http://localhost:8081/");
  console.log('2. 点击"低优先级功能组件演示"');
  console.log('3. 检查控制台无"Missing required prop"警告');
  console.log("4. 验证BrushTool组件正常工作");
  console.log('5. 测试集成演示中的"自由绘制"模式');

  process.exit(0);
} else {
  console.log("❌ 部分验证检查未通过");
  console.log("🔧 请检查修复是否完整");

  process.exit(1);
}
