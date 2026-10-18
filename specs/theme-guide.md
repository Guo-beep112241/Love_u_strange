# 主题设计指南：荧光发疯丑萌 (Neo-Brutalism x Acid Pop)

## 1. 核心设计原则 (Design Intent)

本项目采用 **Innovation Track（创新轨迹）**，基于用户选择的「荧光发疯丑萌」视觉方向。
视觉风格融合了 **Neo-Brutalism (新粗野主义)** 和 **Acid Pop (酸性流行)**，旨在传达一种“精神状态不稳定、随时可能暴走”的情绪共鸣，完全打破传统的 iOS/Android 平台级设计规范。

**情感目标：**
- **刺点（Punctum）：** 高对比、荧光发光、故意“不完美”的视觉错误（Glitch / 噪点）。
- **材质感：** 半透明果冻与坏掉的电子屏幕的缝合感。

**物理法则设定：**
- **照明法则 (Lighting)：** 屏幕本身不作为照明源，全黑背景下，物体自发光（Inner Glow）并伴有溢出（Bloom）。
- **边缘法则 (Edges)：** 极其锋利或极度变形，没有平滑的中间过渡。粗粝的黑色描边与荧光色的实底阴影（Hard Offset Shadows）。
- **排版法则 (Typography)：** 机械、等宽、程序故障感。中文字体选择等宽/像素风格，排版带有强迫症般的对齐，与发疯的情绪形成反差。

## 2. 色彩系统 (Color Identity)

**纯粹的情绪发泄（无粉蓝/莫兰迪）：**
- **Background (`base`, 60%)**：深纯黑（#0a0a0f），没有任何紫色或蓝色的冗余色调，纯粹的虚无感，作为荧光色的完美舞台。
- **Primary Accent (`acid-green`, 10%)**：酸性荧光绿（#a8ff3e）。具有极强的视觉刺痛感，用于主要状态指示、最重要的按钮和高潮反馈。
- **Support / Mood 1 (`toxic-pink`)**：少量毒粉（#ff4dc4）。作为不稳定的情绪点缀。
- **Support / Mood 2 (`grime-purple`)**：脏紫（#7b2fff）。作为次级信息层、不活跃的标签。
- **Surface (`glass-dark`, 30%)**：10%透明度的白色或者极其细微的带有一点灰度的半透明质感，作为浮层（HUD/BottomSheet）。
- **Borders**：不是微妙的1px线，而是纯粹的刺眼线条（`rgba(168,255,62,0.4)`）。

**色彩防呆 (Guardrails)：**
- 绝不使用 AI 默认的“高级紫”组合。
- 绝不使用柔和的莫兰迪色。
- 当背景全黑时，避免使用大面积亮色铺底，荧光色只作文字、描边或微小的互动反馈。

## 3. 排版系统 (Typography Scale)

**阶梯选择：** 使用 **Perfect Fourth (1.333)** 以获得戏剧性的冲突感。但因为有大量 HUD，UI 数据显示，部分保持等宽克制。
- **Base Size:** 14px (由于大量粗野风格排版，基准设小一点，加大对比)
- **Ratio:** 1.333

**字体库选择：**
- **西文 Display/Mono：** `Space Mono`。带有复古和代码感。
- **西文 Body：** `Space Grotesk`。等宽变体，保持怪异但提高可读性。
- **中文字体 (emfont)：** 选用 `Cubic11` (俐方體11號)，带有强烈的像素/故障游戏感，或者粗犷的开源字体，破除“精致排版”的默认模式。

## 4. 间距与骨架 (Spacing Rhythm)

- 采用 **4px 基准** 以支持极其紧密或者极度夸张的布局。
- **布局哲学：** 底部悬浮的 HUD 与顶部巨大的、压抑的状态字，中间留出 80% 的大面积空间给 3D 模型“发疯”。
- 组件没有传统意义上的圆角阴影，使用带粗边框的实色阴影。

## 5. 组件配方 (Component Recipes)

### Container / Card (HUD 面板)
```html
<div class="bg-surface-glass-dark border border-brand-accent backdrop-blur-md p-base overflow-hidden relative">
  <!-- 伪元素噪点叠加 -->
  <div class="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] pointer-events-none mix-blend-overlay"></div>
  <slot />
</div>
```

### Action Button (发疯按钮)
```html
<button class="bg-brand-accent text-surface-base px-snug py-tight border-2 border-brand-accent hover:bg-transparent hover:text-brand-accent active:bg-brand-toxic active:border-brand-toxic transition-colors shadow-[4px_4px_0px_#a8ff3e] hover:shadow-[2px_2px_0px_#a8ff3e] hover:translate-x-[2px] hover:translate-y-[2px] active:scale-[0.96] uppercase font-display font-bold">
  [ 戳一戳 ]
</button>
```

### Emotion Tag (情绪标签)
```html
<span class="inline-flex items-center px-tight py-micro bg-brand-grime text-surface-raised border border-brand-toxic font-mono text-caption uppercase tracking-wider">
  躺平
</span>
```

## 6. 动效与交互 (Motion & Behavior)

**Motion Character（动作性格）：** 不稳定、抽搐、线性截断。拒绝平滑顺滑的 ease-in-out，采用极短的时间与弹簧曲线。
- **戳一戳 (Interaction)：** 不规律弹簧抖动 (`stiffness: 500`, `damping: 5`, `mass: 0.5`)。
- **发疯模式 (Long Press)：** 画面色差扫描，屏幕短时出现红绿色散 (RGB Split)，类似 CRT 屏幕撕裂。
- **状态切换：** 0ms 瞬间切换（硬切）。
- **HUD 呼出：** 从底部生硬地卡入屏幕，伴随弹簧反弹回震。

## 7. 质量门禁与反模式自检 (Design Audit Gates)

1. [x] **无紫蓝色块背景？** 是，完全纯黑背景 `#0a0a0f`。
2. [x] **无粉蓝/莫兰迪/无聊淡灰色？** 是，只使用极度张扬的荧光绿、紫、毒粉。
3. [x] **没有泛用的大圆角？** 是，全采用 0px 锐角。
4. [x] **没有平滑大阴影？** 是，采用 `4px 4px 0` 实底硬阴影 (Neo-Brutalism)。
5. [x] **字体非系统默认的 PingFang？** 是，使用了 emfont `Cubic11` (像素体) 与西文 `Space Mono`。
6. [x] **未重复系统 UI Chrome？** 确认不在设计中假造 iOS 状态栏。
7. [x] **没有 AI 特征词汇？** "高级"、"精致"被彻底消灭，采用粗粝、崩坏的字眼。
