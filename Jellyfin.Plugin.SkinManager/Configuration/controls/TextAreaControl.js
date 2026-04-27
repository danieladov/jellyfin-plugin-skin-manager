var TextAreaControl = window.TextAreaControl || class TextAreaControl extends Control {
    constructor(config) {
        super(config);
        this.type = 'textarea';
    }

    generateHTML() {
        return this.renderShell({
            className: "controlCard-textarea customCssContainer",
            inputHtml: `
                <textarea is="emby-textarea" class="textarea-mono emby-textarea" id="${this.id}" rows="6">${this.escapeHtml(this.value)}</textarea>
            `
        });
    }

    attachEventListeners() {
        const textArea = document.getElementById(this.id);
        textArea.addEventListener('input', (event) => {
            this.value = event.target.value;
        });
    }

}

window.TextAreaControl = TextAreaControl;
