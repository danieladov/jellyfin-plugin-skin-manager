class NumberControl extends Control {
    constructor(config) {
        super(config);
        this.min = config.min;
        this.max = config.max;
        this.type = 'number';
    }

    generateHTML() {
        return `<div class="inputContainer">
                    <input is="emby-input" type="number" class="number"
                    value='${this.value}' id='${this.id}' min='${this.min}' max='${this.max}' label='${this.label}'>
                    <div class="fieldDescription">${this.description}</div>
            </div>`;

    }

    attachEventListeners() {
        const numberInput = document.getElementById(this.id);
        numberInput.addEventListener('input', (event) => {
            this.value = event.target.value;
        });
    }
}

window.NumberControl = NumberControl;
