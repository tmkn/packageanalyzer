const SampleCheck = {
    name: "sample-check",
    check: pkg => {
        return `This is a sample check for ${pkg.name}`;
    }
};

export default {
    rules: [["warning", SampleCheck]]
};
