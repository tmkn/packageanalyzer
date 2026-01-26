export enum LogLevel {
    Silent = 0,
    Error = 1,
    Warn = 2,
    Info = 3,
    Verbose = 4
}

export type AnalyzerEvent =
    // Lifecycle Events
    | { type: "analysis:start" }
    | { type: "analysis:success" }
    | { type: "analysis:failure" }
    // Logging Events
    | {
          level: LogLevel;
          scope: string;
          message: string;
          timestamp: number;
      };

const EVENT_NAME = "event";

export class AnalyzerEventBus extends EventTarget {
    private _abortController: AbortController = new AbortController();

    emit(payload: AnalyzerEvent): void {
        const event = new CustomEvent(EVENT_NAME, { detail: payload });

        this.dispatchEvent(event);
    }

    on(listener: (event: AnalyzerEvent) => void, options: AddEventListenerOptions = {}): void {
        const wrapper: EventListener = e => {
            listener((e as CustomEvent<AnalyzerEvent>).detail);
        };

        const { signal, ...rest } = options;

        this.addEventListener(EVENT_NAME, wrapper, {
            ...rest,
            signal: signal
                ? AbortSignal.any([signal, this._abortController.signal])
                : this._abortController.signal
        });
    }

    cleanup(): void {
        this._abortController.abort();
        this._abortController = new AbortController();
    }
}
