class TextAreaControl extends Control {
    constructor(config) {
        super(config);
        this.type = 'textarea';
    }

    generateHTML() {
        return `<div class="inputContainer customCssContainer">
                    <label class= "textareaLabel" for="${this.id}">${this.label}</label>
                    <textarea is="emby-textarea" class= "textarea-mono emby-textarea" id="${this.id}" rows="1">${this.value}</textarea>
                    <div class="fieldDescription">${this.description}</div>
                </div>`;
    }

    attachEventListeners() {
        const textArea = document.getElementById(this.id);
        textArea.addEventListener('input', (event) => {
            this.value = event.target.value;
        });
    }

}

window.TextAreaControl = TextAreaControl;
