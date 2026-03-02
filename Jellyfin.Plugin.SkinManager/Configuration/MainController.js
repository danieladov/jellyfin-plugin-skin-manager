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
        this.previewState = { index: 0, count: 0 };
        this.livePreviewTimer = null;
        this.previewExpanded = false;
        this.livePreviewObserver = null;
        this.livePreviewCurrentUrl = null;
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
        this.selectElement.innerHTML = "";
        this.skins.forEach((skin, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = skin.name;
            this.selectElement.appendChild(option);
        });

        if (this.skins.length > 0) {
            this.selectElement.value = 0;
            this.currentSkin = this.skins[0];
            this.showSkin();
        }
    }

    showSkin() {
        this.renderSkinDescription();
        this.optionsElement.innerHTML = this.currentSkin.generateHTML();
        this.currentSkin.attachEventListeners();
        this.setupPreviewSection();
        this.attachAutoPreviewListeners();
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
            this.previewCaption.textContent = this.currentSkin?.description || "Sin descripcion disponible.";
            return;
        }

        const positionText = total ? `${index + 1}/${total}` : "";
        const label = preview.name || "Vista previa";
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
            console.log(`Vista previa aplicada para: ${this.currentSkin.name}`);
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
            styleTag.textContent = css || "/* Vista previa sin CSS */";
        } catch (error) {
            console.warn("No se pudo inyectar CSS en la vista previa", error);
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
        this.previewExpanded = expanded;
        if (!this.livePreviewContainer) {
            return;
        }
        this.livePreviewContainer.dataset.expanded = expanded ? "true" : "false";
        if (this.livePreviewExpandButton) {
            const label = this.livePreviewExpandButton.querySelector("span");
            if (label) {
                label.textContent = expanded ? "Contraer vista previa" : "Ampliar vista previa";
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
            ? "ItemId de demo (opcional)"
            : "No requerido para esta ruta";
    }

    updateSkinInfo(index) {
        const skin = this.skins[index];
        if (!skin) return;

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
            : "Esta skin no proporciona una descripción.";
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
        {
  "name": "Finimalism",
  "description": "Minimalist theme for Jellyfin. Available in Purple/White and Black/Red variants.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/finimalism10.11.css');",
  "previews": [],
  "categories": [
    {
      "name": "Configuration",
      "controls": [
        {
          "type": "select",
          "label": "Color Variant",
          "description": "Select the main color scheme.",
          "id": "finimalismVariant",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Purple/White (Default)",
              "value": ""
            },
            {
              "label": "Black/Red",
              "value": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/finimalism10.11-black.css');"
            }
          ]
        },
        {
          "type": "select",
          "label": "Animations",
          "description": "Enable or disable UI animations.",
          "id": "finimalismAnim",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Enabled (Default)",
              "value": ""
            },
            {
              "label": "Disabled",
              "value": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/no-animation.css');"
            }
          ]
        },
        {
          "type": "select",
          "label": "Scrolling Style",
          "description": "Choose standard scrolling or the old Emby horizontal style.",
          "id": "finimalismScroll",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Standard (Default)",
              "value": ""
            },
            {
              "label": "Horizontal (Old Emby)",
              "value": "@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/horizontal-scrolling.css');"
            }
          ]
        }
      ]
    }
  ]
},
{
  "name": "Scyfin",
  "description": "Scyfin Base Theme for Jellyfin. Compatible with 10.11+.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/scyfin-theme.css');",
  "previews": [],
  "categories": [
    {
      "name": "Customization",
      "controls": [
        {
          "type": "select",
          "label": "Theme Variant",
          "description": "Select a color theme overlay.",
          "id": "scyfinVariant",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Default",
              "value": ""
            },
            {
              "label": "Seafoam",
              "value": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/theme-seafoam.css');"
            },
            {
              "label": "Coral",
              "value": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/theme-coral.css');"
            },
            {
              "label": "Snow",
              "value": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/theme-snow.css');"
            },
            {
              "label": "OLED",
              "value": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/theme-oled.css');"
            }
          ]
        },
        {
          "type": "select",
          "label": "Left Drawer",
          "description": "Choose behavior for the left navigation drawer.",
          "id": "scyfinDrawer",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Static (Default)",
              "value": ""
            },
            {
              "label": "Disable Static",
              "value": "@import url('https://cdn.jsdelivr.net/gh/loof2736/scyfin@latest/CSS/disable-static-drawer.css');"
            }
          ]
        }
      ]
    }
  ]
},
        {
  "name": "ZestyTheme",
  "description": "A minimal and elegant theme for Jellyfin based on/inspired by Ultrachromic, Glassmorphism, Scyfin, JellyTheme & Zombie. Compatible with 10.11+ & Tablets.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/theme.css');",
  "previews": [],
  "categories": [
    {
      "name": "Customization",
      "controls": [
        {
          "type": "select",
          "label": "Color Scheme",
          "description": "Select the accent color scheme for the theme.",
          "id": "zestyColorScheme",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Cyan (Default)",
              "value": ""
            },
            {
              "label": "Blue",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/blue.css');"
            },
            {
              "label": "Coral",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/coral.css');"
            },
            {
              "label": "Gray",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/gray.css');"
            },
            {
              "label": "Green",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/green.css');"
            },
            {
              "label": "Purple",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/purple.css');"
            },
            {
              "label": "Red",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/red.css');"
            },
            {
              "label": "Yellow",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/yellow.css');"
            }
          ]
        },
        {
          "type": "select",
          "label": "Login Wallpaper Style",
          "description": "Choose between the Minimal (default) or Stylish login background.",
          "id": "zestyLoginStyle",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Minimal",
              "value": ""
            },
            {
              "label": "Stylish",
              "value": "@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/login-alt.css');"
            }
          ]
        }
      ]
    }
  ]
},
{
  "name": "StrawberryJam",
  "description": "The Jellyfin theme for red enthusiasts. Supports banners.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/KnuXles/StrawberryJam@main/StrawberryJam.css');",
  "previews": [],
  "categories": []
},
{
  "name": "Glassmorphism",
  "description": "A sleek and modern theme for Jellyfin inspired by the glassmorphism design trend. Features frosted glass aesthetics and responsive design.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/alexyle/jellyfin-theme@main/glassmorphism/theme.css');",
  "previews": [],
  "categories": [
    {
      "name": "Configuration",
      "controls": [
        {
          "type": "select",
          "label": "Theme Style",
          "description": "Choose between the standard look or the Liquid Glass effect (Chromium browsers only).",
          "id": "glassmorphismVariant",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Standard (Default)",
              "value": ""
            },
            {
              "label": "Liquid Glass",
              "value": "@import url('https://cdn.jsdelivr.net/gh/alexyle/jellyfin-theme@liquid-glass/glassmorphism/theme.css');"
            }
          ]
        }
      ]
    }
  ]
},{
  "name": "Catppuccin",
  "description": "Soothing pastel theme for the high-spirited! Available in 4 flavors with customizable accents.",
  "css": "@import url('https://jellyfin.catppuccin.com/theme.css');",
  "previews": [],
  "categories": [
    {
      "name": "Configuration",
      "controls": [
        {
          "type": "select",
          "label": "Flavor",
          "description": "Select the base color palette.",
          "id": "catppuccinFlavor",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Mocha (Default - Dark)",
              "value": ""
            },
            {
              "label": "Latte (Light)",
              "value": "@import url('https://jellyfin.catppuccin.com/catppuccin-latte.css');"
            },
            {
              "label": "Frappé (Soft Dark)",
              "value": "@import url('https://jellyfin.catppuccin.com/catppuccin-frappe.css');"
            },
            {
              "label": "Macchiato (Medium Dark)",
              "value": "@import url('https://jellyfin.catppuccin.com/catppuccin-macchiato.css');"
            }
          ]
        },
        {
          "type": "select",
          "label": "Accent Color",
          "description": "Override the main accent color.",
          "id": "catppuccinAccent",
          "default": "",
          "css": ":root { --main-color: var(--%value%); }",
          "options": [
            { "label": "Default", "value": "accent" },
            { "label": "Rosewater", "value": "rosewater" },
            { "label": "Flamingo", "value": "flamingo" },
            { "label": "Pink", "value": "pink" },
            { "label": "Mauve", "value": "mauve" },
            { "label": "Red", "value": "red" },
            { "label": "Maroon", "value": "maroon" },
            { "label": "Peach", "value": "peach" },
            { "label": "Yellow", "value": "yellow" },
            { "label": "Green", "value": "green" },
            { "label": "Teal", "value": "teal" },
            { "label": "Sky", "value": "sky" },
            { "label": "Sapphire", "value": "sapphire" },
            { "label": "Blue", "value": "blue" },
            { "label": "Lavender", "value": "lavender" }
          ]
        }
      ]
    }
  ]
},{
  "name": "Ultrachromic",
  "description": "The final form of the chromic theme saga. Highly modular and customizable.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/base.css'); @import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/accentlist.css');",
  "previews": [],
  "categories": [
    {
      "name": "Modules",
      "controls": [
        {
          "type": "checkbox",
          "label": "Apply Fixes",
          "description": "Apply various small UI/UX tweaks and fixes.",
          "id": "ultraFixes",
          "default": true,
          "css": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/fixes.css');"
        },
        {
          "type": "checkbox",
          "label": "Unified Font",
          "description": "Use the Jellyfin logo font for the entire interface.",
          "id": "ultraFont",
          "default": false,
          "css": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/jf_font.css');"
        },
        {
          "type": "select",
          "label": "Corner Rounding",
          "description": "Customize the border radius of UI elements.",
          "id": "ultraRounding",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Default",
              "value": ""
            },
            {
              "label": "Rounded Corners",
              "value": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/rounding.css');"
            },
            {
              "label": "Rounded + Circle Hover",
              "value": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/rounding_circlehover.css');"
            }
          ]
        },
        {
           "type": "select",
           "label": "Type Style",
           "description": "Select the overall darkness level.",
           "id": "ultraType",
           "default": "",
           "css": "%value%",
           "options": [
             { "label": "Default", "value": "" },
             { "label": "Darker", "value": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/type/dark.css');" },
             { "label": "Black (OLED)", "value": "@import url('https://cdn.jsdelivr.net/gh/CTalvio/Ultrachromic/type/black.css');" }
           ]
        }
      ]
    }
  ]
},{
  "name": "Developer Themes",
  "description": "A collection of clean, developer-friendly aesthetics including Dracula, Nord, and Gruvbox.",
  "css": "/* Select a theme below to start */",
  "previews": [],
  "categories": [
    {
      "name": "Theme Selection",
      "controls": [
        {
          "type": "select",
          "label": "Preset",
          "description": "Choose your preferred color palette.",
          "id": "devThemePreset",
          "default": "dracula",
          "css": "%value%",
          "options": [
            {
              "label": "Dracula",
              "value": "@import url('https://derektata.github.io/jellyfin-themes/dracula.css');"
            },
            {
              "label": "Nord",
              "value": "@import url('https://derektata.github.io/jellyfin-themes/nord.css');"
            },
            {
              "label": "Gruvbox Dark",
              "value": "@import url('https://derektata.github.io/jellyfin-themes/gruvbox-dark.css');"
            },
            {
              "label": "One Dark",
              "value": "@import url('https://derektata.github.io/jellyfin-themes/one-dark.css');"
            },
            {
              "label": "Tokyo",
              "value": "@import url('https://derektata.github.io/jellyfin-themes/tokyo.css');"
            }
          ]
        }
      ]
    }
  ]
},
{
  "name": "Flow",
  "description": "A Plex-inspired theme. Includes a compatibility patch for Jellyfin 10.11+.",
  "css": "@import url('https://cdn.jsdelivr.net/gh/LitCastVlog/Flow@main/CSS/ScyFlow-oneliner-mobile.css');",
  "previews": [],
  "categories": [
    {
      "name": "System",
      "controls": [
        {
          "type": "checkbox",
          "label": "10.11 Compatibility Patch",
          "description": "Essential fix for Jellyfin 10.11 users to prevent layout issues.",
          "id": "flowCompat",
          "default": true,
          "css": "@import url('https://cdn.jsdelivr.net/gh/LitCastVlog/Flow@main/CSS/ScyFlow-Compatibility.css');"
        }
      ]
    }
  ]
},{
  "name": "Custom (Advanced)",
  "description": "Customize the look of Jellyfin by your needs. Deep customization options for fonts, layouts, and effects.",
  "css": "/* Advanced Custom Configuration */",
  "previews": [],
  "categories": [
    {
      "name": "Fonts & Typography",
      "controls": [
        {
          "type": "fontPicker",
          "label": "Change Font",
          "description": "Select the global font family.",
          "id": "advFontFamily",
          "default": "Arial, sans-serif",
          "css": "html {font-family: '%value%', sans-serif; } body,h1,h2,h3 { font-family: '%value%', sans-serif;}"
        },
        {
          "type": "number",
          "label": "Title Font Size",
          "description": "Change the size of the font used at titles (in em).",
          "id": "advTitleSize",
          "min": 0.5,
          "max": 5.0,
          "step": 0.1,
          "default": 1.8,
          "css": "h1 {font-size: %value%em;}"
        }
      ]
    },
    {
      "name": "Home/Dashboard Page",
      "controls": [
        {
          "type": "checkbox",
          "label": "Enlarge Tab Buttons",
          "description": "Enlarges the tab buttons (suggested, genres, etc). Useful for mobile.",
          "id": "advEnlargeTabs",
          "default": false,
          "css": ".headerTabs.sectionTabs {text-size-adjust: 110%; font-size: 110%;}.pageTitle {margin-top: auto; margin-bottom: auto;}.emby-tab-button {padding: 1.75em 1.7em;}"
        }
      ]
    },
    {
      "name": "Miscellaneous",
      "controls": [
        {
          "type": "select",
          "label": "Poster Card Hover Effect",
          "description": "Changes the hover effect on Movie/TV show/Music poster cards.",
          "id": "advPosterHover",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "None",
              "value": ""
            },
            {
              "label": "Scale in and out",
              "value": ".cardBox-bottompadded{margin-bottom: 1em !important;}.itemsContainer>.card>.cardBox {margin: 1em;background: rgba(0,0,0,0.5);transition: transform .2s;}.card:hover .cardBox{transform: scale(1.1);}"
            },
            {
              "label": "Pop up and down",
              "value": ".itemsContainer>.card>.cardBox {margin: 1em;background: rgba(0,0,0,0.5);transition: transform .2s, box-shadow .2s;}.card:hover .cardBox{transform: translatey(-5px);box-shadow: 0px 5px 10px black;}"
            },
            {
              "label": "Poster Image in and out",
              "value": ".card:hover .cardImageContainer{background-size: 120%} .cardImageContainer{background-size: 105%;transition: all .2s;}"
            },
            {
              "label": "Poster Image blur",
              "value": ".card:hover .cardImageContainer{filter: blur(2px);} .cardImageContainer{transition: all .2s;}"
            }
          ]
        },
        {
          "type": "select",
          "label": "Icon Pack",
          "description": "Changes dashboard and play icons.",
          "id": "advIconPack",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Default",
              "value": ""
            },
            {
              "label": "Outlined",
              "value": "@import url('https://prayag17.github.io/Jellyfin-Icons/Outline.css');"
            },
            {
              "label": "Rounded",
              "value": "@import url('https://prayag17.github.io/Jellyfin-Icons/round.css');"
            },
            {
              "label": "Sharp",
              "value": "@import url('https://prayag17.github.io/Jellyfin-Icons/Sharp.css');"
            }
          ]
        },
        {
          "type": "checkbox",
          "label": "Image Gradient in Title Page",
          "description": "Removes the bg of detail ribbon and replaces it with image gradient.",
          "id": "advImgGradient",
          "default": false,
          "css": ".detailRibbon {background: transparent;}.itemBackdrop {-webkit-mask: linear-gradient(to bottom, black 50%,transparent);mask: linear-gradient(to bottom, black 50%,transparent);}"
        },
        {
          "type": "checkbox",
          "label": "Minimal Actor Cards",
          "description": "Display actor cards in a minimal and compact way.",
          "id": "advActorCards",
          "default": false,
          "css": ".card[data-type=Actor] .cardBox {background: none;position: relative;}.card[data-type=Actor] .cardScalable {height: 0;overflow: hidden;padding-top: 100%;border-radius: var(--rounding);}.card[data-type=Actor] .cardText {position: absolute;background: transparent !important;}.card[data-type=Actor] .cardImageContainer::after {content: '';background: linear-gradient(360deg, rgba(0,0,0,0.75), transparent 70%);width: 100%;bottom: 0;position: absolute;padding-top: 100%;}.card[data-type=Actor].cardText-secondary {bottom: 0%;width: -webkit-fill-available;border-radius: 0px 0px 10px 10px;height: 22px;}.card[data-type=Actor] .cardText-first {bottom: 23.5px;width: -webkit-fill-available;height: 22px;}.layout-mobile .card[data-type=Actor] .cardText-first {color: white !important;}.card[data-type=Actor] .cardScalable {overflow: hidden;border-radius: var(--rounding);height: 3rem;}.card[data-type=Actor] .cardOverlayButton-br {position: absolute;bottom: 23% !important;right: 0 !important;}.card[data-type=Actor] .cardPadder {background: none;}.card[data-type=Actor] .cardImageIcon {bottom: 41%;position: absolute;left: 50%;transform: translateX(-50%);}"
        },
        {
          "type": "select",
          "label": "Episode View",
          "description": "Theme episode list layout.",
          "id": "advEpisodeView",
          "default": "",
          "css": "%value%",
          "options": [
            {
              "label": "Default",
              "value": ""
            },
            {
              "label": "Card",
              "value": "#itemDetailPage .vertical-list {display: grid;grid-template-columns: 30% 30% 30%;padding: 0 6px !important;height: fit-content;justify-content: space-evenly;-webkit-box-orient: horizontal;-webkit-box-direction: normal;margin: -6px;width: calc(100% - 6px);}.listItem-withContentWrapper:hover .listItemImageButton.itemAction.paper-icon-button-light {opacity: 100%;}@media (max-width: 901px){#itemDetailPage .vertical-list {grid-template-columns: 30% 30%;}}.listItem-withContentWrapper {transition: none;height: fit-content;max-width: 100%;margin: 6px;border-radius: var(--rounding);overflow: hidden;padding: 0;overflow: hidden;}.listItem-withContentWrapper:hover{background: transparent;}.listItem-content {height: 100%;}.listItem-content {display: -webkit-flex;display: flex;-webkit-align-items: center;align-items: center;width: 100%;display: grid;grid-template-columns: 100%;}.listItemImage.listItemImage-large.itemAction.lazy {height: 14rem;width: 100%;padding: 0 !important;margin: 0 !important;top: 0;left: 0;}.layout-mobile #itemDetailPage .vertical-list {grid-template-columns: 100%;}.secondary.listItem-overview.listItemBodyText {height: fit-content;}.layout-mobile .listItem-bottomoverview {padding: 0 10px;}.listItemBody.itemAction {padding: 0 5px;}.listItemImageButton.itemAction.paper-icon-button-light {opacity: 0;color: var(--accent);transition: all .2s;}.layout-mobile .listItemImageButton.itemAction.paper-icon-button-light{opacity: 100% !important;}"
            },
            {
              "label": "Compact List",
              "value": ".listItemImage.listItemImage-large.itemAction.lazy {height: 110px;}.listItem-content {height: 115px;}.secondary.listItem-overview.listItemBodyText {height: 61px;margin: 0;}"
            }
          ]
        },
        {
          "type": "checkbox",
          "label": "Blur Episode Thumbnail",
          "description": "Blur episode thumbnail to prevent spoilers.",
          "id": "advBlurEpisode",
          "default": false,
          "css": ".nextUpSection.verticalSection.detailVerticalSection>div>div>div>div.cardScalable>button {filter: blur(10px);}div.listItem>div>div>button:nth-child(1) {transition: none !important;border-radius: 0px;height: 100%;width: 100%;backdrop-filter: blur(10px);}div.listItem>div>div>button:nth-child(1):hover {transition: none !important;border-radius: 0px;height: 100%;width: 100%;backdrop-filter: blur(10px);}#childrenContent>div>div>div>div.listItemImage.listItemImage large.itemAction.lazy.non-blurhashable.lazy-image-fadein-fast>button {transition: none !important;border-radius: 0px;height: 100%;width: 100%;backdrop-filter: blur(10px);}#childrenContent>div>div>div>div.listItemImage.listItemImage-large.itemAction.lazy.non-blurhashable.lazy-image-fadein-fast>button:hover {border-radius: 0px;height: 85%;width: 85%;backdrop-filter: blur(20px);}@supports not ( (backdrop-filter: blur(10px)) or (--webkit-backdrop-filter: blur(10px))) {#childrenContent>div>div>div>div.listItemImage.listItemImage-large.itemAction.lazy.non-blurhashable.lazy-image-fadein-fast {filter: blur(10px);}}@supports not ( (backdrop-filter: blur(10px)) or (--webkit-backdrop-filter: blur(10px))) {#itemDetailPage>div.detailPageWrapperContainer>div.detailPageSecondaryContainer>div.detailPageContent>div.verticalSection.detailVerticalSection.moreFromSeasonSection.emby-scroller-container>div.padded-top-focusscale.padded-bottom-focusscale.emby-scroller>.itemsContainer>.card.overflowBackdropCard.card-hoverable.card-withuserdata>div>.cardScalable {background: rgba(0, 0, 0, .5);filter: blur(10px);transition: none !important;filter: blur(10px);}}#itemDetailPage>div.detailPageWrapperContainer>div.detailPageSecondaryContainer>div.detailPageContent>div.verticalSection.detailVerticalSection.moreFromSeasonSection.emby-scroller-container>div.padded-top-focusscale.padded-bottom-focusscale.emby-scroller>.itemsContainer>.card.overflowBackdropCard.card-hoverable.card-withuserdata>div>.cardScalable>button {border-radius: 0px;height: 0%;width: 0%;background: rgba(0, 0, 0, .5);filter: blur(10px);transition: none !important;backdrop-filter: blur(10px);}.cardScalable{overflow: hidden;}"
        },
        {
          "type": "checkbox",
          "label": "Blur Dialog Background",
          "description": "Blur Menu and dialog background (Chrome/Edge only).",
          "id": "advBlurDialog",
          "default": false,
          "css": ".mainDrawer {background: transparent;backdrop-filter: blur(20px);}"
        },
        {
          "type": "color",
          "label": "Title Page Button Text Color",
          "description": "Change button's text color.",
          "id": "advBtnTextColor",
          "default": "#ffffff",
          "css": ".raised{color: %value%;}"
        },
        {
          "type": "color",
          "label": "Title Page Button Background",
          "description": "Change background color of button.",
          "id": "advBtnBgColor",
          "default": "#303030",
          "css": ".raised{background-color: %value%;}"
        },
        {
          "type": "color",
          "label": "Idle Button Color (Foreground)",
          "description": "Color of buttons like cast and search when idle.",
          "id": "advIdleFg",
          "default": "#ffffff",
          "css": ".paper-icon-button-light{color: %value%; transition: all .2s;}"
        },
        {
          "type": "color",
          "label": "Idle Button Color (Background)",
          "description": "Background color of buttons like cast and search when idle.",
          "id": "advIdleBg",
          "default": "#00000000",
          "css": ".paper-icon-button-light{background-color: %value% !important; transition: all .2s;}"
        },
        {
          "type": "color",
          "label": "Hover Button Color (Foreground)",
          "description": "Color of buttons like cast and search when hovered.",
          "id": "advHoverFg",
          "default": "#00a4dc",
          "css": ".paper-icon-button-light:hover{color: %value% !important;}"
        },
        {
          "type": "color",
          "label": "Hover Button Color (Background)",
          "description": "Background color of buttons like cast and search when hovered.",
          "id": "advHoverBg",
          "default": "#00a4db33",
          "css": ".paper-icon-button-light:hover{background-color: %value% !important;}"
        },
        {
          "type": "slider",
          "label": "Border Radius",
          "description": "Change the global UI rounding.",
          "id": "advBorderRadius",
          "min": 0,
          "max": 50,
          "default": 0,
          "css": ":root{--btn-rounding: %value%px; --rounding: %value%px;} .missingIndicator, .unairedIndicator {border-radius: var(--rounding);}.formDialogHeader {border-top-left-radius: var(--rounding);border-top-right-radius: var(--rounding);}.formDialogFooter {border-bottom-left-radius: var(--rounding);border-bottom-right-radius: var(--rounding);}.cardOverlayContainer {border-radius: var(--rounding) !important;}.primaryImageWrapper>img, .toast, .paperList, .cardContent, .sessionNowPlayingInnerContent, .listItem:hover, .cardImage, .fab, .raised, .multiSelectCheckboxOutline, .itemSelectionPanel, .cardContent-button, .cardContent-shadow, .itemDetailImage, .cardOverlayButton-hover, .cardImageContainer, .cardPadder, .listItemImage, .listItemImageButton, .listItemButton, .headerButton, .paper-icon-button-light, .innerCardFooter, .blurhash-canvas, .dialog, .countIndicator, .playedIndicator, .listItemIcon, .listItem-border, .button-flat, .visualCardBox, .checkboxOutline, .emby-select-withcolor, .chapterThumbTextContainer, .chapterThumbContainer, .chapterThumb, .emby-input, .emby-textarea, .emby-select-withcolor, .nowPlayingPageImage, .upNextDialog-poster-img, .upNextContainer, .cardOverlayButtonIcon {border-radius: var(--rounding) !important;}.osdPoster img {border-radius: var(--rounding);border: none;}.mdl-slider::-moz-range-thumb {border-radius: var(--rounding);}.mdl-slider::-ms-thumb {border-radius: var(--rounding);}.mdl-slider::-webkit-slider-thumb {border-radius: var(--rounding);}div[data-role='controlgroup'] a[data-role='button']:first-child {border-bottom-left-radius: var(--rounding);border-top-left-radius: var(--rounding);}div[data-role='controlgroup'] a[data-role='button']:last-child {border-bottom-right-radius: var(--rounding);border-top-right-radius: var(--rounding);}#dashboardPage .cardContent, #dashboardPage .sessionNowPlayingInnerContent {border-radius: var(--rounding) var(--rounding) 0 0 !important;}#divVirtualFolders .cardImageContainer, #divVirtualFolders .cardContent {border-radius: var(--rounding) var(--rounding) 0 0 !important;}#userProfilesPage .cardImage, #userProfilesPage .cardContent {border-radius: var(--rounding) var(--rounding) 0 0 !important;}#user_usage_report_table, .detailTable {border-radius: var(--rounding);}progress {border-radius: var(--rounding);}progress::-webkit-progress-bar {border-radius: var(--rounding);}progress::-moz-progress-bar {border-radius: var(--rounding);}progress::-webkit-progress-value {border-radius: var(--rounding);}.taskProgressOuter, .taskProgressInner {border-radius: var(--rounding) !important;}::-webkit-scrollbar-thumb {border-radius: var(--rounding);} .paper-icon-button-light{border-radius: var(--btn-rounding) !important;}"
        },
        {
          "type": "color",
          "label": "Background Color",
          "description": "Change main background color.",
          "id": "advBgColor",
          "default": "#000000",
          "css": ".backgroundContainer.withBackdrop {background-color: %value%;}"
        },
        {
          "type": "slider",
          "label": "Backdrop Blur",
          "description": "Adds blur to the backdrop images.",
          "id": "advBackdropBlur",
          "min": 0,
          "max": 50,
          "default": 0,
          "css": ":root{--bgblur: blur(%value%px)}.backdropImage {filter: var(--bgblur);}"
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
