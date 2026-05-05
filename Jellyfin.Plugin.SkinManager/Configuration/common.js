var getConfigurationPageUrl = function (name) {
    return "configurationpage?name=" + encodeURIComponent(name);
};

window.getConfigurationPageUrl = getConfigurationPageUrl;

var getTabs = function getTabs() {
    return [
        {
            href: getConfigurationPageUrl("SkinManager"),
            name: "Skin Manager"
        },
        {
            href: getConfigurationPageUrl("library"),
            name: "Library"
        },
        {
            href: getConfigurationPageUrl("history"),
            name: "History"
        }
    ];
};

window.getTabs = getTabs;
