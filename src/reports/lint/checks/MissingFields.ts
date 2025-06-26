import { z } from "zod";
import type { IPackage } from "../../../package/package.js";
import { type ILintCheck } from "../LintRule.js";

const configValidatorScheme = z.object({
    path: z.string(),
    validator: z.function().args(z.unknown()).returns(z.boolean())
});

const missingFieldConfigSchema = z.object({
    fields: z.array(z.union([z.string(), configValidatorScheme]))
});

export type IMissingFieldConfig = z.infer<typeof missingFieldConfigSchema>;

export class MissingFields implements ILintCheck<IMissingFieldConfig> {
    name: string = "missing-field";

    check(pkg: IPackage, { fields }: IMissingFieldConfig) {
        const messages: string[] = [];

        for (const field of fields) {
            if (this.#isStringField(field)) {
                if (!pkg.getData(field)) {
                    messages.push(`missing field: ${field}`);
                }
            } else if (!field.validator(pkg.getData(field.path))) {
                messages.push(`invalid field: ${field.path}`);
            }
        }

        return messages;
    }

    checkParams() {
        return missingFieldConfigSchema;
    }

    #isStringField(field: unknown): field is string {
        return z.string().safeParse(field).success;
    }
}
