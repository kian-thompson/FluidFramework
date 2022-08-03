/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import path from "path";
import { strict as assert } from "assert";
import { exportFile } from "../exportFile";

describe("exportFile", () => {
    const folderRoot = path.join(__dirname, "../../src/test");
    const outputFolder = path.join(folderRoot, "outputFolder");
    const snapshotFolder = path.join(folderRoot, "localOdspSnapshots");

    fs.readdirSync(snapshotFolder).forEach((snapshotFileName: string) => {
        describe(snapshotFileName, () => {
            beforeEach(() => {
                fs.mkdirSync(outputFolder);
            });

            afterEach(() => {
                fs.rmdirSync(outputFolder, { recursive: true });
            });

            it("AAAAA", async () => {
                const result = await exportFile(
                    "C:\\Users\\kianthompson\\Downloads\\BohemiaCodeLoader.node.js",
                    // eslint-disable-next-line max-len
                    "C:\\Users\\kianthompson\\Documents\\FluidFrameworkMain\\packages\\tools\\fluid-runner\\src\\test\\localOdspSnapshots\\odspSnapshot2.json",
                    outputFolder,
                    "sampleScenario",
                    path.join(outputFolder, "telemetry.txt"),
                );

                assert(result.success, "result file does not exist");
            }).timeout(30000);
        });
    });
});
