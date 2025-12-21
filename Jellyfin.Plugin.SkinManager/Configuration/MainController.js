class MainController {
    constructor(jsonUrl) {
        this.jsonUrl = jsonUrl;
        this.skins = [];
        this.currentSkin = null;
        this.selectElement = document.getElementById("cssOptions");
        this.descriptionElement = document.getElementById("description");
        this.optionsElement = document.getElementById("options");
        this.setSkinButton = document.getElementById("setSkin");
        this.configController = new ConfigController();
    }

    async init() {
        try {
            const [json, currentSkin] = await Promise.all([
                this.fetchJson(),
                this.loadCurrentSkinFromHistory()
            ]);
            this.loadSkins(json);
            this.injectCurrentSkin(currentSkin);
            this.populateSelect();
            this.initEventListeners();
        } catch (error) {
            console.error("Error cargando las skins:", error);
        }
    }

    async fetchJson() {
        const response = await fetch(this.jsonUrl);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return await response.json();
    }

    async loadCurrentSkinFromHistory() {
        try {
            const history = await this.configController.loadHistorySkins();
            if (!Array.isArray(history) || history.length === 0) {
                return null;
            }
            const latest = history[0];
            return this.cloneAsCurrentSkin(latest);
        } catch (error) {
            console.warn("No se pudo cargar la skin actual:", error);
            return null;
        }
    }

    loadSkins(json) {
        this.skins = json.skins.map(s => new Skin(s));
    }

    injectCurrentSkin(currentSkin) {
        if (!currentSkin) {
            return;
        }
        this.skins.unshift(currentSkin);
    }

    cloneAsCurrentSkin(skin) {
        if (!skin) {
            return null;
        }

        const plainSkin = JSON.parse(JSON.stringify(skin));
        const baseName = this.extractSkinBaseName(plainSkin.name);
        plainSkin.name = `Current Skin - ${baseName}`;
        plainSkin.description = plainSkin.description || "Skin currently applied with your saved settings.";

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

    populateSelect() {
        this.selectElement.innerHTML = ""; // Limpiar por si acaso
        this.skins.forEach((skin, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = skin.name;
            this.selectElement.appendChild(option);
        });

        // Mostrar la primera skin por defecto si existe
        if (this.skins.length > 0) {
            this.selectElement.value = 0;
            this.currentSkin = this.skins[0];
            this.showSkin();
        }
    }

    showSkin() {
        this.optionsElement.innerHTML = this.currentSkin.generateHTML();
        this.currentSkin.attachEventListeners();
    }

    updateSkinInfo(index) {
        const skin = this.skins[index];
        if (!skin) return;

        // Actualizar descripción
        this.descriptionElement.textContent = `Skin: ${skin.name}`;

        // Actualizar categorías
        this.optionsElement.innerHTML = "";
        skin.categories.forEach(cat => {
            const div = document.createElement("div");
            div.textContent = cat;
            this.optionsElement.appendChild(div);
        });

        // Aplicar el CSS
        this.applySkin(skin.css);
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

    async applyCurrentSkin() {
        if (!this.currentSkin) return;

        const css = this.currentSkin.generateCSS();
        const appliedSkinName = this.currentSkin.name;

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

            // Save the skin to history after a successful update
            await this.configController.saveSkin(this.currentSkin);
            await this.configController.setSelectedSkin(appliedSkinName);

            window.location.reload(true);
        } catch (error) {
            console.error("Error applying skin:", error);
        }
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




    async initDebug() {
        try {
            const json = `{
    "skins": [
        {
            "name": "Finimalism",
            "description": "A modern, customizable skin for Jellyfin.",
            "css":"",
            "categories": [
            {
                "name": "Default",
                "controls": [
                    {
                        "type": "select",
                        "label": "Mode",
                        "description": "Select light or dark mode",
                        "id": "mode",
                        "default": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@latest/finimalism10.11.css');",
                        "css": "%value%",
                        "options": [
                            {
                                "label": "Colour",
                                "value": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@latest/finimalism10.11.css');"
                            },
                            {
                                "label": "Black",
                                "value": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@latest/finimalism10.11-black.css');"
                            }
                        ]
                    }
                ]
            }
            ]

        },
        {
            "name": "JellySkin",
            "description": "A modern, customizable skin for Jellyfin.",
            "css": "@import url('https://cdn.jsdelivr.net/npm/jellyskin@latest/dist/main.css');",
            "previews": [
                {
                    "name": "Login Page",
                    "url": "https://raw.githubusercontent.com/danieladov/jellyfin-plugin-skin-manager/master/src/img/Default/1.png"
                },
                {
                    "name": "Home/Index Page",
                    "url": "https://raw.githubusercontent.com/danieladov/jellyfin-plugin-skin-manager/master/src/img/Default/2.png"
                },
                {
                    "name": "Library Page",
                    "url": "https://raw.githubusercontent.com/danieladov/jellyfin-plugin-skin-manager/master/src/img/Default/3.png"
                },
                {
                    "name": "Title page",
                    "url": "https://raw.githubusercontent.com/danieladov/jellyfin-plugin-skin-manager/master/src/img/Default/4.png"
                }
            ],
            "categories": [
                {
                    "name": "Default",
                    "controls": [
                    {
                            "type": "fontPicker",
                            "label": "Base Font",
                            "description": "Select the base font for the skin",
                            "id": "baseFont",
                            "default": "Arial, sans-serif",
                            "css": ":root { --base-font: %value%; }"
                    },
                        {
                            "type": "color",
                            "label": "Background Color",
                            "description": "Set the background color of the skin",
                            "id": "bgColor",
                            "default": "#ffffff",
                            "css": ":root { --bg-color: %value%; }"
                        },
                        {
                            "type": "color",
                            "label": "Text Color",
                            "id": "textColor",
                            "default": "#000000",
                            "css": ":root { --text-color: %value%; }"
                        },
                        {
                            "type": "slider",
                            "label": "Font Size",
                            "id": "fontSize",
                            "min": 10,
                            "max": 30,
                            "default": 16,
                            "css": ":root { --font-size: %value%px; }"
                        },
                        {
                            "type": "checkbox",
                            "label": "Dark Mode",
                            "description": "Enable dark mode",
                            "id": "checkbox",
                            "default": true,
                            "css": ":root { --dark-mode: %value%; }"
                        },
                        {
                            "type": "number",
                            "label": "Border Radius",
                            "description": "Set the border radius",
                            "id": "borderRadius",
                            "min": 0,
                            "max": 50,
                            "default": 0,
                            "css": ":root { --border-radius: %value%px; }"
                        },
                        {
                            "type": "select",
                            "label": "Font Family",
                            "description": "Select the font family",
                            "id": "fontFamily",
                            "default": "Arial",
                            "css": ":root { --font-family: %value%; }",
                            "options": [
                                {
                                    "label": "Arial",
                                    "value": "Arial"
                                },
                                {
                                    "label": "Verdana",
                                    "value": "Verdana"
                                },
                                {
                                    "label": "Georgia",
                                    "value": "Georgia"
                                },
                                {
                                    "label": "Times New Roman",
                                    "value": "Times New Roman"
                                },
                                {
                                    "label": "Trebuchet MS",
                                    "value": "Trebuchet MS"
                                },
                                {
                                    "label": "Arial Black",
                                    "value": "Arial Black"
                                },
                                {
                                    "label": "Impact",
                                    "value": "Impact"
                                },
                                {
                                    "label": "Comic Sans MS",
                                    "value": "Comic Sans MS"
                                },
                                {
                                    "label": "Courier New",
                                    "value": "Courier New"
                                },
                                {
                                    "label": "Lucida Console",
                                    "value": "Lucida Console"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        { "name": "DarkSkin",
            "description": "A sleek dark theme for Jellyfin.",
            "css": "@import url('https://cdn.jsdelivr.net/npm/jellyskin@latest/dist/dark.css');",
            "previews": [],
            "categories": [
                {
                    "name": "Dark Mode",
                    "controls": [
                        {
                            "type": "color",
                            "label": "Background Color",
                            "description": "Set the background color of the skin",
                            "id": "bgColor",
                            "default": "#121212",
                            "css": ":root { --bg-color: %value%; }"
                        }
                    ]
                }
            ]
            }
    ]
}`;
            const jsonObj = JSON.parse(json);
            this.loadSkins(jsonObj);
            const currentSkin = await this.loadCurrentSkinFromHistory();
            this.injectCurrentSkin(currentSkin);
            this.populateSelect();
            this.initEventListeners();
        } catch (error) {
            console.error("Error cargando las skins:", error);
        }

    }
}
