# OSTI

OSTI（Operating System Type Indicator）是一个结合结构化人格维度与网络传播玩法的前端测试项目。

目标：

- 有方法：15 维评分 + 反向题 + 一致性提示
- 有梗感：人格以操作系统命名（iOS、Android、Windows、Linux 等）
- 有传播：结果文案一键复制，适合社交分享

## 快速启动

```sh
npm install
npm run dev
```

## 构建与类型检查

```sh
npm run build
```

## 项目结构

- `src/App.vue`：完整页面与交互（首页、答题、结果）
- `src/data/osti-data.ts`：题库、维度元数据、人格模板、规则配置
- `src/lib/osti-engine.ts`：评分引擎、向量匹配、特殊判定
- `src/types/osti.ts`：核心类型定义
- `OSTI_deep_analysis.md`：产品分析与增长策略文档

## 算法摘要

- 常规题共 30 题，2 题组成一个维度，共 15 维
- 选项计分默认 `A=1/B=2/C=3`
- 反向计分题：Q14、Q27
- 维度等级：
  - 2~3 分 => `L`
  - 4 分 => `M`
  - 5~6 分 => `H`
- 人格匹配：曼哈顿距离
- 相似度：`max(0, round((1 - 距离 / 30) * 100))`

## 特殊规则

- DRUNK：命中特殊分支时直接覆盖常规结果（100%）
- HHHH：常规模型相似度不足 60% 时触发兜底人格

## 注意事项

- OSTI 用于自我观察与娱乐表达，不用于医疗诊断。
- 如果结果和感受差异较大，建议间隔几天重测并对比。
