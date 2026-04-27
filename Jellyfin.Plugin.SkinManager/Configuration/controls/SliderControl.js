var SliderControl = window.SliderControl || class SliderControl extends Control {
    constructor(config) {
        super(config);
        this.min = config.min;
        this.max = config.max;
        this.type = 'slider';
    }

    generateHTML() {
        return this.renderShell({
            className: "controlCard-slider",
            valueHtml: `<span class="valueBadge" id="${this.id}-value">${this.formatValueLabel()}</span>`,
            inputHtml: `
                <div class="sliderField">
                    <input type="range" class="slider" value="${this.value}" data-css="${this.css}" id="${this.id}" min="${this.min}" max="${this.max}">
                    <div class="sliderMeta">
                        <span>${this.min}</span>
                        <span>Current value</span>
                        <span>${this.max}</span>
                    </div>
                </div>
            `
        });
    }

    attachEventListeners() {
        const slider = document.getElementById(this.id);
        const valueBadge = document.getElementById(`${this.id}-value`);
        slider.addEventListener('input', (event) => {
            this.value = event.target.value;
            if (valueBadge) {
                valueBadge.textContent = this.formatValueLabel();
            }
        });
    }
}

window.SliderControl = SliderControl;
