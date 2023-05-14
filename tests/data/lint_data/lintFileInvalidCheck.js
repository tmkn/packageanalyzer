const SampleCheck = {
    name: "sample-check",
    check: pkg => {
        return 23;
    }
};

module.exports = {
    rules: [["error", SampleCheck]]
};
