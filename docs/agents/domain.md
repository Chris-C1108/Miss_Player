# 领域文档规范 (Domain Docs)

工程技能在探索和理解代码库时，如何读取与遵循本仓库的领域文档。

## 探索代码前必读

- 仓库根目录下的 **`CONTEXT.md`**，或
- 根目录下的 **`CONTEXT-MAP.md`**（若存在）：该文件指向每个子上下文对应的 `CONTEXT.md`。探索时请阅读与当前主题相关的上下文文档。
- **`docs/adr/`**：阅读涉及当前工作区域的架构决策记录（ADR）。在多上下文仓库中，还会检查 `src/<context>/docs/adr/` 获取特定上下文的决策。

如果上述任何文件不存在，**请静默继续处理**。无需报告文件缺失，也不要提前要求创建。当术语或架构决策实际确定时，`/domain-modeling` 技能（通过 `/grill-with-docs` 或 `/improve-codebase-architecture` 触发）会按需创建它们。

## 目录结构

单上下文仓库（Single-context，绝大多数项目）：

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（Multi-context，根目录存在 `CONTEXT-MAP.md`）：

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统全局架构决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 模块专有架构决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表中的专业词汇

当输出中提及业务/领域概念时（在 Issue 标题、重构建议、假设、测试用例名称中），请严格使用 `CONTEXT.md` 中定义的词汇。不要随意使用术语表明确避免的同义词。

如果所需的词汇尚未在术语表中定义，这代表一个信号：要么当前正在创造项目未使用的词汇（需要审视），要么确实存在术语空缺（记录下来以便后续通过 `/domain-modeling` 补充）。

## 标明 ADR 冲突

如果输出方案与既有 ADR 产生冲突，必须明确指出而不是静默覆盖：

> _与 ADR-0007（event-sourced orders）冲突，但建议重新评估，因为……_
