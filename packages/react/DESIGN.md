# @seval-ui/react 设计文档

## A2UI 协议简介

A2UI (Agent to UI) 是一个 JSON 流式 UI 协议，用于从 AI Agent 动态渲染用户界面。

### 核心概念

- **Surface**: 一个独立的 UI 区域，由 `surfaceId` 标识
- **Components**: UI 组件以扁平列表存储，通过 ID 引用构建树形结构
- **Data Model**: 组件通过 JSON Pointer 绑定数据
- **User Actions**: 用户交互触发 `userAction` 消息发送给 Agent

### 消息类型

| 消息 | 说明 |
|------|------|
| `createSurface` | 创建新 surface |
| `updateComponents` | 添加/更新组件 |
| `updateDataModel` | 更新数据模型 |
| `deleteSurface` | 删除 surface |

### 标准流程 (默认)

```
Agent → createSurface → updateComponents → updateDataModel → Client 渲染
User 交互 → Button 触发 action → userAction 发送给 Agent → Agent 响应
```

---

## 我们的实现和扩展

### @seval-ui/react

A2UI 协议的 React SDK 实现：

- **A2UIProvider**: 自动创建 store，渲染所有 surfaces
- **Store**: MobX State Tree 实现，响应式状态管理
- **SurfaceView**: 渲染单个 surface 的组件树
- **Catalog**: 可扩展的组件注册表

### @seval-ui/react-code

扩展 A2UI 的**本地交互能力**：

- **Code 组件**: 在 surface 中嵌入可执行逻辑
- **Seval (MiniJS)**: 轻量级 JS-like 语言，执行本地计算
- **本地 Action 处理**: 无需 Agent 响应即可更新 UI

---

## 本地执行扩展

### 问题

标准 A2UI 流程中，所有 `userAction` 都发送给 Agent 处理。这导致：
- 网络延迟
- Agent 负担重
- 简单交互效率低

### 解决方案：Code 组件

```json
{
  "id": "code",
  "component": "Code",
  "code": "{action_click_button() { display = display + 1 }}"
}
```

Code 组件：
1. 从 A2UI 组件树中渲染
2. 向 store 注册 action 监听器
3. 拦截并本地处理符合条件的 actions
4. 直接更新 data model，无需 Agent 参与

---

## Action 流程

```
┌──────────────┐     emitAction()    ┌─────────┐
│ UI Component │ ─────────────────► │  Store  │
│ (Button etc) │                     └────┬────┘
└──────────────┘                          │
                                          ▼
                           ┌─────────────────────────┐
                           │ Registered Action Handlers │
                           └────────────┬────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        ┌──────────┐             ┌──────────┐             ┌──────────────┐
        │   Code   │             │  其他    │             │   Fallback   │
        │ 本地逻辑 │             │  Handler │             │  → Agent     │
        └──────────┘             └──────────┘             └──────────────┘
```

### Handler 优先级

1. **Code 组件**: 匹配 action 名称，执行 Seval 逻辑
2. **用户自定义 Handler**: `createCodeComponent({ actions: {...} })`
3. **Fallback Handler**: 未处理的 action 发送给 Agent

---

## 使用示例

```tsx
import { A2UIProvider } from '@seval-ui/react'
import { createCodeComponent } from '@seval-ui/react-code'

const codeComponent = createCodeComponent({
  actions: {
    customAction: (ctx) => { /* 用户逻辑 */ }
  }
})

function App() {
  return (
    <div>
      <h1>Calculator</h1>
      <A2UIProvider components={[...defaultComponents, codeComponent]} />
    </div>
  )
}
```

---

## 未来扩展

- **Fallback Agent Handler**: 未处理 action → A2A 通信
- **多 Surface 协作**: 跨 surface 数据同步
- **组件 Specs**: LLM 友好的组件描述
