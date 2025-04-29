module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复bug
        "docs", // 文档更新
        "style", // 代码格式（不影响功能，如空格、分号等格式修正）
        "refactor", // 代码重构（不是新增功能，也不是修改bug的代码变动）
        "perf", // 优化相关，如提升性能、体验
        "test", // 增加测试
        "chore", // 构建过程或辅助工具的变动
        "revert", // 回滚到上一个版本
        "build", // 编译相关的修改，如发布版本、对项目构建或者依赖的改动
      ],
    ],
    "subject-case": [0],
  },
};
