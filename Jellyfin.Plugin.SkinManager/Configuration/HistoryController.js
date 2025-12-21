class HistoryController {
    constructor() {
        // Initialize ConfigController to handle skin serialization
        this.configController = new ConfigController();

        // Array to keep track of the history of saved skins
        this.history = [];
        this.currentSkin = null;
        this.userCssHistory = [];
        this.currentCss = null;

        this.selectElement = document.getElementById("cssOptions-history");
        this.optionsElement = document.getElementById("options-history");
        this.setSkinButton = document.getElementById("setSkin-history");

        this.cssContainerElement = document.getElementById("cssHistoryContainer");
        this.cssSelectElement = document.getElementById("cssHistorySelect");
        this.cssMetaElement = document.getElementById("cssHistoryMeta");
        this.cssCodeElement = document.getElementById("cssHistoryCode");
        this.cssEmptyElement = document.getElementById("cssHistoryEmpty");
        this.restoreCssButton = document.getElementById("restoreCssButton");
    }

    // Initialize history controller logic
    async init() {
        console.log("HistoryController initialized");
        this.history = await this.configController.loadHistorySkins();
        this.populateSelect();
        this.initEventListeners();

        await this.loadUserCssHistory();
        this.renderCssHistory();
        this.initCssEventListeners();
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
        }
    }

    showSkin() {
        this.optionsElement.innerHTML = this.currentSkin.generateHTML({ includePreview: false });
        this.currentSkin.attachEventListeners();
    }

    changeSkin() {
        const selectedIndex = this.selectElement.value;
        this.currentSkin = this.history[selectedIndex];
        this.showSkin();
        console.log(`Skin changed to: ${this.currentSkin.name}`);
    }

    initEventListeners() {
        this.setSkinButton.addEventListener('click', () => {
            if (this.currentSkin) {
                this.applyCurrentSkin();
            }
        });

        this.selectElement.addEventListener('change', () => {
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
                this.cssEmptyElement.textContent = "No saved CSS yet.";
            }
            this.clearCssDetail();
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
    }

    generateEntryId(entry) {
        if (entry.savedAt) {
            return `user-css-${entry.savedAt}`;
        }
        return `user-css-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    buildCssListLabel(entry) {
        const formattedDate = this.formatDate(entry.savedAt);
        return formattedDate ? `Saved on ${formattedDate}` : "Saved CSS";
    }

    buildCssDetailMeta(entry) {
        if (!entry.savedAt) {
            return "";
        }
        return `Saved on ${this.formatDate(entry.savedAt)}`;
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
            this.cssEmptyElement.textContent = "Select a revision to inspect its content.";
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
                ? "Select a revision to inspect its content."
                : "No saved CSS yet.";
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
}
