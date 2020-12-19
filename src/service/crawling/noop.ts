import { ProviderError } from "../../domain/exception";
import { ResourceProvider } from "../../domain/types/crawling";

export class NoopProvider implements ResourceProvider {
  name: null;
  async search(keyword: string, _: never) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async detail(bid: string, info: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async catalog(bid: string, info: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async chapter(bid: string, cid: string, info: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async serieses(options: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async categories(options: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  async bookList(seriesId: string, page: number, options?: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }
  private async fetchBookList(series: null, page: number, options: null) {
    this.throwError("Noop: Not Implemented");
    return null;
  }

  throwError(message: string, detail?: string, caller?: string): never {
    let error = new ProviderError();
    error.name = null;
    error.message = message;
    if (detail) {
      error.detail = detail;
    }
    if (caller) {
      error.stack = `@${caller}` + error.stack;
    }
    throw error;
  }
}

export const instance = new NoopProvider();
