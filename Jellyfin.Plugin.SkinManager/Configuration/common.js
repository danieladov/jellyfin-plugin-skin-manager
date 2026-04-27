var getConfigurationPageUrl = window.getConfigurationPageUrl || function (name) {
    return "configurationpage?name=" + encodeURIComponent(name);
};

window.getConfigurationPageUrl = getConfigurationPageUrl;

var getTabs = window.getTabs || function getTabs() {
    return [
        {
            href: getConfigurationPageUrl("SkinManager"),
            name: "Skin Manager"
        },
        {
            href: getConfigurationPageUrl("history"),
            name: "History"
        }
    ];
};

window.getTabs = getTabs;
