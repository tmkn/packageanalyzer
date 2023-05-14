const SampleCheck = {
    name: "sample-check",
    check: pkg => {
        return `This is a sample check for ${pkg.name}`;
    }
};

module.exports = {
    rules: [["warning", SampleCheck]]
};
