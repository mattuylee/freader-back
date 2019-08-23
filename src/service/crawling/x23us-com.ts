import { ResourceProvider, ProviderError } from "../../domain/types/crawling";
import { ResourceInformation, RemoteResources } from "../../domain/resource-info";

export class X23usCom implements ResourceProvider {
    readonly name = RemoteResources.X23usCom
    
    async search(keyword: string, _: never) {
        return null
    }
    async detail(bid: string, info: ResourceInformation) {
        return null
    }
    async catalog(bid: string, info: ResourceInformation) {
        return null
    }
    async chapter(bid: string, info: ResourceInformation) {
        return null
    }

    throwError(message: string, detail?: string, caller?: string): never {
        let error: ProviderError = {
            name: this.name,
            stack: `@ResourceProvider: ${this.name}\n@${__filename}`,
            message: message
        }
        if (detail) { error.detail = detail }
        if (caller) {
            error.stack = `@${caller}\n` + error.stack
        }
        throw error
    }
}

export const instance = new X23usCom()