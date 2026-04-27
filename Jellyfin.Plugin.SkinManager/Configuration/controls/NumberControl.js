var NumberControl = window.NumberControl || class NumberControl extends Control {
    constructor(config) {
        super(config);
        this.min = config.min;
        this.max = config.max;
        this.type = 'number';
    }

    generateHTML() {
        return this.renderShell({
            className: "controlCard-number",
            valueHtml: `<span class="valueBadge" id="${this.id}-value">${this.formatValueLabel()}</span>`,
            inputHtml: `
                <input is="emby-input" type="number" class="number"
                    value="${this.escapeHtml(this.value)}" id="${this.id}" min="${this.min}" max="${this.max}">
            `
        });
    }

    attachEventListeners() {
        const numberInput = document.getElementById(this.id);
        const valueBadge = document.getElementById(`${this.id}-value`);
        numberInput.addEventListener('input', (event) => {
            this.value = event.target.value;
            if (valueBadge) {
                valueBadge.textContent = this.formatValueLabel();
            }
        });
    }
}

window.NumberControl = NumberControl;
