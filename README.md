# FormBuilder SDK

一个功能强大的表单构建器SDK，支持设计模式和运行模式。

## 功能特点

- **设计模式**：可视化表单设计器，支持拖拽组件、调整布局和配置字段属性
- **运行模式**：根据设计生成的表单，支持数据填写和提交
- **无依赖**：纯JavaScript实现，可通过`<script>`标签直接引入
- **灵活配置**：支持多种字段类型和样式配置
- **数据交互**：提供完整的数据保存和提交回调

## 安装

### 直接引入

```html
<script src="path/to/form-builder.min.js"></script>
```

### 使用npm

```bash
npm install form-builder-sdk
```

## 快速开始

### 设计模式

```html
<div id="form-designer-container"></div>

<script>
  FormBuilder.init({
    element: '#form-designer-container',
    mode: 'design',
    onSave: function(designJson) {
      console.log('表单设计已保存:', designJson);
      // 在此将designJson发送到服务器保存
    }
  });
</script>
```

### 运行模式

```html
<div id="form-runtime-container"></div>

<script>
  FormBuilder.init({
    element: '#form-runtime-container',
    mode: 'runtime',
    data: savedFormJson, // 设计模式产生的JSON数据
    onSubmit: function(formData) {
      console.log('用户提交的数据:', formData);
      // 在此将formData发送到服务器
    }
  });
</script>
```

## API文档

### FormBuilder.init(config)

初始化FormBuilder SDK。

**参数：**

- `config` (Object): 配置对象
  - `element` (string|HTMLElement): 容器元素或选择器
  - `mode` (string): 模式，'design' 或 'runtime'
  - `data` (Object, 可选): 表单数据（设计模式可选，运行模式必须）
  - `onSave` (Function, 可选): 设计模式下保存回调，接收两个参数：designJson（设计数据）和 showJson（是否显示JSON，在非调试模式下为false）
  - `onSubmit` (Function, 可选): 运行模式下提交回调，接收两个参数：formData（表单数据）和 showJson（是否显示JSON，在非调试模式下为false）
  - `widthMode` (string, 可选): 运行模式下表单宽度模式：'min'(最小宽度)、'auto'(自动宽度)或'fixed'(固定宽度)，默认为'auto'
  - `fixedWidth` (string, 可选): 运行模式下固定宽度值，例如'800px'，仅在widthMode为'fixed'时有效
  - `minWidth` (string, 可选): 运行模式下最小宽度值，例如'320px'，默认为'320px'
  - `debug` (boolean, 可选): 调试模式，默认为 true。设为 false 时，设计态不显示最终的数据结构JSON，运行态不显示点击保存后的JSON

**返回：** FormBuilder实例

### FormBuilder.saveDesign()

保存当前表单设计（仅设计模式）。

**说明：** 在调试模式下，会调用 onSave 回调并显示设计JSON；在非调试模式下，会调用 onSave 回调但不显示设计JSON。

**返回：** 表单设计JSON

### FormBuilder.submitForm()

提交当前表单（仅运行模式）。

**说明：** 在调试模式下，会调用 onSubmit 回调并显示表单数据JSON；在非调试模式下，会调用 onSubmit 回调但不显示表单数据JSON。

**返回：** 表单数据

### FormBuilder.getData()

获取当前表单数据。

**返回：** 表单数据

### FormBuilder.setData(data)

设置表单数据。

**参数：**

- `data` (Object): 表单数据

**返回：** FormBuilder实例

### FormBuilder.destroy()

销毁FormBuilder实例，清理资源。

## 数据结构

### 设计模式产出的JSON

```json
{
  "formSettings": {
    "width": "100%",
    "labelPosition": "top"
  },
  "layout": {
    "rows": [
      { "height": "50px" },
      { "height": "150px" },
      { "height": "auto" }
    ],
    "columns": [
      { "width": "50%" },
      { "width": "50%" }
    ],
    "cells": [
      { "row": 0, "col": 0, "rowSpan": 1, "colSpan": 2, "fieldId": "field_1" },
      { "row": 1, "col": 0, "rowSpan": 1, "colSpan": 1, "fieldId": "field_2" },
      { "row": 1, "col": 1, "rowSpan": 1, "colSpan": 1, "fieldId": "field_3" },
      { "row": 2, "col": 0, "rowSpan": 1, "colSpan": 2, "fieldId": "field_4" }
    ]
  },
  "fields": {
    "field_1": {
      "type": "text",
      "label": "姓名",
      "properties": {
        "fontSize": "14px",
        "border": "1px solid #dcdfe6",
        "backgroundColor": "#ffffff",
        "color": "#606266",
        "required": true
      }
    },
    "field_2": {
      "type": "textarea",
      "label": "备注",
      "properties": {
        "fontSize": "14px",
        "border": "1px solid #dcdfe6",
        "backgroundColor": "#ffffff",
        "color": "#606266",
        "required": false
      }
    }
  }
}
```

### 运行模式产出的JSON

```json
{
  "姓名": "张三",
  "备注": "这是一个测试备注。",
  "入职日期": "2025-06-27",
  "合同编号": 12345
}
```

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 许可证

Apache License 2.0

详细信息请参阅 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持设计模式和运行模式
- 提供完整的API接口
- 支持多种字段类型和样式配置