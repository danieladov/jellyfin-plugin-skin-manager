var SelectControl = window.SelectControl || class SelectControl extends Control {
    constructor(config) {
        super(config);
        this.options = config.options;
        this.type = 'select';
    }

    getSelectedOptionLabel() {
        const selected = Array.isArray(this.options)
            ? this.options.find(option => option && option.value == this.value)
            : null;

        return selected?.label || this.formatValueLabel();
    }

    generateHTML() {
        return this.renderShell({
            className: "controlCard-select",
            valueHtml: `<span class="valueBadge" id="${this.id}-value">${this.escapeHtml(this.getSelectedOptionLabel())}</span>`,
            inputHtml: `
                <div class="selectContainer controlSelectContainer">
                    <select is="emby-select" id="${this.id}" label="${this.label}"">
                        ${this.options.map(option => `<option value="${this.escapeHtml(option.value)}"
                            ${option.value == this.value ? "selected" : ""}>${this.escapeHtml(option.label)}</option>`).join('')}
                    </select>
                        
                </div>
            `
        });
    }

    attachEventListeners() {
        const select = document.getElementById(this.id);
        const valueBadge = document.getElementById(`${this.id}-value`);
        select.addEventListener('change', (event) => {
            this.value = event.target.value;
            if (valueBadge) {
                valueBadge.textContent = this.getSelectedOptionLabel();
            }
        });
    }
}

window.SelectControl = SelectControl;
