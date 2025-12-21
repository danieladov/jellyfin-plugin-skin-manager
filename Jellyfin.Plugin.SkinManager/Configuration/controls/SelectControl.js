class SelectControl extends Control {
    constructor(config) {
        super(config);
        this.options = config.options;
        this.type = 'select';
    }

    generateHTML() {


        return `<div class="selectContainer"> 
                    <label for= "${this.id}" > ${this.label}</label >
                    <select is="emby-select" id="${this.id}">
                        ${this.options.map(option => `<option value="${option.value}"
                            ${option.value == this.value ? "selected" : ""} >${option.label}</option>`).join('')}
                    </select> 
                </div>`;
    }

    attachEventListeners() {
        const select = document.getElementById(this.id);
        select.addEventListener('change', (event) => {
            console.log("selected ", event.target.value);
            this.value = event.target.value;
        });
    }
}

window.SelectControl = SelectControl;
