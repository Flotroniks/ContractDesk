import path from "path";

jest.mock("electron", () => ({
    app: { getAppPath: jest.fn(() => "/tmp/app") },
}));

jest.mock("@/electron/util.js", () => ({
    isDev: jest.fn(),
}), { virtual: true });

import { isDev } from "@/electron/util.js";
import { getPreloadPath, getUIPath, getIconPath } from "@/electron/pathResolver";

type IsDevMock = jest.MockedFunction<typeof isDev>;
const isDevMock = isDev as IsDevMock;
const { app } = jest.requireMock("electron") as { app: { getAppPath: jest.Mock } };

describe("pathResolver", () => {
    beforeEach(() => {
        isDevMock.mockReset();
        app.getAppPath.mockReturnValue("/tmp/app");
    });

    it("returns preload path in dev mode", () => {
        isDevMock.mockReturnValue(true);
        expect(getPreloadPath()).toBe(path.join("/tmp/app", "./", "dist-electron/electron/preload.cjs"));
    });

    it("returns preload path in production mode", () => {
        isDevMock.mockReturnValue(false);
        expect(getPreloadPath()).toBe(path.join("/tmp/app", "../", "dist-electron/electron/preload.cjs"));
    });

    it("returns ui path regardless of env", () => {
        isDevMock.mockReturnValue(true);
        expect(getUIPath()).toBe(path.join("/tmp/app", "dist-react/index.html"));
        isDevMock.mockReturnValue(false);
        expect(getUIPath()).toBe(path.join("/tmp/app", "dist-react/index.html"));
    });

    it("returns icon path for both envs", () => {
        isDevMock.mockReturnValue(true);
        expect(getIconPath()).toBe(path.join("/tmp/app", "./", "templateIcon.png"));
        isDevMock.mockReturnValue(false);
        expect(getIconPath()).toBe(path.join("/tmp/app", "../", "templateIcon.png"));
    });
});
