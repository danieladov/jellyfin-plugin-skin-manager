class Control {
    constructor({ label, description, value, default: defaultValue, css }) {
        this.id = this.constructor.name + Math.random().toString(36).substring(7);
        this.label = label;
        this.value = value ?? defaultValue;
        this.css = css;
        this.description = description || '';
    }

    generateHTML() {
        return "";
    }

    generateCSS() {
        return this.css.replace("%value%", this.value);
    }
}

window.Control = Control;
