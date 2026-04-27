var Category = window.Category || class Category {

    constructor(name, controls) {
        console.log('Initializing Category with controls:', controls);
        this.name = typeof name === "string" && name.trim() ? name : "Options";
        this.controls = Array.isArray(controls)
            ? controls
                .map(controlConfig => this.createControl(controlConfig))
                .filter(Boolean)
            : [];
    }

    createControl(controlConfig) {
        if (!controlConfig || typeof controlConfig !== "object") {
            console.warn("Ignoring invalid control configuration:", controlConfig);
            return null;
        }

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
            default:
                console.warn(`Ignoring unsupported control type: ${controlConfig.type}`);
                return null;
        }
    }

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    generateHTML() {
        return `
            <fieldset class="verticalSection verticalSection-extrabottompadding">
                <legend>${this.escapeHtml(this.name)}</legend>
                <div class="categoryControls">
                    ${this.controls.map(control => control.generateHTML()).join('')}
                </div>
            </fieldset>
        `;
    }

    generateCSS() {
        return this.controls.map(control => control.generateCSS()).join('\n');
    }

    attachEventListeners() {
        this.controls.forEach(control => control.attachEventListeners());
    }

}

window.Category = Category;
