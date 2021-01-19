import { Package } from "../analyzers/package";

//add more data to Package
export interface IExtension {
    extend: (p: Package) => Promise<void>;
}
