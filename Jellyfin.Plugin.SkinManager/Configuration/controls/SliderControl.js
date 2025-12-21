class SliderControl extends Control {
    constructor(config) {
        super(config);
        this.min = config.min;
        this.max = config.max;
        this.type = 'slider';
    }

    generateHTML() {
        return `<div class="inputContainer" >
            <input type="range" class="slider" value="${this.value}" data-css="${this.css}" id="${this.id}" min="${this.min}" max="${this.max}" label="${this.name}">
                <div class="fieldDescription">${this.label}
                </div>
            </div>`;
    }

    attachEventListeners() {
        const slider = document.getElementById(this.id);
        slider.addEventListener('input', (event) => {
            console.log(event.target.value);
            this.value = event.target.value;
        });
    }
}

window.SliderControl = SliderControl;
