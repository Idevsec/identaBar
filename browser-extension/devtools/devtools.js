// devtools.js - Creates the Creduent Panel inside Chrome DevTools
chrome.devtools.panels.create("Creduent", "/assets/icons/icon16.png", "devtools/panel.html", function (panel) {
    console.log("[Creduent] DevTools Panel created successfully.");
});
