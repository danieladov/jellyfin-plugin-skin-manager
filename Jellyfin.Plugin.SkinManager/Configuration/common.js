const getConfigurationPageUrl = (name) => {
    return 'configurationpage?name=' + encodeURIComponent(name);
}

function getTabs() {
    var tabs = [
        {
            href: getConfigurationPageUrl('SkinManager'),
            name: 'Skin Manager'
        },
        {
            href: getConfigurationPageUrl('history'),
            name: 'History'
        }];
    return tabs;
}