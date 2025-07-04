# FormBuilder SDK

A form builder SDK for quickly building mobile-friendly data collection forms, supporting design mode and runtime mode.

# Preview
![101a0abaf407f8fdd949bba0ab424487](https://github.com/user-attachments/assets/2ba2d677-6035-41c2-8e44-df649b9f40b8)
## Features

- **Design Mode**: Visual form designer, supports drag-and-drop components, layout adjustment, and field property configuration

- **Runtime Mode**: The form generated based on the design, supports data entry and submission

- **No dependencies**: Implemented in pure JavaScript, can be directly imported via `<script>` tag

- **Flexible configuration**: Supports various field types and style configurations

- **Data interaction**: Provides complete data saving and submission callback

## Installation

### Directly include

```html

<script src="path/to/form-builder.min.js"></script>

```

### Using npm

```bash

npm install form-builder-sdk

```

## Quick Start

### Design Mode

```html

<div id="form-designer-container"></div>

<script>

FormBuilder.init({

element: '#form-designer-container',

mode: 'design',

onSave: function(designJson) {

console.log('Form design has been saved:', designJson);

// Send the designJson to the server here for storage

}

});

</script>

```

### Runtime Mode

```html

<div id="form-runtime-container"></div>

<script>

FormBuilder.init({

element: '#form-runtime-container',

mode: 'runtime',

data: savedFormJson, // JSON data generated from design mode

onSubmit: function(formData) {

console.log('User submitted data:', formData);

// Send the formData to the server here

}

});

</script>

```

## API Documentation

### FormBuilder.init(config)

Initialize the FormBuilder SDK.

**Parameters:**

- `config` (Object): Configuration object

- `element` (string|HTMLElement): Container element or selector

- `mode` (string): Mode, 'design' or 'runtime'

- `data` (Object, optional): Form data (optional for design mode, required for runtime mode)

- `onSave` (Function, optional): Save callback in design mode, receives two parameters: designJson (design data) and showJson (whether to display JSON, false in non-debug mode)

- `onSubmit` (Function, optional): Submit callback in runtime mode, receives two parameters: formData (form data) and showJson (whether to display JSON, false in non-debug mode)

- `widthMode` (string, optional): Form width mode in runtime mode: 'min' (minimum width), 'auto' (automatic width), or 'fixed' (fixed width), default is 'auto'

- `fixedWidth` (string, optional): Fixed width value in runtime mode, e.g., '800px', effective only when widthMode is 'fixed'

- `minWidth` (string, optional): Minimum width value in runtime mode, e.g., '320px', default is '320px'

- `debug` (boolean, optional): Debug mode, default is true. When set to false, the design mode does not display the final data structure JSON, and the runtime mode does not display the JSON after clicking save

**Returns:** FormBuilder instance

### FormBuilder.saveDesign()

Save the current form design (only in design mode).

**Note:** In debug mode, it calls the onSave callback and displays the design JSON; in non-debug mode, it calls the onSave callback but does not display the design JSON.

**Returns:** Form design JSON

### FormBuilder.submitForm()

Submit the current form (only in runtime mode).

**Note:** In debug mode, it calls the onSubmit callback and displays the form data JSON; in non-debug mode, it calls the onSubmit callback but does not display the form data JSON.

**Returns:** Form data

### FormBuilder.getData()

Get the current form data.

**Returns:** Form data

### FormBuilder.setData(data)

Set form data.

**Parameters:**

- `data` (Object): Form data

**Returns:** FormBuilder instance

### FormBuilder.destroy()

Destroy the FormBuilder instance and clean up resources.

## Data Structure

### JSON produced by design mode

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

"label": "Name",

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

"label": "Remarks",

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

### JSON produced by runtime mode

```json

{

"Name": "Zhang San",

"Remarks": "This is a test remark.",

"Entry Date": "2025-06-27",

"Contract Number": 12345

}

```

## Browser Compatibility

- Chrome (latest version)

- Firefox (latest version)

- Safari (latest version)

- Edge (latest version)

## Development

### Install Dependencies

```bash

npm install

```

### Development Mode

```bash

npm run dev

```

### Build Production Version

```bash

npm run build

```

## License

Apache License 2.0

For detailed information, please refer to the [LICENSE](LICENSE) file.

## Contribution

Welcome to submit Issues and Pull Requests to help improve this project.
