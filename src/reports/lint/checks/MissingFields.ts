import type { Package } from "../../../package/package";
import { ILintCheck } from "../LintRule";

interface IConfigValidator {
    path: string;
    validator: (value: unknown) => boolean;
}

export interface IMissingFieldConfig {
    fields: Array<string | IConfigValidator>;
}

export class MissingFields implements ILintCheck<IMissingFieldConfig> {
    name: string = "missing-field";

    check(pkg: Package, { fields }: IMissingFieldConfig) {
        const messages: string[] = [];

        for (const field of fields) {
            if (typeof field === "string") {
                if (!pkg.getData(field)) {
                    messages.push(`missing field: ${field}`);
                }
            } else {
                if (!field.validator(pkg.getData(field.path))) {
                    messages.push(`invalid field: ${field.path}`);
                }
            }
        }

        return messages;
    }
}
