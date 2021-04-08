import { INpmPackageProvider } from "../../providers/folder";
import { IApplyArgs, IDecoratorStatic } from "./Decorator";

interface IReleaseData {
    published: Date;
}

const ReleaseExtensionSymbol = Symbol();

export const ReleaseDecorator: IDecoratorStatic<
    IReleaseData,
    [INpmPackageProvider]
> = class ReleaseExtension {
    static get key(): Symbol {
        return ReleaseExtensionSymbol;
    }

    constructor(private _provider: INpmPackageProvider) {}

    readonly name: string = `ReleaseDecorator`;

    get key(): Symbol {
        return ReleaseExtension.key;
    }

    async apply({ p }: IApplyArgs): Promise<IReleaseData> {
        const info = await this._provider.getPackageInfo(p.name);

        if (!info) throw new Error(`${this.name}: Couldn't get data`);

        const time = info.time;
        const released = time[p.version];

        if (!released) throw new Error(`${this.name}: Couldn't get release data`);

        return {
            published: new Date(released)
        };
    }
};
