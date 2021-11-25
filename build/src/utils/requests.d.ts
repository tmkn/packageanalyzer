export declare type Url = `http://${string}` | `https://${string}`;
export declare function downloadJson<T extends object>(url: Url, timeoutLimit?: number): Promise<T | null>;
//# sourceMappingURL=requests.d.ts.map