const webpack = require("webpack");
const path = require("path");
const MemoryFileSystem = require("memory-fs");

const memoryFs = new MemoryFileSystem();
const compiler = webpack({
    entry: "./src/index.web.ts",
    mode: "development",
    target: "web",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        projectReferences: true,
                        configFile: "./tsconfig.json",
                        transpileOnly: true,
                        // TS5069: Option 'declarationMap' cannot be specified without specifying option 'declaration' or option 'composite'.
                        // introduced when upgrading from 5.5.3 to 5.5.4 ¯\_(ツ)_/¯
                        ignoreDiagnostics: [5069]
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    externals: ["spdx-satisfies"],
    output: {
        filename: "web.js",
        path: path.resolve(__dirname, "dist")
    }
});

compiler.outputFileSystem = memoryFs;

compiler.run((err, stats) => {
    if (err) {
        console.error(err);
        return;
    }

    if (stats.hasErrors()) {
        console.log(
            stats.toString({
                chunks: false, // Makes the build much quieter
                colors: true // Shows colors in the console
            })
        );

        process.exitCode = 1;
    } else console.log(`No NodeJS specific code found for web version!`);
});
