# 任务追踪器：本地 Markdown (Local Markdown)

本仓库的 Issue 任务与规格说明（Spec）以 Markdown 文件形式存储在 `.scratch/` 目录中。

## 规范约定

- 每个特性对应一个独立目录：`.scratch/<feature-slug>/`
- 特性规格说明文件路径：`.scratch/<feature-slug>/spec.md`
- 任务拆解与实现 Issue：存放在 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号，每个文件对应一个具体子任务，严禁合并为单个大文件
- 分流与流转状态（Triage State）：在每个 Issue 文件顶部使用 `Status:` 行进行标记（对应角色与状态定义详见 `triage-labels.md`）
- 评论与讨论记录：在文件末尾以 `## Comments` 标题追加

## 当技能提示 "publish to the issue tracker"（发布到任务追踪器）

在 `.scratch/<feature-slug>/` 下新建对应任务文件（如目录不存在则自动创建）。

## 当技能提示 "fetch the relevant ticket"（获取相关工单）

读取所引用路径下的 Markdown 文件。用户通常会直接提供文件路径或任务编号。

## Wayfinding 探索工作流（用于 /wayfinder）

用于 `/wayfinder`。**全局地图（Map）** 为一个文件，每个任务对应一个 **子任务文件（Child ticket）**。

- **地图文件（Map）**：`.scratch/<effort>/map.md`（包含 Notes 笔记、Decisions-so-far 决策沉淀、Fog 待探索盲区主体）。
- **子任务工单（Child ticket）**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号，正文包含需要解决的具体问题。使用 `Type:` 行标注工单类型（`research`/`prototype`/`grilling`/`task`）；使用 `Status:` 行标注工单状态（`claimed`/`resolved`）。
- **阻塞依赖（Blocking）**：在顶部标注 `Blocked by: NN, NN`。当其所列的所有前置工单均变为 `resolved` 时，当前工单视为解除阻塞。
- **前沿推进（Frontier）**：扫描 `.scratch/<effort>/issues/` 目录下处于未完成、未阻塞且未认领的工单；按编号顺序优先级推进。
- **认领任务（Claim）**：开始处理前将状态更新为 `Status: claimed` 并保存。
- **解决任务（Resolve）**：在 `## Answer` 标题下追加处理结果，将状态设为 `Status: resolved`，并将上下文摘要与链接追加至 `map.md` 的 Decisions-so-far 决策列表中。
