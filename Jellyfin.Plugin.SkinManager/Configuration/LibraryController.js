var LibraryController = class LibraryController {
    constructor() {
        this.configController = new ConfigController();
        this.savedSkins = [];
        this.sources = [];
        this.officialManifestStatus = null;
        this.activeSection = "saved";

        this.tabButtons = Array.from(document.querySelectorAll("#libraryPage .libraryTab"));
        this.sections = Array.from(document.querySelectorAll("#libraryPage .libraryPanel"));

        this.savedSkinsListElement = document.getElementById("librarySavedSkinsList");
        this.savedSkinsCountElement = document.getElementById("librarySavedSkinsCount");
        this.importFileElement = document.getElementById("libraryImportFile");
        this.importTextElement = document.getElementById("libraryImportText");
        this.importButton = document.getElementById("libraryImportButton");
        this.importStatusElement = document.getElementById("libraryImportStatus");

        this.sourcesListElement = document.getElementById("librarySourcesList");
        this.sourcesCountElement = document.getElementById("librarySourcesCount");
        this.sourcesRefreshButton = document.getElementById("librarySourcesRefresh");
        this.sourceNameElement = document.getElementById("librarySourceName");
        this.sourceUrlElement = document.getElementById("librarySourceUrl");
        this.sourceAddButton = document.getElementById("librarySourceAdd");
        this.sourceStatusElement = document.getElementById("librarySourceStatus");
        this.officialSourceElement = document.getElementById("libraryOfficialSource");
        this.officialUrlElement = document.getElementById("libraryOfficialUrl");
        this.officialHealthElement = document.getElementById("libraryOfficialHealth");
        this.officialDescriptionElement = document.getElementById("libraryOfficialDescription");
        this.officialRefreshButton = document.getElementById("libraryOfficialRefresh");
    }

    async init() {
        this.bindEvents();
        this.setActiveSection(this.activeSection);

        try {
            const [savedSkins, sources, officialManifestStatus] = await Promise.all([
                this.configController.loadImportedSkins(),
                this.configController.loadSkinSources(),
                this.configController.loadOfficialManifestStatus()
            ]);

            this.savedSkins = savedSkins;
            this.sources = sources;
            this.officialManifestStatus = officialManifestStatus;
            this.renderAll();
            await this.refreshEnabledSources({ silent: true });
        } catch (error) {
            console.error("Error loading library:", error);
            this.setImportStatus(error.message || "Unable to load library.", "error");
        }
    }

    bindEvents() {
        this.tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                this.setActiveSection(button.dataset.section || "saved");
            });
        });

        if (this.importFileElement) {
            this.importFileElement.addEventListener("change", event => this.handleImportFile(event));
        }

        if (this.importTextElement) {
            this.importTextElement.addEventListener("input", () => {
                this.setImportStatus("Ready to import pasted JSON.", "idle");
            });
        }

        if (this.importButton) {
            this.importButton.addEventListener("click", () => {
                this.importSharedSkin();
            });
        }

        if (this.sourceAddButton) {
            this.sourceAddButton.addEventListener("click", () => {
                this.addSource();
            });
        }

        if (this.sourcesRefreshButton) {
            this.sourcesRefreshButton.addEventListener("click", () => {
                this.refreshEnabledSources();
            });
        }

        if (this.officialRefreshButton) {
            this.officialRefreshButton.addEventListener("click", () => {
                this.refreshOfficialManifest();
            });
        }
    }

    setActiveSection(sectionName) {
        this.activeSection = sectionName;

        this.tabButtons.forEach(button => {
            const isActive = button.dataset.section === sectionName;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        this.sections.forEach(section => {
            section.hidden = section.dataset.section !== sectionName;
        });
    }

    renderAll() {
        this.renderSavedSkins();
        this.renderOfficialSource();
        this.renderSources();
    }

    renderSavedSkins() {
        if (!this.savedSkinsListElement) {
            return;
        }

        this.clearElement(this.savedSkinsListElement);

        if (this.savedSkinsCountElement) {
            this.savedSkinsCountElement.textContent = `${this.savedSkins.length} skins`;
        }

        if (!this.savedSkins.length) {
            this.savedSkinsListElement.appendChild(this.createEmptyState("No saved skins yet."));
            return;
        }

        this.savedSkins
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(skin => {
                this.savedSkinsListElement.appendChild(this.createSavedSkinRow(skin));
            });
    }

    createSavedSkinRow(skin) {
        const row = this.createElement("div", "libraryListRow");
        const body = this.createElement("div", "libraryListBody");
        const title = this.createElement("div", "libraryListTitle", skin.name || "Unnamed skin");
        const meta = this.createElement("div", "libraryListMeta", "Saved skin");
        const description = this.createElement("div", "libraryListDescription", skin.description || "No description.");
        const actions = this.createElement("div", "libraryListActions");

        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(description);
        actions.appendChild(this.createActionButton("Export", () => this.downloadSkinExport(skin)));
        actions.appendChild(this.createActionButton("Delete", () => this.deleteSavedSkin(skin)));

        row.appendChild(body);
        row.appendChild(actions);
        return row;
    }

    async deleteSavedSkin(skin) {
        if (!skin || !skin.name) {
            return;
        }

        if (window.confirm && !window.confirm(`Delete ${skin.name}?`)) {
            return;
        }

        try {
            await this.configController.deleteImportedSkin(skin.name);
            this.savedSkins = await this.configController.loadImportedSkins();
            this.renderSavedSkins();
            this.setImportStatus(`${skin.name} deleted.`, "success");
        } catch (error) {
            console.error("Unable to delete saved skin:", error);
            this.setImportStatus(error.message || "Unable to delete this skin.", "error");
        }
    }

    downloadSkinExport(skin) {
        try {
            const exportData = this.configController.createSkinExport(skin, {
                name: skin.name,
                description: skin.description
            });
            const exportText = this.configController.serializeSkinExport(exportData);
            const filename = `${this.toSafeFilename(skin.name)}.skinmanager.json`;
            const blob = new Blob([exportText], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Unable to export skin:", error);
            this.setImportStatus(error.message || "Unable to export this skin.", "error");
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
            this.setImportStatus(`Ready: ${result.skin.name}.`, "success");
        } catch (error) {
            this.setImportStatus(error.message || "This skin could not be imported.", "error");
        }
    }

    async importSharedSkin() {
        const text = this.importTextElement?.value || "";

        try {
            const importedSkin = this.configController.parseSkinExport(text).skin;
            const savedSkin = await this.configController.saveImportedSkin(importedSkin);
            this.savedSkins = await this.configController.loadImportedSkins();
            if (this.importTextElement) {
                this.importTextElement.value = "";
            }
            if (this.importFileElement) {
                this.importFileElement.value = "";
            }
            this.renderSavedSkins();
            this.setImportStatus(`${savedSkin.name} added to Saved Skins.`, "success");
        } catch (error) {
            console.error("Unable to import skin:", error);
            this.setImportStatus(error.message || "This skin could not be imported.", "error");
        }
    }

    async addSource() {
        try {
            const source = await this.configController.addSkinSource({
                name: this.sourceNameElement?.value,
                url: this.sourceUrlElement?.value
            });
            this.sources = await this.configController.loadSkinSources();
            if (this.sourceNameElement) {
                this.sourceNameElement.value = "";
            }
            if (this.sourceUrlElement) {
                this.sourceUrlElement.value = "";
            }
            this.renderSources();
            this.setSourceStatus(`${source.name} added.`, "success");
            await this.refreshSource(source);
        } catch (error) {
            console.error("Unable to add source:", error);
            this.setSourceStatus(error.message || "Unable to add this source.", "error");
        }
    }

    renderSources() {
        if (!this.sourcesListElement) {
            return;
        }

        this.clearElement(this.sourcesListElement);

        if (this.sourcesCountElement) {
            this.sourcesCountElement.textContent = `${this.sources.length} sources`;
        }

        if (!this.sources.length) {
            this.sourcesListElement.appendChild(this.createEmptyState("No manifest sources yet."));
            return;
        }

        this.sources.forEach(source => {
            this.sourcesListElement.appendChild(this.createSourceRow(source));
        });
    }

    renderOfficialSource() {
        if (!this.officialSourceElement) {
            return;
        }

        const status = this.officialManifestStatus || {};
        this.officialSourceElement.dataset.state = status.status || "idle";

        if (this.officialUrlElement) {
            this.officialUrlElement.textContent = status.url || ConfigController.OFFICIAL_MANIFEST_URL;
        }

        if (this.officialHealthElement) {
            this.officialHealthElement.textContent = this.getOfficialHealth(status);
        }

        if (this.officialDescriptionElement) {
            this.officialDescriptionElement.textContent = this.getOfficialDescription(status);
        }
    }

    getOfficialHealth(status) {
        const loadMode = this.cleanText(status.loadMode);
        const parts = [];

        if (status.status === "ok" && loadMode === "remote") {
            parts.push("Remote OK");
        } else if (loadMode === "cache") {
            parts.push("Using cache");
        } else if (loadMode === "backup") {
            parts.push("Using backup");
        } else if (status.status === "error") {
            parts.push("Error");
        } else {
            parts.push("Not checked");
        }

        parts.push(`${status.skinCount || 0} skins`);

        if (status.lastCheckedAt) {
            parts.push(`checked ${this.formatDate(status.lastCheckedAt)}`);
        }

        return parts.join(" - ");
    }

    getOfficialDescription(status) {
        if (status.message) {
            return status.message;
        }

        if (status.cachedAt) {
            return `Cache saved ${this.formatDate(status.cachedAt)}.`;
        }

        return "No cached catalog yet.";
    }

    createSourceRow(source) {
        const row = this.createElement("div", "libraryListRow librarySourceRow");
        const body = this.createElement("div", "libraryListBody");
        const title = this.createElement("div", "libraryListTitle", source.name);
        const url = this.createElement("div", "libraryListMeta", source.url);
        const health = this.createElement("div", "librarySourceHealth", this.getSourceHealth(source));
        const description = this.createElement("div", "libraryListDescription", this.getSourceDescription(source));
        const actions = this.createElement("div", "libraryListActions");

        body.appendChild(title);
        body.appendChild(url);
        body.appendChild(health);
        body.appendChild(description);
        actions.appendChild(this.createActionButton(source.enabled ? "Disable" : "Enable", () => this.toggleSource(source)));
        actions.appendChild(this.createActionButton("Refresh", () => this.refreshSource(source)));
        actions.appendChild(this.createActionButton("Remove", () => this.removeSource(source)));

        row.dataset.state = source.enabled === false ? "disabled" : source.status || "idle";
        row.appendChild(body);
        row.appendChild(actions);
        return row;
    }

    getSourceHealth(source) {
        const parts = [source.enabled === false ? "Disabled" : "Enabled"];
        const status = this.cleanText(source.status);

        if (status === "ok") {
            parts.push("OK");
        } else if (status === "error") {
            parts.push("Error");
        } else {
            parts.push("Not checked");
        }

        parts.push(`${source.skinCount || 0} skins`);

        if (source.lastCheckedAt) {
            parts.push(`checked ${this.formatDate(source.lastCheckedAt)}`);
        }

        return parts.join(" - ");
    }

    getSourceDescription(source) {
        if (source.message) {
            return source.message;
        }

        if (source.manifestDescription) {
            return source.manifestDescription;
        }

        if (source.manifestName && source.manifestName !== source.name) {
            return `Manifest: ${source.manifestName}`;
        }

        return "No manifest metadata yet.";
    }

    async toggleSource(source) {
        await this.configController.updateSkinSource(source.id, { enabled: !source.enabled });
        this.sources = await this.configController.loadSkinSources();
        this.renderSources();
    }

    async removeSource(source) {
        if (window.confirm && !window.confirm(`Remove ${source.name}?`)) {
            return;
        }

        await this.configController.removeSkinSource(source.id);
        this.sources = await this.configController.loadSkinSources();
        this.renderSources();
    }

    async refreshEnabledSources({ silent = false } = {}) {
        const enabledSources = this.sources.filter(source => source.enabled !== false);
        if (!enabledSources.length) {
            if (!silent) {
                this.setSourceStatus("No enabled sources.", "idle");
            }
            return;
        }

        if (!silent) {
            this.setSourceStatus("Refreshing enabled sources...", "idle");
        }

        for (const source of enabledSources) {
            await this.refreshSource(source, { render: false });
        }

        this.sources = await this.configController.loadSkinSources();
        this.renderSources();
        if (!silent) {
            this.setSourceStatus("Sources refreshed.", "success");
        }
    }

    async refreshOfficialManifest() {
        try {
            this.setSourceStatus("Refreshing official manifest...", "idle");
            const manifest = await this.configController.loadOfficialSkinManifest(ConfigController.DEFAULT_BACKUP_MANIFEST_URL);
            this.officialManifestStatus = await this.configController.loadOfficialManifestStatus();
            this.renderOfficialSource();

            const state = manifest.loadMode === "remote" ? "success" : "idle";
            this.setSourceStatus(this.getOfficialRefreshMessage(manifest), state);
        } catch (error) {
            console.error("Unable to refresh official manifest:", error);
            this.officialManifestStatus = await this.configController.loadOfficialManifestStatus();
            this.renderOfficialSource();
            this.setSourceStatus(error.message || "Unable to refresh the official manifest.", "error");
        }
    }

    getOfficialRefreshMessage(manifest) {
        if (manifest.loadMode === "remote") {
            return "Official manifest refreshed.";
        }

        if (manifest.loadMode === "cache") {
            return "Remote unavailable. Cached catalog loaded.";
        }

        if (manifest.loadMode === "backup") {
            return "Remote unavailable. Bundled backup loaded.";
        }

        return "Official manifest checked.";
    }

    async refreshSource(source, { render = true } = {}) {
        try {
            const manifest = await this.configController.fetchSkinSource(source);
            await this.configController.updateSkinSource(source.id, {
                status: "ok",
                message: "",
                lastCheckedAt: new Date().toISOString(),
                skinCount: manifest.skins.length,
                manifestName: manifest.sourceName,
                manifestDescription: manifest.sourceDescription
            });
        } catch (error) {
            console.error("Unable to refresh source:", error);
            await this.configController.updateSkinSource(source.id, {
                status: "error",
                message: error.message || "Unable to refresh.",
                lastCheckedAt: new Date().toISOString(),
                skinCount: 0
            });
        }

        this.sources = await this.configController.loadSkinSources();
        if (render) {
            this.renderSources();
        }
    }

    createActionButton(label, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "libraryActionButton";
        button.textContent = label;
        button.addEventListener("click", onClick);
        return button;
    }

    createEmptyState(message) {
        return this.createElement("div", "libraryEmptyState", message);
    }

    createElement(tagName, className = "", text = "") {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (text) {
            element.textContent = text;
        }
        return element;
    }

    clearElement(element) {
        while (element && element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    setImportStatus(message, state = "idle") {
        this.setStatus(this.importStatusElement, message, state);
    }

    setSourceStatus(message, state = "idle") {
        this.setStatus(this.sourceStatusElement, message, state);
    }

    setStatus(element, message, state = "idle") {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.dataset.state = state;
    }

    cleanText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    formatDate(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    }

    toSafeFilename(name) {
        const safeName = String(name || "skin")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return safeName || "skin";
    }
};

window.LibraryController = LibraryController;
