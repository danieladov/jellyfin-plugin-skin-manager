class Skin {
    constructor({ name, description, css, previews, categories }) {
        this.name = name;
        this.description = description;
        this.css = css;
        this.previews = previews;
        this.categories = categories.map(category => new Category(category.name, category.controls));
        this.addCustomCssInput();

        console.log(`Skin "${this.name}" initialized with ${this.categories.length} categories.`);
    }

    generateHTML({ includePreview = true } = {}) {
        const categoriesHTML = this.categories
            .map(category => category.generateHTML())
            .join('');

        const previewsHTML = includePreview ? this.generatePreviewHTML() : '';

        return `
            <div data-role="controlgroup" class="optionsContainer">
                <div class="categoriesContainer">
                    ${categoriesHTML}
                </div>
                <br/>
                ${previewsHTML}
            </div>
        `;
    }


    generateCSS() {
        const marker = "/* Skin Manager CSS */";
        const sections = [marker];

        if (typeof this.css === "string" && this.css.trim()) {
            sections.push(this.css.trim());
        }

        const categoryCss = this.categories
            .map(c => c.generateCSS())
            .filter(Boolean)
            .map(section => typeof section === "string" ? section.trim() : section)
            .filter(section => !!section && (typeof section !== "string" || section.length));

        sections.push(...categoryCss);

        return sections.join("\n\n") + "\n";
    }

    attachEventListeners() {
        this.categories.forEach(category => category.attachEventListeners());
    }

    generatePreviewHTML() {
        if (!this.previews || this.previews.length === 0) return '';

        return `
            <div class="verticalSection verticalSection-extrabottompadding previewSection">
                <h2 class="sectionTitle">Previews</h2>
                ${this.previews
                .map(p => `
                    <fieldset class="verticalSection verticalSection-extrabottompadding">
                    <img src="${p.url}" alt="${p.name || ''}">
                    <legend>${p.name}</legend>
                    </fieldset>`
                )
                .join("")}
            </div>
        `;
    }


    addCustomCssInput() {
        const CustomCssControl = new TextAreaControl({
            label: "Custom CSS",
            description: "Add your own CSS rules here. These will be applied last, so they can override other settings.",
            value: "",
            default: "",
            css: "%value%"
        });

        const CustomCategory = new Category("Custom CSS", [CustomCssControl]);
        this.categories.push(CustomCategory);
    }

}

