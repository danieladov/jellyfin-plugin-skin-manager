var ConfigController = class ConfigController {
    static MAX_SKIN_HISTORY = 25;
    static MAX_USER_CSS_HISTORY = 25;
    static MAX_IMPORTED_SKINS = 50;
    static MAX_SKIN_SOURCES = 20;
    static EXPORT_SCHEMA = "jellyfin-skin-manager-export/v1";
    static MAX_IMPORT_SIZE = 2 * 1024 * 1024;
    static OFFICIAL_SOURCE_ID = "official";
    static OFFICIAL_SOURCE_NAME = "Official";
    static OFFICIAL_MANIFEST_URL = "https://raw.githubusercontent.com/danieladov/jellyfin-plugin-skin-manager/V3.0/Jellyfin.Plugin.SkinManager/Configuration/skins.json";
    static DEFAULT_BACKUP_MANIFEST_URL = "/web/configurationpage?name=skins.json";

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

    async deleteImportedSkin(skinName) {
        const normalizedName = this.cleanText(skinName).toLocaleLowerCase();
        if (!normalizedName) {
            return;
        }

        const config = await this.getPluginConfiguration();
        config.importedSkins = config.importedSkins
            .map(entry => this.deserializeSkin(entry))
            .filter(existingSkin => existingSkin && existingSkin.name.trim().toLocaleLowerCase() !== normalizedName)
            .map(existingSkin => this.serializeSkin(this.toPlainSkin(existingSkin)))
            .filter(Boolean);

        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
    }

    async loadSkinSources() {
        const config = await this.getPluginConfiguration();
        return config.skinSources
            .map((entry, index) => this.deserializeSkinSource(entry, index))
            .filter(Boolean);
    }

    async saveSkinSources(sources) {
        const normalizedSources = [];
        const seenUrls = new Set();

        (Array.isArray(sources) ? sources : []).forEach((source, index) => {
            const normalizedSource = this.normalizeSkinSource(source, index);
            if (!normalizedSource) {
                return;
            }

            const normalizedUrl = normalizedSource.url.toLocaleLowerCase();
            if (seenUrls.has(normalizedUrl)) {
                return;
            }

            seenUrls.add(normalizedUrl);
            normalizedSources.push(normalizedSource);
        });

        const config = await this.getPluginConfiguration();
        config.skinSources = normalizedSources
            .slice(0, ConfigController.MAX_SKIN_SOURCES)
            .map(source => this.serializeSkinSource(source))
            .filter(Boolean);

        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
        return normalizedSources;
    }

    async addSkinSource({ url, name } = {}) {
        const source = this.createSkinSource({ url, name });
        const existingSources = await this.loadSkinSources();
        const nextSources = existingSources.filter(existingSource => existingSource.url.toLocaleLowerCase() !== source.url.toLocaleLowerCase());
        nextSources.push(source);
        await this.saveSkinSources(nextSources);
        return source;
    }

    async updateSkinSource(sourceId, patch = {}) {
        const sources = await this.loadSkinSources();
        const nextSources = sources.map(source => {
            if (source.id !== sourceId) {
                return source;
            }

            return this.normalizeSkinSource({ ...source, ...patch }) || source;
        });

        await this.saveSkinSources(nextSources);
        return nextSources.find(source => source.id === sourceId) || null;
    }

    async removeSkinSource(sourceId) {
        const sources = await this.loadSkinSources();
        await this.saveSkinSources(sources.filter(source => source.id !== sourceId));
    }

    createSkinSource({ url, name } = {}) {
        const sourceUrl = this.validateSkinSourceUrl(url);
        const sourceName = this.cleanText(name) || this.getSourceNameFromUrl(sourceUrl);

        return {
            id: this.generateId("skin-source"),
            name: sourceName,
            url: sourceUrl,
            enabled: true,
            addedAt: new Date().toISOString(),
            lastCheckedAt: "",
            status: "idle",
            message: "",
            skinCount: 0
        };
    }

    deserializeSkinSource(serializedSource, index = 0) {
        if (!serializedSource) {
            return null;
        }

        try {
            const sourceData = typeof serializedSource === "string"
                ? JSON.parse(serializedSource)
                : serializedSource;
            return this.normalizeSkinSource(sourceData, index);
        } catch (error) {
            console.error("Error parsing the skin source:", error);
            return null;
        }
    }

    serializeSkinSource(source) {
        try {
            return JSON.stringify(this.normalizeSkinSource(source));
        } catch (error) {
            console.error("Error serializing the skin source:", error);
            return null;
        }
    }

    normalizeSkinSource(source, index = 0) {
        if (!source || typeof source !== "object") {
            return null;
        }

        let sourceUrl = "";
        try {
            sourceUrl = this.validateSkinSourceUrl(source.url);
        } catch (error) {
            return null;
        }

        return {
            id: this.cleanText(source.id) || this.generateId(`skin-source-${index}`),
            name: this.cleanText(source.name) || this.getSourceNameFromUrl(sourceUrl),
            url: sourceUrl,
            enabled: source.enabled !== false,
            addedAt: this.cleanText(source.addedAt) || new Date().toISOString(),
            lastCheckedAt: this.cleanText(source.lastCheckedAt),
            status: this.cleanText(source.status) || "idle",
            message: this.cleanText(source.message),
            skinCount: Number.isFinite(Number(source.skinCount)) ? Number(source.skinCount) : 0,
            manifestName: this.cleanText(source.manifestName),
            manifestDescription: this.cleanText(source.manifestDescription)
        };
    }

    validateSkinSourceUrl(url) {
        const sourceUrl = this.cleanText(url);
        if (!sourceUrl) {
            throw new Error("Enter a manifest URL.");
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(sourceUrl, window.location.href);
        } catch (error) {
            throw new Error("Enter a valid manifest URL.");
        }

        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
            throw new Error("Manifest URLs must use HTTP or HTTPS.");
        }

        return parsedUrl.href;
    }

    getSourceNameFromUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname.replace(/^www\./, "");
        } catch (error) {
            return "Third-party source";
        }
    }

    getOfficialSkinSource() {
        return {
            id: ConfigController.OFFICIAL_SOURCE_ID,
            name: ConfigController.OFFICIAL_SOURCE_NAME,
            url: ConfigController.OFFICIAL_MANIFEST_URL,
            enabled: true
        };
    }

    async loadOfficialSkinManifest(backupUrl = ConfigController.DEFAULT_BACKUP_MANIFEST_URL) {
        const source = this.getOfficialSkinSource();

        try {
            const manifestData = await this.fetchJson(source.url, { cache: "no-store" });
            const manifest = this.normalizeSkinManifest(manifestData, source);
            this.ensureManifestHasSkins(manifest);
            await this.saveOfficialManifestCache(manifestData, manifest, source.url);
            return {
                ...manifest,
                loadMode: "remote",
                loadMessage: ""
            };
        } catch (remoteError) {
            console.warn("Could not load the official manifest:", remoteError);
            const cachedManifest = await this.loadOfficialManifestCache(remoteError);
            if (cachedManifest) {
                return cachedManifest;
            }

            return await this.loadOfficialBackupManifest(backupUrl, remoteError);
        }
    }

    async fetchJson(url, { cache = "no-store" } = {}) {
        const response = await fetch(url, { cache });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }

    async loadOfficialBackupManifest(backupUrl, remoteError) {
        const backupSource = {
            ...this.getOfficialSkinSource(),
            url: this.cleanText(backupUrl) || ConfigController.DEFAULT_BACKUP_MANIFEST_URL
        };

        try {
            const manifestData = await this.fetchJson(backupSource.url, { cache: "default" });
            const manifest = this.normalizeSkinManifest(manifestData, backupSource);
            this.ensureManifestHasSkins(manifest);
            const message = this.getManifestFallbackMessage(remoteError, "Using bundled backup.");
            await this.saveOfficialManifestStatus({
                status: "warning",
                loadMode: "backup",
                message,
                skinCount: manifest.skins.length
            });
            return {
                ...manifest,
                loadMode: "backup",
                loadMessage: message
            };
        } catch (backupError) {
            console.error("Could not load the bundled official backup:", backupError);
            const message = this.getManifestFallbackMessage(backupError, "Official catalog unavailable.");
            await this.saveOfficialManifestStatus({
                status: "error",
                loadMode: "error",
                message,
                skinCount: 0
            });
            throw backupError;
        }
    }

    async loadOfficialManifestCache(remoteError = null) {
        const config = await this.getPluginConfiguration();
        const cacheEntry = this.parseOfficialManifestCache(config.officialManifestCache);
        if (!cacheEntry) {
            return null;
        }

        try {
            const source = {
                ...this.getOfficialSkinSource(),
                url: cacheEntry.sourceUrl || ConfigController.OFFICIAL_MANIFEST_URL
            };
            const manifest = this.normalizeSkinManifest(cacheEntry.manifestData, source);
            this.ensureManifestHasSkins(manifest);
            const message = this.getManifestFallbackMessage(remoteError, "Using cached catalog.");
            await this.saveOfficialManifestStatus({
                status: "warning",
                loadMode: "cache",
                message,
                skinCount: manifest.skins.length
            });
            return {
                ...manifest,
                loadMode: "cache",
                loadMessage: message
            };
        } catch (error) {
            console.warn("Ignoring invalid official manifest cache:", error);
            return null;
        }
    }

    parseOfficialManifestCache(serializedCache) {
        if (!this.cleanText(serializedCache)) {
            return null;
        }

        try {
            const cacheEntry = JSON.parse(serializedCache);
            const manifestData = cacheEntry?.manifestData || cacheEntry?.manifest;
            if (!manifestData || typeof manifestData !== "object") {
                return null;
            }

            return {
                sourceUrl: this.cleanText(cacheEntry.sourceUrl),
                cachedAt: this.cleanText(cacheEntry.cachedAt),
                manifestData
            };
        } catch (error) {
            console.warn("Could not parse official manifest cache:", error);
            return null;
        }
    }

    async saveOfficialManifestCache(manifestData, manifest, sourceUrl) {
        const now = new Date().toISOString();
        const config = await this.getPluginConfiguration();
        config.officialManifestCache = JSON.stringify({
            sourceUrl,
            cachedAt: now,
            manifestData
        });
        config.officialManifestCachedAt = now;
        config.officialManifestStatus = "ok";
        config.officialManifestMessage = "";
        config.officialManifestLastCheckedAt = now;
        config.officialManifestSkinCount = manifest.skins.length;
        config.officialManifestLoadMode = "remote";
        await ApiClient.updatePluginConfiguration(this.pluginId, config);
    }

    async saveOfficialManifestStatus({ status, loadMode, message, skinCount }) {
        const config = await this.getPluginConfiguration();
        config.officialManifestStatus = this.cleanText(status) || "idle";
        config.officialManifestLoadMode = this.cleanText(loadMode) || "";
        config.officialManifestMessage = this.cleanText(message);
        config.officialManifestLastCheckedAt = new Date().toISOString();
        config.officialManifestSkinCount = Number.isFinite(Number(skinCount)) ? Number(skinCount) : 0;
        await ApiClient.updatePluginConfiguration(this.pluginId, config);
    }

    async loadOfficialManifestStatus() {
        const config = await this.getPluginConfiguration();
        const cacheEntry = this.parseOfficialManifestCache(config.officialManifestCache);
        const cachedAt = config.officialManifestCachedAt || cacheEntry?.cachedAt || "";

        return {
            name: ConfigController.OFFICIAL_SOURCE_NAME,
            url: ConfigController.OFFICIAL_MANIFEST_URL,
            status: this.cleanText(config.officialManifestStatus) || (cacheEntry ? "ok" : "idle"),
            loadMode: this.cleanText(config.officialManifestLoadMode) || (cacheEntry ? "cache" : "idle"),
            message: this.cleanText(config.officialManifestMessage),
            lastCheckedAt: this.cleanText(config.officialManifestLastCheckedAt),
            cachedAt,
            skinCount: Number.isFinite(Number(config.officialManifestSkinCount))
                ? Number(config.officialManifestSkinCount)
                : 0
        };
    }

    ensureManifestHasSkins(manifest) {
        if (!manifest || !Array.isArray(manifest.skins) || manifest.skins.length === 0) {
            throw new Error("The manifest does not contain skins.");
        }
    }

    getManifestFallbackMessage(error, fallback) {
        const errorMessage = this.cleanText(error?.message);
        return errorMessage
            ? `Official manifest unavailable (${errorMessage}). ${fallback}`
            : fallback;
    }

    async fetchSkinSource(source) {
        const normalizedSource = this.normalizeSkinSource(source);
        if (!normalizedSource) {
            throw new Error("This source is not valid.");
        }

        const manifestData = await this.fetchJson(normalizedSource.url, { cache: "no-store" });
        return this.normalizeSkinManifest(manifestData, normalizedSource);
    }

    normalizeSkinManifest(manifestData, source) {
        const skins = Array.isArray(manifestData?.skins)
            ? manifestData.skins
            : Array.isArray(manifestData)
                ? manifestData
                : [];

        return {
            sourceId: source.id,
            sourceName: this.cleanText(manifestData?.name) || source.name,
            sourceDescription: this.cleanText(manifestData?.description),
            homepage: this.cleanText(manifestData?.homepage),
            skins: skins
                .filter(skin => skin && typeof skin === "object")
                .map(skin => this.normalizeManifestSkin(skin, source.url))
                .filter(Boolean)
        };
    }

    normalizeManifestSkin(skin, manifestUrl) {
        const plainSkin = this.toPlainSkin(skin);
        plainSkin.name = this.cleanText(plainSkin.name) || "Unnamed skin";
        plainSkin.description = this.cleanText(plainSkin.description);
        plainSkin.css = this.cleanText(plainSkin.css) || this.cleanText(plainSkin.defaultCss);
        plainSkin.categories = this.normalizeManifestCategories(plainSkin.categories, plainSkin.options);
        plainSkin.previews = this.normalizeManifestPreviews(plainSkin, manifestUrl);
        return plainSkin;
    }

    normalizeManifestCategories(categories, rootOptions) {
        const sourceCategories = Array.isArray(categories)
            ? categories
            : Array.isArray(rootOptions)
                ? [{ name: "Options", controls: rootOptions }]
                : [];

        return sourceCategories
            .map((category, index) => {
                const controls = Array.isArray(category?.controls)
                    ? category.controls
                    : Array.isArray(category?.options)
                        ? category.options
                        : [];

                return {
                    name: this.cleanText(category?.name) || `Options ${index + 1}`,
                    controls: controls
                        .map((control, controlIndex) => this.normalizeManifestControl(control, controlIndex))
                        .filter(Boolean)
                };
            })
            .filter(category => category.controls.length > 0);
    }

    normalizeManifestControl(control, index = 0) {
        if (!control || typeof control !== "object") {
            return null;
        }

        const controlData = this.toPlainSkin(control);
        const type = this.normalizeControlType(controlData.type);
        if (!type) {
            return null;
        }

        const normalizedControl = {
            ...controlData,
            type,
            label: this.cleanText(controlData.label) || this.cleanText(controlData.name) || `Option ${index + 1}`,
            description: this.cleanText(controlData.description)
        };

        if (type === "select") {
            const usesLegacySelections = Array.isArray(controlData.selections);
            const rawOptions = Array.isArray(controlData.options)
                ? controlData.options
                : usesLegacySelections
                    ? controlData.selections
                    : [];

            normalizedControl.options = rawOptions
                .map((option, optionIndex) => this.normalizeManifestSelectOption(option, optionIndex, usesLegacySelections))
                .filter(Boolean);

            if (!normalizedControl.options.length) {
                return null;
            }

            normalizedControl.css = usesLegacySelections
                ? "%value%"
                : this.cleanText(controlData.css) || "%value%";
            normalizedControl.default = this.hasOwnValue(controlData, "default")
                ? String(controlData.default ?? "")
                : this.hasOwnValue(controlData, "value")
                    ? String(controlData.value ?? "")
                    : normalizedControl.options[0].value;
            return normalizedControl;
        }

        if (type === "checkbox") {
            normalizedControl.default = this.hasOwnValue(controlData, "default")
                ? Boolean(controlData.default)
                : Boolean(controlData.value);
        }

        normalizedControl.css = this.cleanText(controlData.css);
        return normalizedControl;
    }

    normalizeControlType(type) {
        const normalizedType = this.cleanText(type).toLocaleLowerCase();
        switch (normalizedType) {
            case "checkbox":
                return "checkbox";
            case "selector":
            case "select":
                return "select";
            case "colorpicker":
            case "color":
                return "color";
            case "slider":
            case "number":
            case "fontpicker":
            case "textarea":
                return normalizedType === "fontpicker" ? "fontPicker" : normalizedType;
            default:
                return "";
        }
    }

    normalizeManifestSelectOption(option, index = 0, preferCssValue = false) {
        const optionData = typeof option === "string"
            ? { label: option, value: option }
            : option;

        if (!optionData || typeof optionData !== "object") {
            return null;
        }

        const label = this.cleanText(optionData.label)
            || this.cleanText(optionData.name)
            || `Option ${index + 1}`;
        const cssValue = this.cleanText(optionData.css);
        const value = preferCssValue && cssValue
            ? cssValue
            : this.hasOwnValue(optionData, "value")
                ? String(optionData.value ?? "")
                : cssValue || label;

        return { label, value };
    }

    hasOwnValue(source, key) {
        return Object.prototype.hasOwnProperty.call(source || {}, key);
    }

    normalizeManifestPreviews(skin, manifestUrl) {
        const rawPreviews = [];

        if (this.cleanText(skin.preview)) {
            rawPreviews.push({
                name: "Preview",
                url: skin.preview
            });
        }

        if (Array.isArray(skin.previews)) {
            rawPreviews.push(...skin.previews);
        }

        return rawPreviews
            .map((preview, index) => {
                const previewData = typeof preview === "string"
                    ? { name: `Preview ${index + 1}`, url: preview }
                    : preview;

                const previewUrl = this.cleanText(previewData?.url);
                if (!previewUrl) {
                    return null;
                }

                return {
                    name: this.cleanText(previewData?.name) || `Preview ${index + 1}`,
                    url: this.resolveManifestUrl(previewUrl, manifestUrl)
                };
            })
            .filter(Boolean);
    }

    resolveManifestUrl(url, manifestUrl) {
        try {
            return new URL(url, manifestUrl).href;
        } catch (error) {
            return url;
        }
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

    generateId(prefix = "user-css") {
        if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
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
        if (!Array.isArray(config.skinSources)) {
            config.skinSources = [];
        }
        if (typeof config.officialManifestCache !== "string") {
            config.officialManifestCache = "";
        }
        if (typeof config.officialManifestCachedAt !== "string") {
            config.officialManifestCachedAt = "";
        }
        if (typeof config.officialManifestStatus !== "string") {
            config.officialManifestStatus = "";
        }
        if (typeof config.officialManifestMessage !== "string") {
            config.officialManifestMessage = "";
        }
        if (typeof config.officialManifestLastCheckedAt !== "string") {
            config.officialManifestLastCheckedAt = "";
        }
        if (!Number.isFinite(Number(config.officialManifestSkinCount))) {
            config.officialManifestSkinCount = 0;
        }
        if (typeof config.officialManifestLoadMode !== "string") {
            config.officialManifestLoadMode = "";
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
};

window.ConfigController = ConfigController;
