var HistoryController = class HistoryController {
    constructor() {
        this.configController = new ConfigController();
        this.history = [];
        this.currentSkin = null;
        this.userCssHistory = [];
        this.currentCss = null;

        this.selectElement = document.getElementById("cssOptions-history");
        this.optionsElement = document.getElementById("options-history");
        this.setSkinButton = document.getElementById("setSkin-history");
        this.setSkinButtonLabel = this.setSkinButton ? this.setSkinButton.querySelector("span") : null;

        this.cssContainerElement = document.getElementById("cssHistoryContainer");
        this.cssSelectElement = document.getElementById("cssHistorySelect");
        this.cssMetaElement = document.getElementById("cssHistoryMeta");
        this.cssCodeElement = document.getElementById("cssHistoryCode");
        this.cssEmptyElement = document.getElementById("cssHistoryEmpty");
        this.restoreCssButton = document.getElementById("restoreCssButton");

        this.historySelectedSkinElement = document.getElementById("historySelectedSkin");
        this.historySelectedSkinHintElement = document.getElementById("historySelectedSkinHint");
    }

    async init() {
        console.log("HistoryController initialized");
        this.history = await this.configController.loadHistorySkins();
        this.populateSelect();
        this.initEventListeners();

        await this.loadUserCssHistory();
        this.renderCssHistory();
        this.initCssEventListeners();
        this.renderOverview();
    }

    extractSkinBaseName(name) {
        return this.configController.getSkinBaseName(name, "unknown");
    }

    setApplyButtonState({ busy = false, disabled = false } = {}) {
        if (!this.setSkinButton) {
            return;
        }

        const isDisabled = busy || disabled || !this.currentSkin;
        this.setSkinButton.disabled = isDisabled;

        if (this.setSkinButtonLabel) {
            this.setSkinButtonLabel.textContent = busy
                ? "Restoring..."
                : "Restore selected skin";
        }
    }

    setSnapshotMode(enabled) {
        if (!this.optionsElement) {
            return;
        }

        this.optionsElement.classList.toggle("historySnapshot", enabled);
        this.optionsElement.dataset.mode = enabled ? "snapshot" : "empty";

        if (!enabled) {
            return;
        }

        this.optionsElement.querySelectorAll("select, input, textarea, button").forEach(element => {
            element.disabled = true;
            element.tabIndex = -1;
            element.setAttribute("aria-readonly", "true");
        });
    }

    renderOverview() {
        if (this.historySelectedSkinElement) {
            this.historySelectedSkinElement.textContent = this.currentSkin
                ? this.extractSkinBaseName(this.currentSkin.name)
                : "No applied skins yet";
        }

        if (this.historySelectedSkinHintElement) {
            this.historySelectedSkinHintElement.textContent = this.currentSkin
                ? "Read-only snapshot of the skin that will be restored."
                : "Apply a skin from the main tab and it will be saved here automatically.";
        }

    }

    populateSelect() {
        this.selectElement.innerHTML = "";
        this.history.forEach((skin, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = skin.name;
            this.selectElement.appendChild(option);
        });

        if (this.history.length > 0) {
            this.selectElement.value = 0;
            this.currentSkin = this.history[0];
            this.showSkin();
            this.setApplyButtonState();
            return;
        }

        this.optionsElement.innerHTML = '<div class="historyDetailEmpty">No applied skins saved yet.</div>';
        this.setSnapshotMode(false);
        this.currentSkin = null;
        this.renderOverview();
        this.setApplyButtonState({ disabled: true });
    }

    showSkin() {
        if (!this.currentSkin) {
            this.optionsElement.innerHTML = "";
            this.setSnapshotMode(false);
            this.renderOverview();
            return;
        }

        this.optionsElement.innerHTML = this.currentSkin.generateHTML({
            includePreview: false,
            includeLivePreview: false,
            context: "history"
        });
        this.currentSkin.attachEventListeners();
        this.setSnapshotMode(true);
        this.renderOverview();
    }

    changeSkin() {
        const selectedIndex = parseInt(this.selectElement.value, 10);
        if (Number.isNaN(selectedIndex) || !this.history[selectedIndex]) {
            return;
        }

        this.currentSkin = this.history[selectedIndex];
        this.showSkin();
        this.setApplyButtonState();
        console.log(`Skin changed to: ${this.currentSkin.name}`);
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
            console.error("Error applying skin from history:", error);
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

    async loadUserCssHistory() {
        try {
            const history = await this.configController.loadUserCssHistory();
            this.userCssHistory = (history || [])
                .filter(entry => entry && typeof entry.css === "string")
                .map(entry => ({
                    ...entry,
                    id: entry.id ? String(entry.id) : this.generateEntryId(entry)
                }))
                .sort((a, b) => {
                    const dateA = new Date(a.savedAt || 0).getTime();
                    const dateB = new Date(b.savedAt || 0).getTime();
                    return dateB - dateA;
                });
        } catch (error) {
            console.error("Error loading user CSS history:", error);
            this.userCssHistory = [];
        }
    }

    renderCssHistory() {
        if (!this.cssSelectElement) {
            return;
        }

        this.cssSelectElement.innerHTML = "";

        if (!this.userCssHistory.length) {
            this.cssSelectElement.disabled = true;
            this.updateCssContainerState(true);
            if (this.cssEmptyElement) {
                this.cssEmptyElement.textContent = "No saved custom CSS yet.";
            }
            this.clearCssDetail();
            this.renderOverview();
            return;
        }

        this.cssSelectElement.disabled = false;
        this.userCssHistory.forEach(entry => {
            const option = document.createElement("option");
            option.value = String(entry.id);
            option.textContent = this.buildCssListLabel(entry);
            this.cssSelectElement.appendChild(option);
        });

        const firstEntryId = String(this.userCssHistory[0].id);
        this.cssSelectElement.value = firstEntryId;
        this.selectCssEntry(firstEntryId);
        this.renderOverview();
    }

    generateEntryId(entry) {
        if (entry.savedAt) {
            return `user-css-${entry.savedAt}`;
        }
        return `user-css-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    buildCssListLabel(entry) {
        const formattedDate = this.formatDate(entry.savedAt);
        return formattedDate ? `Saved on ${formattedDate}` : "Custom CSS backup";
    }

    buildCssDetailMeta(entry) {
        if (!entry.savedAt) {
            return "";
        }
        return `Saved before a skin replaced your custom CSS on ${this.formatDate(entry.savedAt)}`;
    }

    formatDate(isoString) {
        if (!isoString) {
            return "";
        }

        try {
            const date = new Date(isoString);
            if (Number.isNaN(date.getTime())) {
                return isoString;
            }
            return date.toLocaleString();
        } catch (error) {
            console.warn("Unable to format date", error);
            return isoString;
        }
    }

    selectCssEntry(id) {
        const normalizedId = String(id);
        const entry = this.userCssHistory.find(item => String(item.id) === normalizedId);
        if (!entry) {
            this.clearCssDetail();
            return;
        }

        this.currentCss = entry;
        this.updateCssContainerState(false);

        if (this.cssSelectElement && this.cssSelectElement.value !== normalizedId) {
            this.cssSelectElement.value = normalizedId;
        }

        const metaText = this.buildCssDetailMeta(entry);
        if (this.cssMetaElement) {
            this.cssMetaElement.textContent = metaText;
            this.cssMetaElement.style.display = metaText ? "block" : "none";
        }

        if (this.cssCodeElement) {
            this.cssCodeElement.textContent = entry.css || "";
        }

        if (this.cssEmptyElement) {
            this.cssEmptyElement.textContent = "Select a saved custom CSS backup to inspect it.";
        }

        this.toggleRestoreButton(true);
    }

    clearCssDetail() {
        this.currentCss = null;
        const hasEntries = this.userCssHistory.length > 0;
        this.updateCssContainerState(!hasEntries);

        if (this.cssMetaElement) {
            this.cssMetaElement.textContent = "";
            this.cssMetaElement.style.display = "none";
        }

        if (this.cssCodeElement) {
            this.cssCodeElement.textContent = "";
        }

        if (this.cssSelectElement) {
            if (hasEntries) {
                this.cssSelectElement.disabled = false;
            } else {
                this.cssSelectElement.disabled = true;
                this.cssSelectElement.value = "";
            }
        }

        if (this.cssEmptyElement) {
            this.cssEmptyElement.textContent = hasEntries
                ? "Select a saved custom CSS backup to inspect it."
                : "No saved custom CSS yet.";
        }

        this.toggleRestoreButton(false);
    }

    updateCssContainerState(isEmpty) {
        if (this.cssContainerElement) {
            this.cssContainerElement.dataset.empty = isEmpty ? "true" : "false";
        }
    }

    toggleRestoreButton(enabled) {
        if (!this.restoreCssButton) {
            return;
        }

        if (this.restoreCssButton.dataset.restoreState === "working") {
            return;
        }

        this.restoreCssButton.disabled = !enabled;
    }

    initCssEventListeners() {
        if (this.cssSelectElement) {
            this.cssSelectElement.addEventListener("change", event => {
                const selectedId = event.target.value;
                this.selectCssEntry(selectedId);
            });
        }

        if (this.restoreCssButton) {
            this.restoreCssButton.addEventListener("click", () => {
                this.restoreCurrentCss();
            });
        }
    }

    async restoreCurrentCss() {
        if (!this.currentCss) {
            return;
        }

        this.showRestoreProgress();

        try {
            await this.applyCssToServer(this.currentCss.css);
        } catch (error) {
            console.error("Unable to restore CSS", error);
            this.showRestoreIdle();
        }
    }

    async applyCssToServer(css) {
        const serverConfig = await ApiClient.getServerConfiguration();
        await ApiClient.updateServerConfiguration(serverConfig);

        const brandingConfig = await ApiClient.getNamedConfiguration("branding");
        brandingConfig.CustomCss = css;
        await ApiClient.updateNamedConfiguration("branding", brandingConfig);

        Dashboard.processServerConfigurationUpdateResult();
        window.location.reload(true);
    }

    showRestoreProgress() {
        if (!this.restoreCssButton) {
            return;
        }

        const label = this.restoreCssButton.querySelector("span");
        const originalText = label ? label.textContent : this.restoreCssButton.textContent;

        if (label) {
            label.dataset.originalText = originalText;
            label.textContent = "Restoring...";
        } else {
            this.restoreCssButton.dataset.originalText = originalText;
            this.restoreCssButton.textContent = "Restoring...";
        }

        this.restoreCssButton.dataset.restoreState = "working";
        this.restoreCssButton.disabled = true;
    }

    showRestoreIdle() {
        if (!this.restoreCssButton) {
            return;
        }

        const label = this.restoreCssButton.querySelector("span");
        const originalText = label ? label.dataset.originalText : this.restoreCssButton.dataset.originalText;

        if (label && originalText) {
            label.textContent = originalText;
            delete label.dataset.originalText;
        } else if (originalText) {
            this.restoreCssButton.textContent = originalText;
            delete this.restoreCssButton.dataset.originalText;
        }

        delete this.restoreCssButton.dataset.restoreState;
        this.restoreCssButton.disabled = !this.currentCss;
    }
};

window.HistoryController = HistoryController;
