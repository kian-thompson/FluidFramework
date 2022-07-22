/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { ITelemetryBaseLogger } from "@fluidframework/common-definitions";
import { ICodeDetailsLoader, IContainer } from "@fluidframework/container-definitions";
import { FluidObject, IFluidObject } from "@fluidframework/core-interfaces";

/**
 * Contract that defines the necessary exports for the bundle provided at runtime
 * For an example, see "src/test/sampleCodeLoader.ts"
 */
 export interface ICodeLoaderBundle {
    /**
     * Fluid export of all the required objects and functions
     */
    fluidExport: Promise<IFluidFileConverter>;
}

/**
 * Instance that holds all the details for Fluid file conversion
 */
export interface IFluidFileConverter {
    /**
     * Code loader details to provide at Loader creation
     */
    codeLoader: ICodeDetailsLoader;

    /**
     * Scope object to provide at Loader creation
     */
    scope?: FluidObject;

    /**
     * Execute code and return the results
     * @param container - container created by this application
     * @param logger - TODO
     * @returns - object containing file names as property keys and file content as values
     */
    execute(container: IContainer, logger: ITelemetryBaseLogger): Promise<Record<string, string>>;
}

/**
 * Type cast to ensure necessary methods are present in the provided bundle
 * @param bundle - TODO
 */
export function isCodeLoaderBundle(bundle: any): bundle is ICodeLoaderBundle {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return bundle?.fluidExport && typeof bundle.fluidExport === "object";
}

interface LoadedInfo {
    /**
     * Promise of IFluidObject contracts available on the component.
     */
    component: Promise<IFluidObject>;

    /**
     * Lifecycle container contracts available on the container.
     */
    container: Promise<IContainer>;
}

export interface LoadContainerInDivBundle {
    loadComponentInDiv({ documentServiceFactory, urlResolver, scope, containerRequest }): Promise<LoadedInfo>;
}

export function isOtherBundle(bundle: any): bundle is LoadContainerInDivBundle {
    if (!bundle) {
        console.log("undefined");
    } else {
        console.log(JSON.stringify(bundle));
    }
    if (bundle.save) {
        console.log("found other");
    }
    if (bundle?.loadComponentInDiv) {
        console.log("found");
        console.log(typeof bundle.loadComponentInDiv);
    } else {
        console.log("not found");
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return bundle?.loadComponentInDiv && typeof bundle.loadComponentInDiv === "function";
}
