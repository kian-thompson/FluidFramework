## Public API Report File for "@fluidframework/container-loader"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { FluidObject } from '@fluidframework/core-interfaces';
import { IAudienceOwner } from '@fluidframework/container-definitions/internal';
import { IClientDetails } from '@fluidframework/driver-definitions';
import { IConfigProviderBase } from '@fluidframework/core-interfaces';
import { IContainer } from '@fluidframework/container-definitions/internal';
import { IDocumentAttributes } from '@fluidframework/driver-definitions/internal';
import { IDocumentServiceFactory } from '@fluidframework/driver-definitions/internal';
import { IDocumentStorageService } from '@fluidframework/driver-definitions/internal';
import { IFluidCodeDetails } from '@fluidframework/container-definitions/internal';
import { IFluidModule } from '@fluidframework/container-definitions/internal';
import { IHostLoader } from '@fluidframework/container-definitions/internal';
import { ILoader } from '@fluidframework/container-definitions/internal';
import { ILoaderOptions as ILoaderOptions_2 } from '@fluidframework/container-definitions/internal';
import { ILocationRedirectionError } from '@fluidframework/driver-definitions/internal';
import { IProtocolHandler as IProtocolHandler_2 } from '@fluidframework/protocol-base';
import { IProvideFluidCodeDetailsComparer } from '@fluidframework/container-definitions/internal';
import { IQuorumSnapshot } from '@fluidframework/protocol-base';
import { IRequest } from '@fluidframework/core-interfaces';
import { ISignalMessage } from '@fluidframework/driver-definitions';
import { ITelemetryBaseLogger } from '@fluidframework/core-interfaces';
import { ITelemetryLoggerExt } from '@fluidframework/telemetry-utils/internal';
import { IUrlResolver } from '@fluidframework/driver-definitions/internal';

// @public
export enum ConnectionState {
    CatchingUp = 1,
    Connected = 2,
    Disconnected = 0,
    EstablishingConnection = 3
}

// (No @packageDocumentation comment for this package)

```