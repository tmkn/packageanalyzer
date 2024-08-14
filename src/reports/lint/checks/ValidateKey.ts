import { z, ZodType } from "zod";
import { IPackage } from "../../../package/package";
import { ILintCheck } from "../LintRule";

const stringParamSchema = z.string();
const keyConfigParamSchema = z.object({
    key: z.string(),
    validator: z.function().args(z.unknown()).returns(z.boolean()),
    message: z.string().optional()
});

const paramsSchema = z.union([stringParamSchema, keyConfigParamSchema]);

type ValidateKeyParams = z.infer<typeof paramsSchema>;
type StringParam = z.infer<typeof stringParamSchema>;

export class ValidateKey implements ILintCheck<ValidateKeyParams> {
    name = "validate-key";
    check(pkg: IPackage, params: ValidateKeyParams) {
        if (this.#isKeyParam(params)) {
            const key = params;
            const data = pkg.getData(key);

            if (!data) {
                return `missing key: "${key}" in package.json`;
            }
        } else {
            const { key, validator, message } = params;
            const data = pkg.getData(key);
            const valid = validator(data);

            if (!valid) {
                return message ?? `invalid value for key: "${key}"`;
            }
        }
    }

    checkParams(): ZodType<ValidateKeyParams> {
        return paramsSchema;
    }

    #isKeyParam(param: ValidateKeyParams): param is StringParam {
        return stringParamSchema.safeParse(param).success;
    }
}
