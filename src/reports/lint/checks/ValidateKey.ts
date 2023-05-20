import { Package } from "../../../package/package";
import { ILintCheck } from "../LintRule";

interface IValidateKeyConfig {
    key: string;
    validator: (value: unknown) => boolean;
    message?: string;
}

type ValidateKeyParams = string | IValidateKeyConfig;

export class ValidateKey implements ILintCheck<ValidateKeyParams> {
    name = "validate-key";
    check(pkg: Package, params: ValidateKeyParams) {
        if (this.#isKeyParam(params)) {
            const key = params;
            const data = pkg.getData(key);

            if (!data) {
                return `missing key: "${key}" in package.json`;
            }
        } else if (this.#isConfigParam(params)) {
            const { key, validator, message } = params;
            const data = pkg.getData(key);
            const valid = validator(data);

            if (!valid) {
                return message ?? `invalid value for key: "${key}"`;
            }
        } else {
            throw new Error(`invalid params "${JSON.stringify(params)}"`);
        }
    }

    #isKeyParam(param: ValidateKeyParams): param is string {
        return typeof param === "string";
    }

    #isConfigParam(param: ValidateKeyParams): param is IValidateKeyConfig {
        return (
            typeof param === "object" &&
            typeof param.key === "string" &&
            typeof param.validator === "function" &&
            (typeof param.message === "string" || typeof param.message === "undefined")
        );
    }
}
