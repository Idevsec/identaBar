// browser-compat.js
// Cross-browser compatibility shim for Chrome and Firefox extension APIs.
// Firefox 109+ supports the chrome.* namespace as an alias for browser.*.
// This shim ensures all code using chrome.* works correctly in both environments.

(function () {
    // If running in a Firefox context where only browser.* is available, map it to chrome.*
    if (typeof globalThis.chrome === "undefined" && typeof globalThis.browser !== "undefined") {
        globalThis.chrome = globalThis.browser;
    }

    // If running in Chrome where browser.* is not available, map chrome.* to browser.*
    if (typeof globalThis.browser === "undefined" && typeof globalThis.chrome !== "undefined") {
        globalThis.browser = globalThis.chrome;
    }
})();
