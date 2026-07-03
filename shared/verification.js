(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports === "object" && typeof exports.nodeName !== "string") {
        factory(exports);
    } else {
        factory((root.CreduentVerification = {}));
    }
})(typeof self !== "undefined" ? self : this, function (exports) {
    "use strict";

    // In-memory cache for public keys and fetched attestations
    var registryPublicKeyCache = null;

    /**
     * RFC 8785 JSON Canonicalization Scheme (JCS)
     */
    function canonicalize(val) {
        if (val === null) return "null";
        if (typeof val !== "object") {
            return JSON.stringify(val);
        }
        if (Array.isArray(val)) {
            return "[" + val.map(canonicalize).join(",") + "]";
        }
        var keys = Object.keys(val).sort();
        var parts = keys.map(function (k) {
            return JSON.stringify(k) + ":" + canonicalize(val[k]);
        });
        return "{" + parts.join(",") + "}";
    }

    /**
     * Base64 helper to convert string to Uint8Array
     */
    function base64ToBytes(base64) {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(base64, "base64");
        }
        var binaryString = atob(base64);
        var len = binaryString.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Helper to perform HTTP GET text request cross-platform
     */
    function fetchHttpText(url) {
        if (typeof fetch === "function") {
            return fetch(url).then(function (res) {
                if (res.status === 410) {
                    var err = new Error("HTTP 410 Revoked");
                    err.status = 410;
                    throw err;
                }
                if (!res.ok) {
                    throw new Error("Server returned status code " + res.status);
                }
                return res.text();
            });
        } else {
            var https = require("https");
            return new Promise(function (resolve, reject) {
                var req = https.get(url, function (res) {
                    if (res.statusCode === 410) {
                        var err = new Error("HTTP 410 Revoked");
                        err.status = 410;
                        return reject(err);
                    }
                    if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                        return reject(new Error("Server returned status code " + res.statusCode));
                    }
                    var body = "";
                    res.on("data", function (chunk) {
                        body += chunk;
                    });
                    res.on("end", function () {
                        resolve(body);
                    });
                });
                req.on("error", function (err) {
                    reject(err);
                });
                req.setTimeout(5000, function () {
                    req.destroy();
                    reject(new Error("Request timed out after 5000ms"));
                });
            });
        }
    }

    /**
     * Cryptographically verifies raw Ed25519 signature of message using publicKey.
     * Returns a Promise resolving to boolean.
     */
    function verifyRawEd25519(message, signatureB64, publicKey) {
        try {
            var sigBytes = base64ToBytes(signatureB64);
            var dataBytes = typeof Buffer !== "undefined" ? Buffer.from(message) : new TextEncoder().encode(message);

            // Node.js environment
            if (typeof process !== "undefined" && process.versions && process.versions.node) {
                var crypto = require("crypto");
                var keyObject = publicKey;

                if (publicKey.startsWith("ed25519:")) {
                    var pubKeyBase64 = publicKey.split(":", 2)[1];
                    var rawKey = Buffer.from(pubKeyBase64, "base64");
                    var oidHeader = Buffer.from([
                        0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
                    ]);
                    var spkiBuffer = Buffer.concat([oidHeader, rawKey]);
                    keyObject = crypto.createPublicKey({
                        key: spkiBuffer,
                        format: "der",
                        type: "spki",
                    });
                }
                var verified = crypto.verify(null, dataBytes, keyObject, sigBytes);
                return Promise.resolve(verified);
            }

            // Browser Web Crypto API environment
            var pubKeyBase64 = publicKey;
            if (pubKeyBase64.startsWith("ed25519:")) {
                pubKeyBase64 = pubKeyBase64.split(":", 2)[1];
            }
            var rawKeyBytes = base64ToBytes(pubKeyBase64);

            return crypto.subtle
                .importKey("raw", rawKeyBytes, { name: "Ed25519" }, false, ["verify"])
                .then(function (cryptoKey) {
                    return crypto.subtle.verify("Ed25519", cryptoKey, sigBytes, dataBytes);
                })
                .catch(function (err) {
                    console.error("[Creduent Crypto Error]", err);
                    return false;
                });
        } catch (err) {
            console.error("[Creduent Crypto Error]", err);
            return Promise.resolve(false);
        }
    }

    /**
     * Clones data, strips signature/status/expired fields, JCS canonicalizes it,
     * and verifies Ed25519 signature. Returns a Promise resolving to boolean.
     */
    function verifyEd25519Signature(data, signatureB64, publicKey) {
        if (!signatureB64 || !publicKey) {
            return Promise.resolve(false);
        }
        // Clone object
        var dataToVerify = {};
        for (var key in data) {
            if (data.hasOwnProperty(key) && key !== "signature" && key !== "status" && key !== "expired") {
                dataToVerify[key] = data[key];
            }
        }
        var message = canonicalize(dataToVerify);
        return verifyRawEd25519(message, signatureB64, publicKey);
    }

    /**
     * Fetches attestation and registry public key from the registry, then verifies the attestation signature.
     * Checks expiration and revocation.
     * Returns a unified validation result: { isValid, status, message, attestation }
     */
    function fetchAndVerifyRegistryAttestation(agentId, registryUrl) {
        var cleanAgentId =
            agentId.startsWith("agent:/") && !agentId.startsWith("agent://") ? "agent://" + agentId.slice(7) : agentId;

        var attestUrl = registryUrl + "/attest/" + encodeURIComponent(cleanAgentId);
        var pubKeyUrl = registryUrl + "/public-key";

        var attestationDoc = null;
        var rawPubKeyPem = null;

        // 1. Fetch attestation
        return fetchHttpText(attestUrl)
            .then(function (attestRaw) {
                attestationDoc = JSON.parse(attestRaw);

                if (!attestationDoc || !attestationDoc.signature) {
                    return {
                        isValid: false,
                        status: "unverified",
                        message: "Registry attestation record contains no signature.",
                        attestation: attestationDoc,
                    };
                }

                // 2. Check registry revocation status inside document (in addition to HTTP 410)
                if (attestationDoc.revoked === true) {
                    return {
                        isValid: false,
                        status: "revoked",
                        message: "Identity revoked by issuer.",
                        attestation: attestationDoc,
                    };
                }

                // 3. Resolve public key (check cache first)
                if (registryPublicKeyCache) {
                    return Promise.resolve(registryPublicKeyCache);
                }

                return fetchHttpText(pubKeyUrl).then(function (pubKeyRaw) {
                    var pubKeyData = JSON.parse(pubKeyRaw);
                    rawPubKeyPem = pubKeyData.publicKeyPem || pubKeyData.public_key;
                    registryPublicKeyCache = rawPubKeyPem;
                    return rawPubKeyPem;
                });
            })
            .then(function (pubKey) {
                if (!pubKey && !attestationDoc.revoked) {
                    return {
                        isValid: false,
                        status: "unverified",
                        message: "Could not retrieve registry public verification key.",
                        attestation: attestationDoc,
                    };
                }

                // Check if we already returned a final status (e.g. revoked or unverified due to lack of sig)
                if (typeof pubKey === "object" && pubKey !== null && pubKey.status) {
                    return pubKey;
                }

                // 4. Verify signature
                return verifyEd25519Signature(attestationDoc, attestationDoc.signature, pubKey).then(
                    function (signatureVerified) {
                        if (!signatureVerified) {
                            return {
                                isValid: false,
                                status: "unverified",
                                message: "Attestation signature validation failed.",
                                attestation: attestationDoc,
                            };
                        }

                        // 5. Check expiration date (valid_until or expires_at)
                        var expires = attestationDoc.expires_at || attestationDoc.valid_until;
                        if (expires) {
                            var expirationDate = new Date(expires);
                            if (expirationDate.getTime() < Date.now()) {
                                return {
                                    isValid: false,
                                    status: "expired",
                                    message: "Attestation expired on " + expirationDate.toISOString(),
                                    attestation: attestationDoc,
                                };
                            }
                        }

                        // Passed all checks!
                        return {
                            isValid: true,
                            status: attestationDoc.level === "trusted" ? "trusted" : "verified",
                            message: "Cryptographically secure. Attestation valid.",
                            attestation: attestationDoc,
                        };
                    }
                );
            })
            .catch(function (err) {
                if (err.status === 410) {
                    return {
                        isValid: false,
                        status: "revoked",
                        message: "Identity revoked by issuer.",
                        attestation: { agent_id: cleanAgentId, revoked: true },
                    };
                }
                return {
                    isValid: false,
                    status: "unverified",
                    message: "Registry check error: " + err.message,
                    attestation: null,
                };
            });
    }

    // Export functions
    exports.canonicalize = canonicalize;
    exports.base64ToBytes = base64ToBytes;
    exports.verifyRawEd25519 = verifyRawEd25519;
    exports.verifyEd25519Signature = verifyEd25519Signature;
    exports.fetchAndVerifyRegistryAttestation = fetchAndVerifyRegistryAttestation;
});
