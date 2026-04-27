var Skin = window.Skin || class Skin {
    constructor({ name, description, css, previews, categories }) {
        this.name = typeof name === "string" && name.trim() ? name.trim() : "Unnamed skin";
        this.description = typeof description === "string" ? description : "";
        this.css = typeof css === "string" ? css : "";
        this.previews = this.normalizePreviews(previews);
        this.categories = this.normalizeCategories(categories);
        this.addCustomCssInput();

        console.log(`Skin "${this.name}" initialized with ${this.categories.length} categories.`);
    }

    normalizeCategories(categories) {
        if (!Array.isArray(categories)) {
            return [];
        }

        return categories
            .filter(category => category && typeof category === "object")
            .map(category => new Category(category.name, category.controls))
            .filter(category => Array.isArray(category.controls) && category.controls.length > 0);
    }

    normalizePreviews(previews) {
        if (!Array.isArray(previews)) {
            return [];
        }

        return previews
            .filter(preview => preview && typeof preview === "object" && typeof preview.url === "string" && preview.url.trim())
            .map((preview, index) => ({
                name: typeof preview.name === "string" && preview.name.trim()
                    ? preview.name.trim()
                    : `Preview ${index + 1}`,
                url: preview.url.trim()
            }));
    }

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    generateHTML({ includePreview = true, includeLivePreview = true, context = "main" } = {}) {
        const controlCount = this.categories.reduce((sum, category) => {
            const categoryControls = Array.isArray(category?.controls) ? category.controls.length : 0;
            return sum + categoryControls;
        }, 0);
        const categoriesHTML = this.categories
            .map(category => category.generateHTML())
            .join('');

        const hasPreviews = includePreview && Array.isArray(this.previews) && this.previews.length > 0;
        const previewsHTML = hasPreviews ? this.generatePreviewHTML() : '';
        const livePreviewHTML = includeLivePreview ? this.generateLivePreviewHTML() : '';
        const hasPreviewColumn = hasPreviews || includeLivePreview;
        const layoutMode = hasPreviewColumn && controlCount <= 2
            ? "micro"
            : hasPreviewColumn && controlCount <= 4
                ? "compact"
                : hasPreviewColumn && controlCount <= 7
                    ? "balanced"
                    : "default";
        const workspaceSummaryHTML = context === "history"
            ? `
                    <section class="workspaceSummaryCard">
                        <h3 class="workspaceSummary-title">${this.escapeHtml(this.name)}</h3>
                        <p class="workspaceSummary-copy">${this.escapeHtml(this.description || "Saved skin configuration.")}</p>
                        <p class="workspaceSummary-note">Review the saved settings below before restoring this revision.</p>
                    </section>`
            : "";

        return `
            <div data-role="controlgroup" class="optionsContainer" data-has-previews="${hasPreviews}" data-has-preview-column="${hasPreviewColumn}" data-layout="${layoutMode}" data-control-count="${controlCount}">
                <div class="categoriesContainer">
                    ${workspaceSummaryHTML}
                    ${categoriesHTML}
                </div>
                ${hasPreviewColumn ? `
                    <div class="previewColumn">
                        ${livePreviewHTML}
                        ${hasPreviews ? `<div class="previewsContainer">${previewsHTML}</div>` : ""}
                    </div>
                ` : ""}
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
            : `<p class="previewEmpty">This skin does not include screenshots yet.</p>`;

        const dots = hasPreviews
            ? `<div class="previewDots">
                    ${this.previews.map((_, index) => `<button type="button" class="previewDot" data-index="${index}" aria-label="Vista ${index + 1}"></button>`).join("")}
               </div>`
            : "";

        return `
            <div class="verticalSection verticalSection-extrabottompadding previewSection" data-has-previews="${hasPreviews}">
                <div class="previewSection-header">
                    <div>
                        <h3 class="previewPanelTitle">Gallery</h3>
                        <p class="sectionSubtitle">Reference screenshots bundled with this skin.</p>
                    </div>
                </div>

                <div class="previewCarousel" role="region" aria-label="Skin screenshots">
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
            <fieldset class="verticalSection verticalSection-extrabottompadding" id="livePreviewShell">
                <legend >Live preview</legend>
                <div class="livePreviewHeader">
                    <div class="previewActions">
                        <button is="emby-button" type="button" class="previewAction previewAction-secondary" id="livePreviewRefresh">
                            <span>Reload</span>
                        </button>
                        <button is="emby-button" type="button" class="previewAction previewAction-primary" id="livePreviewExpand">
                            <span>Fullscreen</span>
                        </button>
                    </div>
                </div>
                <div class="livePreviewFrameWrapper">
                    <iframe id="skinLivePreviewFrame" title="Live skin preview" loading="lazy"></iframe>
                </div>
            </fieldset>
        `;
    }


    addCustomCssInput() {
        const hasCustomCssCategory = this.categories.some(category => category && category.name === "Custom CSS");
        if (hasCustomCssCategory) {
            return;
        }

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
