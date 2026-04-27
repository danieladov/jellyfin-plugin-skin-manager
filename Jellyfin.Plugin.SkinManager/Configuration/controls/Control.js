var Control = window.Control || class Control {
    constructor({ label, description, value, default: defaultValue, css }) {
        this.id = this.constructor.name + Math.random().toString(36).substring(7);
        this.label = label;
        this.value = value ?? defaultValue;
        this.css = css || "";
        this.description = description || '';
    }

    generateHTML() {
        return "";
    }

    generateCSS() {
        return this.css.split("%value%").join(this.value);
    }

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    getDescription() {
        return typeof this.description === "string" ? this.description.trim() : "";
    }

    formatValueLabel(value = this.value) {
        const formatted = String(value ?? "").trim();
        return formatted || "Default";
    }

    renderShell({ inputHtml, valueHtml = "", description = this.getDescription(), className = "" }) {
        const helperHtml = description
            ? `<p class="controlDescription">${this.escapeHtml(description)}</p>`
            : "";
        const valueBlock = valueHtml
            ? `<div class="controlValue">${valueHtml}</div>`
            : "";
            
        return `
            <section class="controlCard ${className}">
                <div class="controlHeader">
                    <div class="controlHeader-copy">
                        <label class="controlLabel" for="${this.id}">${this.escapeHtml(this.label || "Option")}</label>
                        ${helperHtml}
                    </div>
                    ${valueBlock}
                </div>
                <div class="controlField">
                    ${inputHtml}
                </div>
            </section>
        `;
    }
}

window.Control = Control;
