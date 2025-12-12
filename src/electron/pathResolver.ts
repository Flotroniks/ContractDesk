import { isDev } from "./util.js"
import path from "path"
import { app } from "electron"

/**
 * Resolve the absolute path to the preload bundle that exposes the safe IPC bridge.
 * Uses the dev/prod-aware layout produced by the Electron transpilation step.
 * @returns {string} Absolute preload bundle path.
 */
export function getPreloadPath(): string {
    return path.join(
        app.getAppPath(),
        isDev() ? './' : '../',
        'dist-electron/electron/preload.cjs'
    )
}

/**
 * Resolve the entry HTML served in production when Vite is not running.
 * @returns {string} Path to the renderer index file.
 */
export function getUIPath(): string {
    return path.join(app.getAppPath(), 'dist-react/index.html');
}

/**
 * Resolve the app icon packaged alongside the binaries.
 * @returns {string} Resolved icon path.
 */
export function getIconPath(): string {
    return path.join(
        app.getAppPath(),
        isDev() ? './' : '../',
        'contractdesk-icon.png'
    )
}