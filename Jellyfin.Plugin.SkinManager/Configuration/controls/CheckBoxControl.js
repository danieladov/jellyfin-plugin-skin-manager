var CheckBoxControl = window.CheckBoxControl || class CheckBoxControl extends Control {
    constructor(config) {
        super(config);
        this.type = 'checkbox';
    }

    generateHTML() {
        const isChecked = !!this.value;
        const checkValue = isChecked ? "checked" : "";
        const stateText = isChecked ? "Enabled" : "Disabled";
        const stateClass = isChecked ? "is-on" : "is-off";

        return this.renderShell({
            className: "controlCard-checkbox",
            valueHtml: `<span class="statusPill ${stateClass}" id="${this.id}-pill">${stateText}</span>`,
            inputHtml: `
                <label class="checkboxField" for="${this.id}">
                    <input class="checkbox" type="checkbox" is="emby-checkbox" id="${this.id}" ${checkValue} />
                    <span class="checkboxState" id="${this.id}-state">${stateText}</span>
                </label>
            `
        });
    }

    attachEventListeners() {
        const checkbox = document.getElementById(this.id);
        const state = document.getElementById(`${this.id}-state`);
        const pill = document.getElementById(`${this.id}-pill`);
        checkbox.addEventListener('change', (event) => {
            this.value = event.target.checked;
            const enabled = !!this.value;
            const text = enabled ? "Enabled" : "Disabled";
            if (state) {
                state.textContent = text;
            }
            if (pill) {
                pill.textContent = text;
                pill.classList.toggle("is-on", enabled);
                pill.classList.toggle("is-off", !enabled);
            }
        });
    }

}

window.CheckBoxControl = CheckBoxControl;
