var MainController = window.MainController || class MainController {
    constructor(jsonUrl) {
        this.jsonUrl = jsonUrl;
        this.skins = [];
        this.currentSkin = null;
        this.appliedSkin = null;
        this.selectElement = document.getElementById("cssOptions");
        this.descriptionElement = document.getElementById("description");
        this.optionsElement = document.getElementById("options");
        this.setSkinButton = document.getElementById("setSkin");
        this.setSkinButtonLabel = this.setSkinButton ? this.setSkinButton.querySelector("span") : null;
        this.heroCurrentSkinElement = document.getElementById("heroCurrentSkin");
        this.heroCurrentSkinHintElement = document.getElementById("heroCurrentSkinHint");
        this.configController = new ConfigController();
        this.previewState = { index: 0, count: 0 };
        this.livePreviewTimer = null;
        this.previewExpanded = false;
        this.previewKeydownHandler = null;
        this.livePreviewObserver = null;
        this.livePreviewCurrentUrl = null;
    }

    async init() {
        try {
            const [json, appliedSkin] = await Promise.all([
                this.fetchJson(),
                this.loadCurrentSkinFromHistory()
            ]);

            this.appliedSkin = appliedSkin;
            this.loadSkins(json);
            this.injectCurrentSkin(appliedSkin);
            this.populateSelect();
            this.initEventListeners();
        } catch (error) {
            console.error("Error loading skins:", error);
        }
    }

    async fetchJson() {
        const response = await fetch(this.jsonUrl);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return await response.json();
    }

    async loadCurrentSkinFromHistory() {
        try {
            const [history, config] = await Promise.all([
                this.configController.loadHistorySkins(),
                this.configController.getPluginConfiguration()
            ]);

            if (!Array.isArray(history) || history.length === 0) {
                return null;
            }

            const selectedSkinName = typeof config?.selectedSkin === "string"
                ? config.selectedSkin.trim()
                : "";

            const selectedSkin = selectedSkinName
                ? history.find(skin => skin && skin.name === selectedSkinName)
                : null;

            return selectedSkin || history[0];
        } catch (error) {
            console.warn("Could not load the currently applied skin:", error);
            return null;
        }
    }

    loadSkins(json) {
        const skins = Array.isArray(json?.skins) ? json.skins : [];
        this.skins = skins
            .filter(skin => skin && typeof skin === "object")
            .map(skin => {
                try {
                    return new Skin(skin);
                } catch (error) {
                    console.warn("Ignoring invalid skin definition:", skin, error);
                    return null;
                }
            })
            .filter(Boolean);
    }

    injectCurrentSkin(currentSkin) {
        if (!currentSkin) {
            return;
        }

        this.skins.unshift(this.cloneAsCurrentSkin(currentSkin));
    }

    cloneAsCurrentSkin(skin) {
        if (!skin) {
            return null;
        }

        const plainSkin = JSON.parse(JSON.stringify(skin));
        const baseName = this.extractSkinBaseName(plainSkin.name);
        plainSkin.name = `Currently applied - ${baseName}`;
        plainSkin.description = plainSkin.description || "This is the setup currently applied on your server, including saved overrides.";

        if (Array.isArray(plainSkin.categories)) {
            plainSkin.categories = plainSkin.categories.filter(cat => cat && cat.name !== "Custom CSS");
        }

        return new Skin(plainSkin);
    }

    extractSkinBaseName(name) {
        if (!name) {
            return "unknown";
        }

        const match = String(name).match(/-\s*(.+)$/);
        if (match && match[1]) {
            return match[1].trim();
        }

        return String(name).trim();
    }

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    isCurrentSkinSelected() {
        return typeof this.currentSkin?.name === "string"
            && this.currentSkin.name.startsWith("Currently applied - ");
    }

    setApplyButtonState({ busy = false, disabled = false } = {}) {
        if (!this.setSkinButton) {
            return;
        }

        const isDisabled = busy || disabled || !this.currentSkin;
        this.setSkinButton.disabled = isDisabled;

        if (!this.setSkinButtonLabel) {
            return;
        }

        if (busy) {
            this.setSkinButtonLabel.textContent = "Applying...";
            return;
        }

        this.setSkinButtonLabel.textContent = this.isCurrentSkinSelected()
            ? "Reapply Current Setup"
            : "Apply Skin";
    }

    populateSelect() {
        this.selectElement.innerHTML = "";

        this.skins.forEach((skin, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = skin.name;
            this.selectElement.appendChild(option);
        });

        if (this.skins.length <= 0) {
            this.currentSkin = null;
            this.descriptionElement.textContent = "No skins available.";
            this.optionsElement.innerHTML = "";
            this.renderSelectionOverview();
            this.setApplyButtonState({ disabled: true });
            return;
        }

        this.selectElement.value = 0;
        this.currentSkin = this.skins[0];
        this.showSkin();
    }

    showSkin() {
        if (!this.currentSkin) {
            return;
        }

        this.renderSkinDescription();
        this.renderSelectionOverview();
        this.optionsElement.innerHTML = this.currentSkin.generateHTML();
        this.currentSkin.attachEventListeners();
        this.setupPreviewSection();
        this.attachAutoPreviewListeners();
        this.setApplyButtonState();
    }

    setupPreviewSection() {
        this.previewState = {
            index: 0,
            count: Array.isArray(this.currentSkin?.previews) ? this.currentSkin.previews.length : 0
        };

        this.previewTrack = document.getElementById("skinPreviewTrack");
        this.previewDots = Array.from(document.querySelectorAll(".previewDot"));
        this.previewCaption = document.getElementById("skinPreviewCaption");
        this.previewNavButtons = Array.from(document.querySelectorAll(".previewNav"));
        this.previewSection = document.querySelector(".previewSection");
        this.livePreviewExpandButton = document.getElementById("livePreviewExpand");
        this.livePreviewContainer = document.getElementById("livePreviewShell");
        this.livePreviewFrame = document.getElementById("skinLivePreviewFrame");
        this.livePreviewAuto = null;
        this.livePreviewRoute = null;
        this.livePreviewItemId = null;

        this.setPreviewExpanded(false);
        this.bindCarouselEvents();
        this.bindLivePreviewEvents();
        this.setPreviewSlide(0);
        this.resetLivePreview(true);
        this.refreshLivePreview({ auto: true });
    }

    bindCarouselEvents() {
        if (!this.previewTrack || this.previewState.count <= 0) {
            this.updatePreviewCaption(null);
            return;
        }

        this.previewNavButtons.forEach(button => {
            button.addEventListener("click", () => {
                const direction = button.dataset.action === "next" ? 1 : -1;
                this.setPreviewSlide(this.previewState.index + direction);
            });
        });

        this.previewDots.forEach(dot => {
            dot.addEventListener("click", () => {
                const dotIndex = parseInt(dot.dataset.index, 10);
                if (!Number.isNaN(dotIndex)) {
                    this.setPreviewSlide(dotIndex);
                }
            });
        });
    }

    setPreviewSlide(newIndex) {
        if (!this.previewTrack || this.previewState.count <= 0) {
            this.updatePreviewCaption(null);
            return;
        }

        const count = this.previewState.count;
        const normalizedIndex = ((newIndex % count) + count) % count;
        this.previewState.index = normalizedIndex;

        const offset = normalizedIndex * 100;
        this.previewTrack.style.transform = `translateX(-${offset}%)`;

        this.previewDots.forEach(dot => {
            const dotIndex = parseInt(dot.dataset.index, 10);
            dot.classList.toggle("is-active", dotIndex === normalizedIndex);
        });

        const preview = this.currentSkin.previews?.[normalizedIndex];
        this.updatePreviewCaption(preview, normalizedIndex, count);
    }

    updatePreviewCaption(preview, index = 0, total = 0) {
        if (!this.previewCaption) {
            return;
        }

        if (!preview) {
            this.previewCaption.textContent = this.currentSkin?.description || "No description available.";
            return;
        }

        const positionText = total ? `${index + 1}/${total}` : "";
        const label = preview.name || "Preview";
        this.previewCaption.textContent = positionText
            ? `${label} - ${positionText}`
            : label;
    }

    attachAutoPreviewListeners() {
        if (!this.optionsElement) {
            return;
        }

        if (this.optionChangeHandler) {
            this.optionsElement.removeEventListener("input", this.optionChangeHandler);
            this.optionsElement.removeEventListener("change", this.optionChangeHandler);
        }

        this.optionChangeHandler = () => this.handleOptionsChanged();
        this.optionsElement.addEventListener("input", this.optionChangeHandler);
        this.optionsElement.addEventListener("change", this.optionChangeHandler);
    }

    handleOptionsChanged() {
        this.scheduleLivePreviewUpdate();
    }

    scheduleLivePreviewUpdate() {
        if (this.livePreviewTimer) {
            clearTimeout(this.livePreviewTimer);
        }

        this.livePreviewTimer = setTimeout(() => {
            this.refreshLivePreview({ auto: true });
        }, 180);
    }

    bindLivePreviewEvents() {
        if (this.livePreviewExpandButton) {
            this.livePreviewExpandButton.addEventListener("click", () => {
                this.setPreviewExpanded(!this.previewExpanded);
            });
        }

        if (!this.previewKeydownHandler) {
            this.previewKeydownHandler = (event) => {
                if (event.key === "Escape" && this.previewExpanded) {
                    this.setPreviewExpanded(false);
                }
            };

            document.addEventListener("keydown", this.previewKeydownHandler);
        }
    }

    refreshLivePreview({ auto = false } = {}) {
        if (!this.livePreviewFrame || !this.currentSkin) {
            return;
        }

        const css = this.currentSkin.generateCSS();
        const targetUrl = this.buildLivePreviewUrl();

        if (this.livePreviewCurrentUrl === targetUrl && this.livePreviewFrame.contentDocument) {
            this.injectCssIntoFrame(css);
            return;
        }

        this.livePreviewCurrentUrl = targetUrl;
        this.disconnectLivePreviewObserver();
        this.livePreviewFrame.removeAttribute("srcdoc");
        this.livePreviewFrame.src = targetUrl;
        this.livePreviewFrame.onload = () => this.injectCssIntoFrame(css);

        if (!auto) {
            console.log(`Live preview applied for: ${this.currentSkin.name}`);
        }
    }

    resetLivePreview(skipAutoRefresh = false) {
        if (!this.livePreviewFrame) {
            return;
        }

        this.livePreviewCurrentUrl = null;
        this.clearInjectedCss();
        if (!skipAutoRefresh) {
            this.refreshLivePreview({ auto: true });
        }
    }

    buildLivePreviewUrl() {
        return "/web/#/home";
    }

    injectCssIntoFrame(css) {
        if (!this.livePreviewFrame) {
            return;
        }

        try {
            const doc = this.livePreviewFrame.contentDocument;
            if (!doc) {
                return;
            }

            this.removeExistingCustomCss(doc);
            this.startLivePreviewObserver(doc);
            const targetHead = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
            let styleTag = doc.getElementById("skinManagerLiveCss");
            if (!styleTag) {
                styleTag = doc.createElement("style");
                styleTag.id = "skinManagerLiveCss";
                targetHead.appendChild(styleTag);
            }

            styleTag.textContent = css || "/* Live preview without CSS */";
        } catch (error) {
            console.warn("Could not inject CSS into the live preview", error);
        }
    }

    clearInjectedCss() {
        if (!this.livePreviewFrame || !this.livePreviewFrame.contentDocument) {
            return;
        }

        const styleTag = this.livePreviewFrame.contentDocument.getElementById("skinManagerLiveCss");
        if (styleTag && styleTag.parentNode) {
            styleTag.parentNode.removeChild(styleTag);
        }
    }

    startLivePreviewObserver(doc) {
        this.disconnectLivePreviewObserver();
        const target = doc.getElementById("reactRoot") || doc.body || doc.documentElement;
        if (!target || typeof MutationObserver === "undefined") {
            return;
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => this.stripStyleNodes(node));
            });
        });

        observer.observe(target, { childList: true, subtree: true });
        this.livePreviewObserver = observer;
    }

    disconnectLivePreviewObserver() {
        if (this.livePreviewObserver) {
            this.livePreviewObserver.disconnect();
            this.livePreviewObserver = null;
        }
    }

    removeExistingCustomCss(doc) {
        const targets = [
            doc.getElementById("reactRoot"),
            doc.body
        ].filter(Boolean);

        targets.forEach(node => this.stripStyleNodes(node));
    }

    stripStyleNodes(node) {
        if (!node || node.nodeType !== 1) {
            return;
        }

        if (node.tagName === "STYLE" && node.id !== "skinManagerLiveCss") {
            node.parentNode && node.parentNode.removeChild(node);
            return;
        }

        const styles = node.querySelectorAll("style");
        styles.forEach(style => {
            if (style.id !== "skinManagerLiveCss" && style.parentNode) {
                style.parentNode.removeChild(style);
            }
        });
    }

    setPreviewExpanded(expanded) {
        this.previewExpanded = Boolean(expanded);
        document.body?.classList.toggle("skinPreviewFullscreenActive", this.previewExpanded);

        if (!this.livePreviewContainer) {
            return;
        }

        this.livePreviewContainer.dataset.expanded = this.previewExpanded ? "true" : "false";
        if (this.previewExpanded) {
            this.livePreviewContainer.setAttribute("role", "dialog");
            this.livePreviewContainer.setAttribute("aria-modal", "true");
        } else {
            this.livePreviewContainer.removeAttribute("role");
            this.livePreviewContainer.removeAttribute("aria-modal");
        }

        if (this.livePreviewExpandButton) {
            this.livePreviewExpandButton.setAttribute("aria-pressed", this.previewExpanded ? "true" : "false");
            this.livePreviewExpandButton.setAttribute(
                "aria-label",
                this.previewExpanded ? "Salir de pantalla completa" : "Pantalla completa"
            );
            this.livePreviewExpandButton.setAttribute(
                "title",
                this.previewExpanded ? "Salir de pantalla completa" : "Pantalla completa (F)"
            );

            const icon = this.livePreviewExpandButton.querySelector(".material-icons");
            if (icon) {
                icon.classList.toggle("fullscreen", !this.previewExpanded);
                icon.classList.toggle("fullscreen_exit", this.previewExpanded);
            }
        }
    }

    toggleDetailsField() {
        if (!this.livePreviewItemId || !this.livePreviewRoute) {
            return;
        }

        const isDetails = this.livePreviewRoute.value === "details";
        this.livePreviewItemId.disabled = !isDetails;
        this.livePreviewItemId.placeholder = isDetails
            ? "Demo item id (optional)"
            : "Not required for this route";
    }

    updateSkinInfo(index) {
        const skin = this.skins[index];
        if (!skin) {
            return;
        }

        this.descriptionElement.textContent = `Skin: ${skin.name}`;

        this.optionsElement.innerHTML = "";
        skin.categories.forEach(cat => {
            const div = document.createElement("div");
            div.textContent = cat;
            this.optionsElement.appendChild(div);
        });
    }

    changeSkin() {
        const selectedIndex = parseInt(this.selectElement.value, 10);
        if (Number.isNaN(selectedIndex) || !this.skins[selectedIndex]) {
            return;
        }

        this.currentSkin = this.skins[selectedIndex];
        this.showSkin();
        console.log(`Skin changed to: ${this.currentSkin.name}`);
    }

    renderSkinDescription() {
        if (!this.descriptionElement) {
            return;
        }

        const desc = this.currentSkin?.description;
        this.descriptionElement.textContent = desc && String(desc).trim()
            ? desc
            : "This skin does not provide a description.";
    }

    renderSelectionOverview() {
        const currentName = this.appliedSkin
            ? this.extractSkinBaseName(this.appliedSkin.name)
            : "No skin saved yet";

        if (this.heroCurrentSkinElement) {
            this.heroCurrentSkinElement.textContent = currentName;
        }

        if (this.heroCurrentSkinHintElement) {
            this.heroCurrentSkinHintElement.textContent = this.appliedSkin
                ? "The most recently applied setup is duplicated at the top of the preset list as a safe starting point."
                : "Apply any preset once and Skin Manager will keep a recoverable history for you.";
        }
    }

    async applyCurrentSkin() {
        if (!this.currentSkin) {
            return;
        }

        const css = this.currentSkin.generateCSS();
        this.setApplyButtonState({ busy: true });

        try {
            const serverConfig = await ApiClient.getServerConfiguration();
            await ApiClient.updateServerConfiguration(serverConfig);

            const brandingConfig = await ApiClient.getNamedConfiguration("branding");
            const existingCss = brandingConfig && typeof brandingConfig.CustomCss === "string"
                ? brandingConfig.CustomCss
                : "";

            if (existingCss && !this.configController.isManagedCss(existingCss)) {
                await this.configController.saveUserCss(existingCss);
            }

            brandingConfig.CustomCss = css;
            await ApiClient.updateNamedConfiguration("branding", brandingConfig);
            Dashboard.processServerConfigurationUpdateResult();

            const appliedSkinName = await this.configController.saveSkin(this.currentSkin);
            await this.configController.setSelectedSkin(appliedSkinName || this.currentSkin.name);

            window.location.reload(true);
        } catch (error) {
            console.error("Error applying skin:", error);
            this.setApplyButtonState();
        }
    }

    initEventListeners() {
        this.setSkinButton.addEventListener("click", () => {
            if (this.currentSkin) {
                this.applyCurrentSkin();
            }
        });

        this.selectElement.addEventListener("change", () => {
            this.changeSkin();
        });
    }
}
