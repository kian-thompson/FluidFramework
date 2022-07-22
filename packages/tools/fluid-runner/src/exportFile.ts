/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import path from "path";
import { ITelemetryLogger } from "@fluidframework/common-definitions";
import { createLocalOdspDocumentServiceFactory } from "@fluidframework/odsp-driver";
import { ChildLogger, PerformanceEvent } from "@fluidframework/telemetry-utils";
// eslint-disable-next-line import/no-internal-modules
import { FileLogger } from "./logger/FileLogger";
import { getArgsValidationError } from "./getArgsValidationError";
import { isOtherBundle, LoadContainerInDivBundle } from "./codeLoaderBundle";
import { FakeUrlResolver } from "./fakeUrlResolver";

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
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const codeLoaderBundle = require(codeLoader);
            if (!isOtherBundle(codeLoaderBundle)) {
                const message = "Code loader bundle is not of type CodeLoaderBundle";
                logger.sendErrorEvent({
                    eventName: "Client_ArgsValidationError",
                    message,
                });
                return { success: false, errorMessage: message };
            }

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
                codeLoaderBundle,
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
    otherBundle: LoadContainerInDivBundle,
): Promise<Record<string, string>> {
    const result = await otherBundle.loadComponentInDiv({
        documentServiceFactory: createLocalOdspDocumentServiceFactory(localOdspSnapshot),
        urlResolver: new FakeUrlResolver(),
        scope: {},
        containerRequest: {},
    });
    if ((await result.container).isDirty) {
        // something
    }

    return { "file1.txt": "some output", "file2.txt": "some other output" };
}
