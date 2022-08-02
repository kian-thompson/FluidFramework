/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import path from "path";
// import fetch from "node-fetch";
import { ITelemetryLogger } from "@fluidframework/common-definitions";
import { createLocalOdspDocumentServiceFactory } from "@fluidframework/odsp-driver";
import { ChildLogger, PerformanceEvent } from "@fluidframework/telemetry-utils";
// eslint-disable-next-line import/no-internal-modules
import { FileLogger } from "./logger/FileLogger";
import { getArgsValidationError } from "./getArgsValidationError";
// import { isOtherBundle, LoadContainerInDivBundle } from "./codeLoaderBundle";
import { FakeUrlResolver } from "./fakeUrlResolver";
import { Loader } from "@fluidframework/container-loader";
import { ICodeDetailsLoader, LoaderHeader } from "@fluidframework/container-definitions";
// import { IFluidFileConverter, isOtherBundle } from "./codeLoaderBundle";

export type IExportFileResponse = IExportFileResponseSuccess | IExportFileResponseFailure;

interface IExportFileResponseSuccess {
    success: true;
}

interface IExportFileResponseFailure {
    success: false;
    errorMessage: string;
}

export async function exportFile(
    codeLoader: string,
    inputFile: string,
    outputFolder: string,
    scenario: string,
    telemetryFile: string,
): Promise<IExportFileResponse> {
    if (fs.existsSync(telemetryFile)) {
        return { success: false, errorMessage: `Telemetry file already exists [${telemetryFile}]` };
    }

    const fileLogger = new FileLogger(telemetryFile, 50);

    const logger = ChildLogger.create(fileLogger, "LocalSnapshotRunnerApp",
        { all: { Event_Time: () => Date.now() } });

    try {
        await PerformanceEvent.timedExecAsync(logger, { eventName: "ExportFile" }, async () => {
            const jsdom = require('jsdom');
            const { JSDOM } = jsdom;
            const {performance} = require('perf_hooks');
            const fetch = require("node-fetch");

            var htmlPage = '<html><title>My Title</title><body><div></div></body></html>';
            // const jsDOMObject = new JSDOM(htmlPage).window;
            // jsDOMObject.performance = performance;
            const window = new JSDOM(htmlPage).window;
            global.document = window.document;
            global.performance = performance;
            global.fetch = fetch;
            performance.now();

            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const codeLoaderBundle = require(codeLoader);
            // if (!isOtherBundle(codeLoaderBundle)) {
            //     const message = "Code loader bundle is not of type CodeLoaderBundle";
            //     logger.sendErrorEvent({
            //         eventName: "Client_ArgsValidationError",
            //         message,
            //     });
            //     return { success: false, errorMessage: message };
            // }

            const argsValidationError = getArgsValidationError(inputFile, outputFolder, scenario);
            if (argsValidationError) {
                logger.sendErrorEvent({
                    eventName: "Client_ArgsValidationError",
                    message: argsValidationError,
                });
                return { success: false, errorMessage: argsValidationError };
            }

            // TODO: read file stream
            const inputFileContent = fs.readFileSync(inputFile, { encoding: "utf-8" });

            const results = await createContainerAndExecute(
                inputFileContent,
                logger,
                // await codeLoaderBundle.fluidExport,
                new codeLoaderBundle.BohemiaCodeLoader(
                    {
                        windowContext: window,
                        containerEnvironment: "Staging",
                        logger: logger,
                        additionalAllowedCodeOrigins: ["dist/main.bundle.js"],
                      }
                ),
            );
            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (const key in results) {
                fs.appendFileSync(path.join(outputFolder, key), results[key]);
            }
        });
    } catch (error) {
        logger.sendErrorEvent({ eventName: "Client_UnexpectedError" }, error);
        return { success: false, errorMessage: "Unexpected error" };
    } finally {
        await fileLogger.flush();
    }

    return { success: true };
}

export async function createContainerAndExecute(
    localOdspSnapshot: string,
    logger: ITelemetryLogger,
    // otherBundle: IFluidFileConverter,
    codeLoader: ICodeDetailsLoader,
): Promise<Record<string, string>> {
    const loader = new Loader({
        urlResolver: new FakeUrlResolver(),
        documentServiceFactory: createLocalOdspDocumentServiceFactory(localOdspSnapshot),
        // codeLoader: new BohemiaCodeLoader({
        //     windowContext: new Window(),
        //     containerEnvironment: ContainerEnvironment.Prod,
        // }),
        codeLoader,
    });

    console.log("1");
    const container = await loader.resolve({ url: "/fakeUrl/", headers: {
        [LoaderHeader.loadMode]: { opsBeforeReturn: "cached" } } });
    console.log("2");
    if (container.isDirty) {
        // asd
    }

    return { "file1.txt": "some output", "file2.txt": "some other output" };
}
