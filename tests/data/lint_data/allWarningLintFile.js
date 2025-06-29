const SampleCheck = {
    name: "sample-check",
    check: pkg => {
        return `This is a sample check for ${pkg.name}`;
    }
};

const foo = {
    rules: [["warning", SampleCheck]]
};

export default foo;
