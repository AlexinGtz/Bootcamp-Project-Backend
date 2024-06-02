import { Config } from "jest";

const config: Config = {
    testEnvironment: "node",
    transform: {
         "^.+\\.ts$": "ts-jest"
    },
    collectCoverageFrom: [
        "./src/**/*.ts",
        "!**/node_modules/**"
    ]
}

export default config