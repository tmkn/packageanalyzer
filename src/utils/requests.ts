import type { Url } from "../reports/Validation.js";

interface IDownloadOptions {
    signal?: AbortSignal;
    timeout?: number;
}

export async function downloadJson<T extends object>(
    url: Url,
    { signal, timeout = 10_000 }: IDownloadOptions = {}
): Promise<T | null> {
    const timeoutSignal = AbortSignal.timeout(timeout);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    const response = await fetch(url, { signal: combinedSignal });
    const data = (await response.json()) as T;

    if (response.ok) return data;

    return null;
}
