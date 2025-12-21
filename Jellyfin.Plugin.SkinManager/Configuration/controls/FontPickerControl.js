class FontPickerControl extends Control {
    constructor(config) {
        super(config);
        this.type = 'fontPicker';
        this.previewText = config.previewText || "Hello, This is your selected font-family.";
    }

    generateHTML() {
        const fontValue = this.value ?? "";
        const safeValue = fontValue.replace(/"/g, "&quot;");
        const parsed = this._parseFontSpec(fontValue);
        const previewStyle = parsed.family
            ? ` style="${this._composePreviewStyle(parsed)}"`
            : "";

        return `<div class="inputContainer">
                    <label for="${this.id}">${this.label}</label>
                    <input
                        is="emby-input"
                        type="text"
                        class="fontPickerInput"
                        id="${this.id}"
                        name="${this.id}"
                        value="${safeValue}"
                    />
                    <div class="fontCont fontPreviewContainer">
                        <p class="fontPreviewText" id="${this.id}-preview"${previewStyle}>${this.previewText}</p>
                    </div>
                    <div class="fieldDescription">${this.description}</div>
                </div>`;
    }

    attachEventListeners() {
        const input = document.getElementById(this.id);
        const preview = document.getElementById(`${this.id}-preview`);

        const updatePreview = (fontValue) => {
            const sanitizedValue = fontValue || "";
            this.value = sanitizedValue;
            const { family, weight, italic } = this._parseFontSpec(sanitizedValue);
            if (preview) {
                preview.style.fontFamily = family || sanitizedValue;
                preview.style.fontWeight = weight ? String(weight) : "";
                preview.style.fontStyle = italic ? "italic" : "";
            }
        };

        if (input) {
            const $input = window.jQuery ? window.jQuery(input) : null;
            if ($input && $input.fontpicker) {
                $input.fontpicker({ variants: true });
                $input.on('change', (event) => updatePreview(event.target.value));
            }

            input.addEventListener('input', (event) => updatePreview(event.target.value));
            input.addEventListener('change', (event) => updatePreview(event.target.value));
        }

        updatePreview(this.value);
    }

    _escapeFontFamily(fontFamily) {
        return (fontFamily || "").replace(/"/g, '\\"');
    }

    _parseFontSpec(fontSpec) {
        if (!fontSpec) {
            return { family: "", weight: null, italic: false };
        }

        const [familyPart, variantRaw = ""] = fontSpec.split(":");
        const family = (familyPart || "").trim();
        const variant = (variantRaw || "").trim().toLowerCase();

        let weight = null;
        let italic = false;

        if (!variant) {
            return { family, weight, italic };
        }

        const match = variant.match(/^(\d+)(i)?$/i);
        if (match) {
            weight = parseInt(match[1], 10);
            italic = !!match[2];
            return { family, weight, italic };
        }

        if (variant === "italic") {
            italic = true;
            return { family, weight, italic };
        }

        const numeric = parseInt(variant, 10);
        if (!isNaN(numeric)) {
            weight = numeric;
        }

        return { family, weight, italic };
    }

    _composePreviewStyle({ family, weight, italic }) {
        const parts = [];
        if (family) {
            parts.push(`font-family: ${this._escapeFontFamily(family)};`);
        }
        if (weight) {
            parts.push(`font-weight: ${weight};`);
        }
        if (italic) {
            parts.push("font-style: italic;");
        }
        return parts.join(" ");
    }
}

window.FontPickerControl = FontPickerControl;
