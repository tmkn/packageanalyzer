import * as express from "express";
export interface IMockServer {
    port: number;
    close(): Promise<void>;
}
declare abstract class AbstractMockServer {
    abstract name: string;
    private _server;
    protected _app: express.Application;
    port: number;
    abstract setup(): void;
    start(port: number): Promise<void>;
    close(): Promise<void>;
}
export declare function createMockServer(server: AbstractMockServer): Promise<void>;
export declare function createMockNpmServer(): Promise<IMockServer>;
export declare function createMockDownloadServer(): Promise<IMockServer>;
export declare function createMockRequestServer(): Promise<IMockServer>;
export {};
//# sourceMappingURL=server.d.ts.map