import path from "path";
import { createJiti } from "jiti";

export async function loadConfig(configPath: string): Promise<unknown> {
    const jiti = createJiti(import.meta.url);
    const resolvedPath = path.resolve(process.cwd(), configPath);
    const config = await jiti.import(resolvedPath, { default: true });

    return config;
}
