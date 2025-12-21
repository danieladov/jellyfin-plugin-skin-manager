class Category {

    constructor(name, controls) {
        console.log('Initializing Category with controls:', controls);
        this.name = name;
        this.controls = controls.map(controlConfig => {
            switch (controlConfig.type) {
                case 'color':
                    return new ColorControl(controlConfig);
                case 'slider':
                    return new SliderControl(controlConfig);
                case 'checkbox':
                    return new CheckBoxControl(controlConfig);
                case 'number':
                    return new NumberControl(controlConfig);
                case 'select':
                    return new SelectControl(controlConfig);
                case 'fontPicker':
                    return new FontPickerControl(controlConfig);
                case 'textarea':
                    return new TextAreaControl(controlConfig);
            }
        });
    }

    generateHeader() {
        return `<fieldset class="verticalSection verticalSection-extrabottompadding"><legend>${this.name}</legend>`;
    }

    generateFooter() {
        return "</fieldset>";
    }

    generateHTML() {
        return this.generateHeader() + this.controls.map(control => control.generateHTML()).join('</br>') + this.generateFooter();
    }

    generateCSS() {
        return this.controls.map(control => control.generateCSS()).join('\n');
    }

    attachEventListeners() {
        this.controls.forEach(control => control.attachEventListeners());
    }

}

window.Category = Category;
