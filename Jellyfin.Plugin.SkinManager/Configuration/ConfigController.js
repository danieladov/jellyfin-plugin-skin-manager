class ConfigController {

    constructor() {
        console.log("ConfigController initialized");
        this.pluginId = "e9ca8b8e-ca6d-40e7-85dc-58e536df8eb3";
        this.MANAGED_CSS_MARKER = "/* Skin Manager CSS */";
    }

    async saveSkin(skin) {
        skin.name = new Date().toLocaleString() + " - " + skin.name;
        console.log("Saving skin:", skin);
        const config = await this.getPluginConfiguration();
        const serialized = this.serializeSkin(skin);
        if (serialized) {
            config.skinHistory.push(serialized);
        }
        const result = await ApiClient.updatePluginConfiguration(this.pluginId, config);
        Dashboard.processPluginConfigurationUpdateResult(result);
    }

    async loadHistorySkins() {
        const config = await this.getPluginConfiguration();
        return [...config.skinHistory]
            .reverse()
            .map(s => this.deserializeSkin(s))
            .filter(Boolean);
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
        const config = await ApiClient.getPluginConfiguration(this.pluginId);
        if (!Array.isArray(config.skinHistory)) {
            config.skinHistory = [];
        }
        if (!Array.isArray(config.userCssHistory)) {
            config.userCssHistory = [];
        }
        return config;
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
}
