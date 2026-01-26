module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Best practices
    "no-console": "off", // We use console.log in CLI tools
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-var": "error",
    "prefer-const": "error",

    // Code style
    "arrow-spacing": ["error", { before: true, after: true }],
    "block-spacing": "error",
    "brace-style": ["error", "1tbs", { allowSingleLine: true }],
    "comma-dangle": ["error", "always-multiline"],
    "comma-spacing": ["error", { before: false, after: true }],
    "eol-last": ["error", "always"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "keyword-spacing": ["error", { before: true, after: true }],
    "linebreak-style": ["error", "unix"],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
    "no-trailing-spaces": "error",
    "object-curly-spacing": ["error", "always"],
    quotes: [
      "error",
      "single",
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    semi: ["error", "always"],
    "space-before-blocks": "error",
    "space-before-function-paren": [
      "error",
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "space-infix-ops": "error",

    // ES6+ features
    "arrow-parens": ["error", "always"],
    "no-duplicate-imports": "error",
    "prefer-arrow-callback": "error",
    "prefer-template": "error",
    "template-curly-spacing": ["error", "never"],
  },
  overrides: [
    {
      files: ["**/*.test.js", "**/tests/**/*.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["scripts/**/*.js", "hooks/**/*.js"],
      rules: {
        "no-console": "off", // CLI scripts need console output
      },
    },
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    "*.min.js",
    "examples/**/*",
  ],
};
