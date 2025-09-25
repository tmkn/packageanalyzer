import z from "zod";

import type {
    AttachmentData,
    Attachments
} from "../../../../shared/src/attachments/Attachments.js";
import type { IPackage } from "../../../../shared/src/package/package.js";
import type { ILintCheck } from "./LintRule.js";

class RuleBuilder<Name extends string, A extends Attachments, P extends z.ZodType> {
    private _attachments: A = {} as A;
    private _params: P = z.undefined() as unknown as P;

    constructor(private readonly _name: Name) {}

    withAttachments<T extends Attachments>(attachments: T): RuleBuilder<Name, T, P> {
        this._attachments = attachments as unknown as A;

        return this as unknown as RuleBuilder<Name, T, P>;
    }

    withParams<T extends z.ZodType>(params: T): RuleBuilder<Name, A, T> {
        this._params = params as unknown as P;

        return this as unknown as RuleBuilder<Name, A, T>;
    }

    check(
        check: (pkg: IPackage<AttachmentData<A>>, params: z.infer<P>) => string | void | string[]
    ) {
        return {
            build: (): Readonly<ILintCheck<z.infer<P>, A>> => {
                const hasParams = !(this._params instanceof z.ZodUndefined);
                const hasAttachments = Object.keys(this._attachments).length > 0;

                const baseRule = {
                    name: this._name,
                    check: check
                };

                let composedRule: any = baseRule;

                if (hasParams) {
                    composedRule = { ...baseRule, checkParams: () => this._params };
                }

                if (hasAttachments) {
                    composedRule = { ...composedRule, attachments: this._attachments };
                }

                return Object.freeze(composedRule as ILintCheck<z.infer<P>, A>);
            }
        };
    }
}

export function rule<T extends string>(name: T) {
    return new RuleBuilder<T, Record<string, never>, z.ZodUndefined>(name);
}
