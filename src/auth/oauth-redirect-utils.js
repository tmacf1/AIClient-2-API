import fs from 'fs';
import path from 'path';

function normalizeHost(hostname, fallbackHost) {
    const host = String(hostname || '').trim();
    if (!host) {
        return fallbackHost;
    }
    if (host === '0.0.0.0') {
        return 'localhost';
    }
    return host;
}

function readConfigFromFile(configPath = 'configs/config.json') {
    try {
        const fullPath = path.resolve(process.cwd(), configPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
    } catch {
        // Ignore file read/parse errors and fallback to current config.
    }
    return {};
}

export function resolveOAuthRedirectAddress(currentConfig = {}, options = {}, defaults = {}) {
    const fallbackProtocol = String(defaults.protocol || 'http').replace(':', '').trim().toLowerCase() || 'http';
    const fallbackHost = normalizeHost(defaults.host || 'localhost', 'localhost');
    const fileConfig = readConfigFromFile();

    const explicitProtocol = String(options.redirectProtocol || '').replace(':', '').trim().toLowerCase();
    const explicitHost = normalizeHost(options.redirectHost || '', fallbackHost);
    if (explicitProtocol && explicitHost) {
        return { protocol: explicitProtocol, host: explicitHost };
    }

    const callbackUrlRaw = String(
        fileConfig.CALLBACK_URL ||
        fileConfig.callback_url ||
        currentConfig.CALLBACK_URL ||
        currentConfig.callback_url ||
        ''
    ).trim();

    if (callbackUrlRaw) {
        try {
            const callbackUrl = new URL(callbackUrlRaw);
            return {
                protocol: callbackUrl.protocol.replace(':', '').trim().toLowerCase() || fallbackProtocol,
                host: normalizeHost(callbackUrl.hostname, fallbackHost)
            };
        } catch {
            // fallback to HOST
        }
    }

    const hostRaw = String(
        fileConfig.HOST ||
        fileConfig.host ||
        currentConfig.HOST ||
        currentConfig.host ||
        ''
    ).trim();
    if (hostRaw) {
        try {
            if (hostRaw.includes('://')) {
                const hostUrl = new URL(hostRaw);
                return {
                    protocol: hostUrl.protocol.replace(':', '').trim().toLowerCase() || fallbackProtocol,
                    host: normalizeHost(hostUrl.hostname, fallbackHost)
                };
            }
            const hostUrl = new URL(`http://${hostRaw}`);
            return {
                protocol: fallbackProtocol,
                host: normalizeHost(hostUrl.hostname, fallbackHost)
            };
        } catch {
            return {
                protocol: fallbackProtocol,
                host: normalizeHost(hostRaw, fallbackHost)
            };
        }
    }

    return {
        protocol: explicitProtocol || fallbackProtocol,
        host: explicitHost || fallbackHost
    };
}
