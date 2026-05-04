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
        this.shareToolsElement = document.getElementById("skinShareTools");
        this.shareParkingElement = document.getElementById("skinShareParking");
        this.exportNameElement = document.getElementById("skinExportName");
        this.exportDescriptionElement = document.getElementById("skinExportDescription");
        this.exportDownloadButton = document.getElementById("skinExportDownload");
        this.exportCopyButton = document.getElementById("skinExportCopy");
        this.exportStatusElement = document.getElementById("skinExportStatus");
        this.importFileElement = document.getElementById("skinImportFile");
        this.importTextElement = document.getElementById("skinImportText");
        this.importButton = document.getElementById("skinImportButton");
        this.importStatusElement = document.getElementById("skinImportStatus");
        this.configController = new ConfigController();
        this.importedSkins = [];
        this.pendingImportedSkin = null;
        this.previewState = { index: 0, count: 0 };
        this.livePreviewTimer = null;
        this.previewExpanded = false;
        this.previewKeydownHandler = null;
        this.livePreviewObserver = null;
        this.livePreviewCurrentUrl = null;
    }

    async init() {
        try {
            const [json, appliedSkin, importedSkins] = await Promise.all([
                this.fetchJson(),
                this.loadCurrentSkinFromHistory(),
                this.configController.loadImportedSkins()
            ]);

            this.appliedSkin = appliedSkin;
            this.importedSkins = importedSkins;
            this.loadSkins(json);
            this.addImportedSkins(importedSkins);
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

    addImportedSkins(importedSkins) {
        if (!Array.isArray(importedSkins) || importedSkins.length === 0) {
            return;
        }

        const importedNames = new Set();
        const uniqueImportedSkins = importedSkins.filter(skin => {
            if (!skin || typeof skin.name !== "string") {
                return false;
            }

            const normalizedName = skin.name.trim().toLocaleLowerCase();
            if (!normalizedName || importedNames.has(normalizedName)) {
                return false;
            }

            importedNames.add(normalizedName);
            return true;
        });

        this.skins = [...uniqueImportedSkins, ...this.skins];
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
        plainSkin.name = baseName;
        plainSkin.description = plainSkin.description || "This is the setup currently applied on your server, including saved overrides.";

        if (Array.isArray(plainSkin.categories)) {
            plainSkin.categories = plainSkin.categories.filter(cat => cat && cat.name !== "Custom CSS");
        }

        const currentSetupSkin = new Skin(plainSkin);
        currentSetupSkin.isCurrentSetup = true;
        return currentSetupSkin;
    }

    extractSkinBaseName(name) {
        return this.configController.getSkinBaseName(name, "unknown");
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
        return !!this.currentSkin?.isCurrentSetup
            || typeof this.currentSkin?.name === "string"
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

    populateSelect(selectedSkin = null) {
        this.selectElement.innerHTML = "";

        this.skins.forEach((skin, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = this.getSkinSelectLabel(skin);
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

        const selectedIndex = selectedSkin
            ? Math.max(0, this.skins.findIndex(skin => skin === selectedSkin || skin.name === selectedSkin.name))
            : 0;

        this.selectElement.value = selectedIndex;
        this.currentSkin = this.skins[selectedIndex];
        this.showSkin();
    }

    getSkinSelectLabel(skin) {
        if (skin?.isCurrentSetup) {
            return `Currently applied - ${this.extractSkinBaseName(skin.name)}`;
        }

        return skin?.isImported ? `${skin.name} (imported)` : skin?.name || "Unnamed skin";
    }

    showSkin() {
        if (!this.currentSkin) {
            return;
        }

        this.renderSkinDescription();
        this.renderSelectionOverview();
        this.parkShareTools();
        this.updateExportDefaults();
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
        this.previewColumn = document.querySelector("#skinManagerPage .previewColumn");
        this.livePreviewAuto = null;
        this.livePreviewRoute = null;
        this.livePreviewItemId = null;

        this.setPreviewExpanded(false);
        this.bindCarouselEvents();
        this.bindLivePreviewEvents();
        this.setPreviewSlide(0);
        this.resetLivePreview(true);
        this.refreshLivePreview({ auto: true });
        this.placeShareTools();
    }

    parkShareTools() {
        if (!this.shareToolsElement || !this.shareParkingElement) {
            return;
        }

        if (!this.shareParkingElement.contains(this.shareToolsElement)) {
            this.shareParkingElement.appendChild(this.shareToolsElement);
        }
    }

    placeShareTools() {
        if (!this.shareToolsElement) {
            return;
        }

        if (!this.previewColumn) {
            this.parkShareTools();
            return;
        }

        const gallery = this.previewColumn.querySelector(".previewsContainer");
        if (gallery) {
            gallery.insertAdjacentElement("afterend", this.shareToolsElement);
            return;
        }

        this.previewColumn.appendChild(this.shareToolsElement);
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

        if (this.exportDownloadButton) {
            this.exportDownloadButton.addEventListener("click", () => {
                this.downloadCurrentSkinExport();
            });
        }

        if (this.exportCopyButton) {
            this.exportCopyButton.addEventListener("click", () => {
                this.copyCurrentSkinExport();
            });
        }

        if (this.importFileElement) {
            this.importFileElement.addEventListener("change", event => {
                this.handleImportFile(event);
            });
        }

        if (this.importTextElement) {
            this.importTextElement.addEventListener("input", () => {
                this.pendingImportedSkin = null;
                this.setImportStatus("Ready to import pasted JSON.", "idle");
            });
        }

        if (this.importButton) {
            this.importButton.addEventListener("click", () => {
                this.importSharedSkin();
            });
        }
    }

    updateExportDefaults() {
        if (!this.currentSkin) {
            return;
        }

        if (this.exportNameElement) {
            this.exportNameElement.value = this.getShareableSkinName(this.currentSkin);
        }

        if (this.exportDescriptionElement) {
            this.exportDescriptionElement.value = this.currentSkin.description || "";
        }

        this.setExportStatus("", "idle");
    }

    getShareableSkinName(skin) {
        const name = this.extractSkinBaseName(skin?.name || "");
        return name.replace(/\s+\(imported\)$/i, "") || "Shared skin";
    }

    createCurrentSkinExportText() {
        if (!this.currentSkin) {
            throw new Error("Select a skin before exporting.");
        }

        const exportData = this.configController.createSkinExport(this.currentSkin, {
            name: this.exportNameElement?.value,
            description: this.exportDescriptionElement?.value
        });

        return this.configController.serializeSkinExport(exportData);
    }

    downloadCurrentSkinExport() {
        try {
            const exportText = this.createCurrentSkinExportText();
            const exportName = this.exportNameElement?.value || this.currentSkin?.name || "skin";
            const filename = `${this.toSafeFilename(exportName)}.skinmanager.json`;
            const blob = new Blob([exportText], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            this.setExportStatus(`Exported as ${filename}.`, "success");
        } catch (error) {
            console.error("Unable to export skin:", error);
            this.setExportStatus(error.message || "Unable to export this skin.", "error");
        }
    }

    async copyCurrentSkinExport() {
        try {
            const exportText = this.createCurrentSkinExportText();
            await this.copyText(exportText);
            this.setExportStatus("Export JSON copied to clipboard.", "success");
        } catch (error) {
            console.error("Unable to copy skin export:", error);
            this.setExportStatus(error.message || "Unable to copy the export.", "error");
        }
    }

    async copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();

        if (!copied) {
            throw new Error("Clipboard access is not available in this browser.");
        }
    }

    handleImportFile(event) {
        const file = event?.target?.files?.[0];
        if (!file) {
            return;
        }

        if (file.size > ConfigController.MAX_IMPORT_SIZE) {
            this.setImportStatus("This file is too large to import.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || "");
            if (this.importTextElement) {
                this.importTextElement.value = text;
            }
            this.previewImport(text);
        };
        reader.onerror = () => {
            this.setImportStatus("Could not read this file.", "error");
        };
        reader.readAsText(file);
    }

    previewImport(text) {
        try {
            const result = this.configController.parseSkinExport(text);
            this.pendingImportedSkin = result.skin;
            this.setImportStatus(
                `Ready: ${result.skin.name}. Add it to presets to review it in the live preview.`,
                "success"
            );
        } catch (error) {
            this.pendingImportedSkin = null;
            this.setImportStatus(error.message || "This skin could not be imported.", "error");
        }
    }

    async importSharedSkin() {
        const text = this.importTextElement?.value || "";
        let importedSkin = this.pendingImportedSkin;

        try {
            if (!importedSkin) {
                importedSkin = this.configController.parseSkinExport(text).skin;
            }

            this.setImportStatus("Adding skin...", "idle");
            const savedSkin = await this.configController.saveImportedSkin(importedSkin);
            if (!savedSkin) {
                throw new Error("The imported skin could not be saved.");
            }

            this.insertImportedSkin(savedSkin);
            this.pendingImportedSkin = null;
            if (this.importTextElement) {
                this.importTextElement.value = "";
            }
            if (this.importFileElement) {
                this.importFileElement.value = "";
            }
            this.setImportStatus(`${savedSkin.name} added to presets. Review it before applying.`, "success");
        } catch (error) {
            console.error("Unable to import skin:", error);
            this.setImportStatus(error.message || "This skin could not be imported.", "error");
        }
    }

    insertImportedSkin(importedSkin) {
        const normalizedName = importedSkin.name.trim().toLocaleLowerCase();
        this.skins = this.skins.filter(skin => {
            const isSameImportedSkin = skin.isImported
                && skin.name.trim().toLocaleLowerCase() === normalizedName;
            return !isSameImportedSkin;
        });

        const firstSkinIsCurrentSetup = !!this.skins[0]?.isCurrentSetup
            || typeof this.skins[0]?.name === "string"
            && this.skins[0].name.startsWith("Currently applied - ");
        const insertIndex = firstSkinIsCurrentSetup ? 1 : 0;
        importedSkin.isImported = true;
        this.skins.splice(insertIndex, 0, importedSkin);
        this.populateSelect(importedSkin);
    }

    setExportStatus(message, state = "idle") {
        if (!this.exportStatusElement) {
            return;
        }

        this.exportStatusElement.textContent = message || "";
        this.exportStatusElement.dataset.state = state;
    }

    setImportStatus(message, state = "idle") {
        if (!this.importStatusElement) {
            return;
        }

        this.importStatusElement.textContent = message || "";
        this.importStatusElement.dataset.state = state;
    }

    toSafeFilename(name) {
        const safeName = String(name || "skin")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return safeName || "skin";
    }
}
