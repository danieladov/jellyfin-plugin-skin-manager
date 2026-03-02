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

    generateHTML({ includePreview = true, includeLivePreview = true } = {}) {
        const categoriesHTML = this.categories
            .map(category => category.generateHTML())
            .join('');

        const hasPreviews = includePreview && Array.isArray(this.previews) && this.previews.length > 0;
        const previewsHTML = hasPreviews ? this.generatePreviewHTML() : '';
        const livePreviewHTML = includeLivePreview ? this.generateLivePreviewHTML() : '';

        return `
            <div data-role="controlgroup" class="optionsContainer" data-has-previews="${hasPreviews}">
                <div class="categoriesContainer">
                    ${categoriesHTML}
                </div>
                ${hasPreviews ? `<div class="previewsContainer">${previewsHTML}</div>` : ""}
            </div>
            ${livePreviewHTML}
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
        const hasPreviews = Array.isArray(this.previews) && this.previews.length > 0;
        const slides = hasPreviews
            ? this.previews.map((preview, index) => {
                const label = preview.name || `Preview ${index + 1}`;
                return `
                    <div class="previewSlide" data-index="${index}">
                        <div class="previewSlide-imgWrapper">
                            <img src="${preview.url}" alt="${label}" loading="lazy">
                        </div>
                        <div class="previewSlide-label">${label}</div>
                    </div>
                `;
            }).join("")
            : `<p class="previewEmpty">Esta skin no tiene capturas todavia.</p>`;

        const dots = hasPreviews
            ? `<div class="previewDots">
                    ${this.previews.map((_, index) => `<button type="button" class="previewDot" data-index="${index}" aria-label="Vista ${index + 1}"></button>`).join("")}
               </div>`
            : "";

        return `
            <div class="verticalSection verticalSection-extrabottompadding previewSection" data-has-previews="${hasPreviews}">
                <div class="previewSection-header">
                    <div>
                        <h2 class="sectionTitle">Previsualizacion</h2>
                        <p class="sectionSubtitle">Recorre capturas estaticas de la skin.</p>
                    </div>
                </div>

                <div class="previewCarousel" role="region" aria-label="Capturas de la skin">
                    ${hasPreviews ? '<button type="button" class="previewNav previewNav-prev" data-action="prev" aria-label="Anterior">&#8592;</button>' : ''}
                    <div class="previewViewport">
                        <div class="previewTrack" id="skinPreviewTrack">
                            ${slides}
                        </div>
                    </div>
                    ${hasPreviews ? '<button type="button" class="previewNav previewNav-next" data-action="next" aria-label="Siguiente">&#8594;</button>' : ''}
                </div>
                ${dots}
                <div class="previewCaption" id="skinPreviewCaption"></div>
            </div>
        `;
    }

    generateLivePreviewHTML() {
        return `
            <div class="livePreviewShell" id="livePreviewShell">
                <div class="livePreviewHeader">
                    <div>
                        <h3 class="livePreviewTitle">Vista previa en vivo</h3>
                        <p class="livePreviewHint">Se recarga automaticamente al cambiar opciones. Siempre abre /web/#/home.</p>
                    </div>
                    <button is="emby-button" type="button" class="previewAction previewAction-secondary" id="livePreviewExpand">
                        <span>Ampliar vista previa</span>
                    </button>
                </div>
                <div class="livePreviewFrameWrapper">
                    <iframe id="skinLivePreviewFrame" title="Vista previa del skin" sandbox="allow-same-origin allow-scripts" loading="lazy"></iframe>
                </div>
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
