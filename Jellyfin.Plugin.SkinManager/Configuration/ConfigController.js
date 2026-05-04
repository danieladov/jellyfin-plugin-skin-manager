var ConfigController = window.ConfigController || class ConfigController {
    static MAX_SKIN_HISTORY = 25;
    static MAX_USER_CSS_HISTORY = 25;
    static MAX_IMPORTED_SKINS = 50;
    static EXPORT_SCHEMA = "jellyfin-skin-manager-export/v1";
    static MAX_IMPORT_SIZE = 2 * 1024 * 1024;

    constructor() {
        console.log("ConfigController initialized");
        this.pluginId = "e9ca8b8e-ca6d-40e7-85dc-58e536df8eb3";
        this.MANAGED_CSS_MARKER = "/* Skin Manager CSS */";
    }

    async saveSkin(skin) {
        if (!skin) {
            return "";
        }

        const historyEntry = this.createHistorySkinEntry(skin);
        console.log("Saving skin:", historyEntry);
        const config = await this.getPluginConfiguration();
        const serialized = this.serializeSkin(historyEntry);
        if (serialized) {
            config.skinHistory.push(serialized);
            config.skinHistory = this.trimHistory(config.skinHistory, ConfigController.MAX_SKIN_HISTORY);
        }
        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
        return historyEntry.name || "";
    }

    async loadHistorySkins() {
        const config = await this.getPluginConfiguration();
        return [...config.skinHistory]
            .reverse()
            .map(s => this.deserializeSkin(s))
            .filter(Boolean);
    }

    async loadImportedSkins() {
        const config = await this.getPluginConfiguration();
        return [...config.importedSkins]
            .reverse()
            .map(entry => this.deserializeSkin(entry))
            .filter(Boolean)
            .map(skin => {
                skin.isImported = true;
                return skin;
            });
    }

    async saveImportedSkin(skin) {
        if (!skin) {
            return null;
        }

        const plainSkin = this.toPlainSkin(skin);
        const importedSkin = new Skin(plainSkin);
        importedSkin.isImported = true;

        const config = await this.getPluginConfiguration();
        const importedName = importedSkin.name.trim().toLocaleLowerCase();

        config.importedSkins = config.importedSkins
            .map(entry => this.deserializeSkin(entry))
            .filter(existingSkin => existingSkin && existingSkin.name.trim().toLocaleLowerCase() !== importedName)
            .map(existingSkin => this.serializeSkin(this.toPlainSkin(existingSkin)))
            .filter(Boolean);

        const serialized = this.serializeSkin(importedSkin);
        if (serialized) {
            config.importedSkins.push(serialized);
            config.importedSkins = this.trimHistory(config.importedSkins, ConfigController.MAX_IMPORTED_SKINS);
        }

        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
        return importedSkin;
    }

    serializeSkin(skin) {
        try {
            // Convert the skin object into a JSON string
            return JSON.stringify(skin);
        } catch (error) {
            console.error("Error serializing the skin:", error);
            return null;
        }
    }


    deserializeSkin(serializedSkin) {
        try {
            // Parse the JSON string back into a JavaScript object
            const skinData = JSON.parse(serializedSkin);

            return new Skin(skinData);
        } catch (error) {
            console.error("Error parsing the skin data:", error);
            return null;
        }
    }

    async saveUserCss(css) {
        if (!css || !css.trim()) {
            return;
        }

        const config = await this.getPluginConfiguration();

        const existingHistory = config.userCssHistory
            .map(entry => this.deserializeUserCssEntry(entry))
            .filter(Boolean);

        const lastEntry = existingHistory[existingHistory.length - 1];
        if (lastEntry && lastEntry.css === css) {
            return;
        }

        const cssEntry = this.createUserCssEntry(css);
        const serialized = this.serializeUserCssEntry(cssEntry);
        if (serialized) {
            config.userCssHistory.push(serialized);
            config.userCssHistory = this.trimHistory(config.userCssHistory, ConfigController.MAX_USER_CSS_HISTORY);
        }
        await ApiClient.updatePluginConfiguration(this.pluginId, config);
    }

    async loadUserCssHistory() {
        const config = await this.getPluginConfiguration();
        return config.userCssHistory
            .map(entry => this.deserializeUserCssEntry(entry))
            .filter(Boolean);
    }

    serializeUserCssEntry(entry) {
        try {
            return JSON.stringify(entry);
        } catch (error) {
            console.error("Error serializing user CSS entry:", error);
            return null;
        }
    }

    deserializeUserCssEntry(serializedEntry) {
        if (!serializedEntry) {
            return null;
        }

        try {
            return JSON.parse(serializedEntry);
        } catch (error) {
            console.error("Error parsing user CSS entry:", error);
            return null;
        }
    }

    createUserCssEntry(css) {
        const now = new Date().toISOString();
        const id = this.generateId();

        return {
            id,
            css,
            savedAt: now
        };
    }

    generateId() {
        if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `user-css-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    }

    async getPluginConfiguration() {
        const config = await ApiClient.getPluginConfiguration(this.pluginId) || {};
        if (typeof config.selectedSkin !== "string") {
            config.selectedSkin = "";
        }
        if (!Array.isArray(config.skinHistory)) {
            config.skinHistory = [];
        }
        if (!Array.isArray(config.userCssHistory)) {
            config.userCssHistory = [];
        }
        if (!Array.isArray(config.importedSkins)) {
            config.importedSkins = [];
        }
        return config;
    }

    createSkinExport(skin, { name, description } = {}) {
        if (!skin) {
            throw new Error("No skin selected to export.");
        }

        const plainSkin = this.toPlainSkin(skin);
        const exportName = this.cleanText(name) || this.cleanText(plainSkin.name) || "Shared skin";
        const exportDescription = this.cleanText(description) || this.cleanText(plainSkin.description);

        plainSkin.name = exportName;
        plainSkin.description = exportDescription;

        const exportSkin = new Skin(plainSkin);

        return {
            schema: ConfigController.EXPORT_SCHEMA,
            version: 1,
            exportedAt: new Date().toISOString(),
            name: exportName,
            description: exportDescription,
            skin: this.toPlainSkin(exportSkin),
            compiledCss: exportSkin.generateCSS(),
            source: {
                plugin: "SkinManager",
                baseSkin: this.cleanText(skin.name)
            }
        };
    }

    serializeSkinExport(exportData) {
        return JSON.stringify(exportData, null, 2);
    }

    parseSkinExport(input) {
        const raw = typeof input === "string" ? input.trim() : input;
        if (!raw) {
            throw new Error("Paste a Skin Manager export or choose a JSON file.");
        }

        if (typeof raw === "string" && raw.length > ConfigController.MAX_IMPORT_SIZE) {
            throw new Error("This file is too large to import.");
        }

        let data = raw;
        if (typeof raw === "string") {
            try {
                data = JSON.parse(raw);
            } catch (error) {
                throw new Error("This is not valid JSON.");
            }
        }

        const skinData = this.extractImportedSkinData(data);
        this.validateImportedSkinData(skinData);

        const skin = new Skin(skinData);
        skin.isImported = true;
        return {
            skin,
            payload: data,
            schema: typeof data?.schema === "string" ? data.schema : "raw-skin"
        };
    }

    extractImportedSkinData(data) {
        if (!data || typeof data !== "object") {
            throw new Error("This file is not a Skin Manager export.");
        }

        if (data.schema === ConfigController.EXPORT_SCHEMA && data.skin && typeof data.skin === "object") {
            const skinData = this.toPlainSkin(data.skin);
            skinData.name = this.cleanText(skinData.name) || this.cleanText(data.name) || "Imported skin";
            skinData.description = this.cleanText(skinData.description) || this.cleanText(data.description);
            if (!this.cleanText(skinData.css) && this.cleanText(data.compiledCss)) {
                skinData.css = data.compiledCss;
            }
            return skinData;
        }

        if (data.skin && typeof data.skin === "object") {
            const skinData = this.toPlainSkin(data.skin);
            skinData.name = this.cleanText(skinData.name) || this.cleanText(data.name) || "Imported skin";
            skinData.description = this.cleanText(skinData.description) || this.cleanText(data.description);
            if (!this.cleanText(skinData.css) && this.cleanText(data.compiledCss)) {
                skinData.css = data.compiledCss;
            }
            return skinData;
        }

        if (typeof data.name === "string" && (Array.isArray(data.categories) || typeof data.css === "string")) {
            return this.toPlainSkin(data);
        }

        throw new Error("This JSON does not contain a skin.");
    }

    validateImportedSkinData(skinData) {
        if (!skinData || typeof skinData !== "object") {
            throw new Error("This file does not contain a valid skin.");
        }

        if (!this.cleanText(skinData.name)) {
            throw new Error("The imported skin needs a name.");
        }

        if (!Array.isArray(skinData.categories)) {
            skinData.categories = [];
        }

        if (typeof skinData.css !== "string") {
            skinData.css = "";
        }

        if (!skinData.css.trim() && skinData.categories.length === 0) {
            throw new Error("The imported skin does not include CSS or editable options.");
        }
    }

    createHistorySkinEntry(skin) {
        const plainSkin = this.toPlainSkin(skin);
        const originalName = this.getSkinBaseName(plainSkin.name, "Unnamed skin");
        delete plainSkin.isCurrentSetup;

        return {
            ...plainSkin,
            name: `${new Date().toLocaleString()} - ${originalName}`
        };
    }

    getSkinBaseName(name, fallback = "unknown") {
        let baseName = typeof name === "string" ? name.trim() : "";
        const historyPrefixPattern = /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}[^-]*-\s*/;
        const currentPrefixPattern = /^Currently applied\s*-\s*/i;

        while (historyPrefixPattern.test(baseName)) {
            baseName = baseName.replace(historyPrefixPattern, "").trim();
        }

        while (currentPrefixPattern.test(baseName)) {
            baseName = baseName.replace(currentPrefixPattern, "").trim();
        }

        return baseName || fallback;
    }

    toPlainSkin(skin) {
        try {
            return JSON.parse(JSON.stringify(skin));
        } catch (error) {
            console.error("Error cloning the skin data:", error);
            return skin;
        }
    }

    trimHistory(history, maxEntries) {
        if (!Array.isArray(history)) {
            return [];
        }

        if (!Number.isInteger(maxEntries) || maxEntries <= 0) {
            return history;
        }

        return history.slice(-maxEntries);
    }

    async setSelectedSkin(skinName) {
        const config = await this.getPluginConfiguration();
        config.selectedSkin = skinName || "";

        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
    }

    isManagedCss(css) {
        if (!css) {
            return false;
        }

        const trimmed = css.trimStart();
        return trimmed.startsWith(this.MANAGED_CSS_MARKER)
            || trimmed.startsWith("#Skin Manager CSS");
    }

    cleanText(value) {
        return typeof value === "string" ? value.trim() : "";
    }
}
