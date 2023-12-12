"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const auth_1 = __importDefault(require("./auth"));
const connector_1 = __importDefault(require("./connector"));
const datasources_1 = __importDefault(require("./datasources"));
const rules_1 = __importDefault(require("./rules"));
const streams_1 = __importDefault(require("./streams"));
const cluedin_1 = __importDefault(require("./cluedin"));
const mainmodule = {
    auth: auth_1.default,
    connector: connector_1.default,
    datasources: datasources_1.default,
    rules: rules_1.default,
    streams: streams_1.default,
    cluedin: cluedin_1.default
};
module.exports = mainmodule;
