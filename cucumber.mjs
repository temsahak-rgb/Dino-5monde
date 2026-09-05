export default {
    paths: [
        "features/**/*.feature"
    ],
    import: [
        "./cucumber-tsx-register.js",
        "features/step-definitions/**/*.ts"
    ],
    tags:
        "@implemented and not @planned",
    format: [
        "progress",
        "html:reports/cucumber.html",
        "junit:reports/cucumber.xml"
    ],
    publish: false,
    strict: true
};
