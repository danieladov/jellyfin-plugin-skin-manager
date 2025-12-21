class CheckBoxControl extends Control {
    constructor(config) {
        super(config);
        this.type = 'checkbox';
    }

    generateHTML() {
        var checkValue = this.value ? "checked" : "";
        return `<div class="checkboxContainer checkboxContainer-withDescription">
                    <label>
                        <input class = "checkbox" type="checkbox" is="emby-checkbox" id= ${this.id} ${checkValue}/>
                        <span>${this.label}</span>
                    </label>
                    <div class="fieldDescription checkboxFieldDescription">${this.label}</div>
                </div>`;

    }

    attachEventListeners() {
        const checkbox = document.getElementById(this.id);
        checkbox.addEventListener('change', (event) => {
            this.value = event.target.checked;
        });
    }

}

window.CheckBoxControl = CheckBoxControl;
