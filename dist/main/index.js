/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__nccwpck_require__(37));
const utils_1 = __nccwpck_require__(278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(37));
const path = __importStar(__nccwpck_require__(17));
const oidc_utils_1 = __nccwpck_require__(41);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    return inputs;
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    command_1.issueCommand('error', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    command_1.issueCommand('warning', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    command_1.issueCommand('notice', utils_1.toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
function getIDToken(aud) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
    });
}
exports.getIDToken = getIDToken;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issueCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(147));
const os = __importStar(__nccwpck_require__(37));
const utils_1 = __nccwpck_require__(278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 41:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OidcClient = void 0;
const http_client_1 = __nccwpck_require__(925);
const auth_1 = __nccwpck_require__(702);
const core_1 = __nccwpck_require__(186);
class OidcClient {
    static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry
        };
        return new http_client_1.HttpClient('actions/oidc-client', [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
    }
    static getRequestToken() {
        const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        if (!token) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable');
        }
        return token;
    }
    static getIDTokenUrl() {
        const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
        if (!runtimeUrl) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable');
        }
        return runtimeUrl;
    }
    static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
                .getJson(id_token_url)
                .catch(error => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.result.message}`);
            });
            const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
                throw new Error('Response json body do not have ID Token field');
            }
            return id_token;
        });
    }
    static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // New ID Token is requested from action service
                let id_token_url = OidcClient.getIDTokenUrl();
                if (audience) {
                    const encodedAudience = encodeURIComponent(audience);
                    id_token_url = `${id_token_url}&audience=${encodedAudience}`;
                }
                core_1.debug(`ID token url is ${id_token_url}`);
                const id_token = yield OidcClient.getCall(id_token_url);
                core_1.setSecret(id_token);
                return id_token;
            }
            catch (error) {
                throw new Error(`Error message: ${error.message}`);
            }
        });
    }
}
exports.OidcClient = OidcClient;
//# sourceMappingURL=oidc-utils.js.map

/***/ }),

/***/ 278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 702:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
class BasicCredentialHandler {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' +
                Buffer.from(this.username + ':' + this.password).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BasicCredentialHandler = BasicCredentialHandler;
class BearerCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] = 'Bearer ' + this.token;
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.BearerCredentialHandler = BearerCredentialHandler;
class PersonalAccessTokenCredentialHandler {
    constructor(token) {
        this.token = token;
    }
    // currently implements pre-authorization
    // TODO: support preAuth = false where it hooks on 401
    prepareRequest(options) {
        options.headers['Authorization'] =
            'Basic ' + Buffer.from('PAT:' + this.token).toString('base64');
    }
    // This handler cannot handle 401
    canHandleAuthentication(response) {
        return false;
    }
    handleAuthentication(httpClient, requestInfo, objs) {
        return null;
    }
}
exports.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;


/***/ }),

/***/ 925:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const http = __nccwpck_require__(685);
const https = __nccwpck_require__(687);
const pm = __nccwpck_require__(443);
let tunnel;
var HttpCodes;
(function (HttpCodes) {
    HttpCodes[HttpCodes["OK"] = 200] = "OK";
    HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
    HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
    HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
    HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
    HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
    HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
    HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
    HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
    HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
    HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
    HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
    HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
    HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
    HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
    HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
    HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
    HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
    HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
    HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
    HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
    HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
    HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
    HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
    HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
    HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes = exports.HttpCodes || (exports.HttpCodes = {}));
var Headers;
(function (Headers) {
    Headers["Accept"] = "accept";
    Headers["ContentType"] = "content-type";
})(Headers = exports.Headers || (exports.Headers = {}));
var MediaTypes;
(function (MediaTypes) {
    MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes = exports.MediaTypes || (exports.MediaTypes = {}));
/**
 * Returns the proxy URL, depending upon the supplied url and proxy environment variables.
 * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
 */
function getProxyUrl(serverUrl) {
    let proxyUrl = pm.getProxyUrl(new URL(serverUrl));
    return proxyUrl ? proxyUrl.href : '';
}
exports.getProxyUrl = getProxyUrl;
const HttpRedirectCodes = [
    HttpCodes.MovedPermanently,
    HttpCodes.ResourceMoved,
    HttpCodes.SeeOther,
    HttpCodes.TemporaryRedirect,
    HttpCodes.PermanentRedirect
];
const HttpResponseRetryCodes = [
    HttpCodes.BadGateway,
    HttpCodes.ServiceUnavailable,
    HttpCodes.GatewayTimeout
];
const RetryableHttpVerbs = ['OPTIONS', 'GET', 'DELETE', 'HEAD'];
const ExponentialBackoffCeiling = 10;
const ExponentialBackoffTimeSlice = 5;
class HttpClientError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'HttpClientError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}
exports.HttpClientError = HttpClientError;
class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }
    readBody() {
        return new Promise(async (resolve, reject) => {
            let output = Buffer.alloc(0);
            this.message.on('data', (chunk) => {
                output = Buffer.concat([output, chunk]);
            });
            this.message.on('end', () => {
                resolve(output.toString());
            });
        });
    }
}
exports.HttpClientResponse = HttpClientResponse;
function isHttps(requestUrl) {
    let parsedUrl = new URL(requestUrl);
    return parsedUrl.protocol === 'https:';
}
exports.isHttps = isHttps;
class HttpClient {
    constructor(userAgent, handlers, requestOptions) {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._disposed = false;
        this.userAgent = userAgent;
        this.handlers = handlers || [];
        this.requestOptions = requestOptions;
        if (requestOptions) {
            if (requestOptions.ignoreSslError != null) {
                this._ignoreSslError = requestOptions.ignoreSslError;
            }
            this._socketTimeout = requestOptions.socketTimeout;
            if (requestOptions.allowRedirects != null) {
                this._allowRedirects = requestOptions.allowRedirects;
            }
            if (requestOptions.allowRedirectDowngrade != null) {
                this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
            }
            if (requestOptions.maxRedirects != null) {
                this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
            }
            if (requestOptions.keepAlive != null) {
                this._keepAlive = requestOptions.keepAlive;
            }
            if (requestOptions.allowRetries != null) {
                this._allowRetries = requestOptions.allowRetries;
            }
            if (requestOptions.maxRetries != null) {
                this._maxRetries = requestOptions.maxRetries;
            }
        }
    }
    options(requestUrl, additionalHeaders) {
        return this.request('OPTIONS', requestUrl, null, additionalHeaders || {});
    }
    get(requestUrl, additionalHeaders) {
        return this.request('GET', requestUrl, null, additionalHeaders || {});
    }
    del(requestUrl, additionalHeaders) {
        return this.request('DELETE', requestUrl, null, additionalHeaders || {});
    }
    post(requestUrl, data, additionalHeaders) {
        return this.request('POST', requestUrl, data, additionalHeaders || {});
    }
    patch(requestUrl, data, additionalHeaders) {
        return this.request('PATCH', requestUrl, data, additionalHeaders || {});
    }
    put(requestUrl, data, additionalHeaders) {
        return this.request('PUT', requestUrl, data, additionalHeaders || {});
    }
    head(requestUrl, additionalHeaders) {
        return this.request('HEAD', requestUrl, null, additionalHeaders || {});
    }
    sendStream(verb, requestUrl, stream, additionalHeaders) {
        return this.request(verb, requestUrl, stream, additionalHeaders);
    }
    /**
     * Gets a typed object from an endpoint
     * Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
     */
    async getJson(requestUrl, additionalHeaders = {}) {
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        let res = await this.get(requestUrl, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async postJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.post(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async putJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.put(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    async patchJson(requestUrl, obj, additionalHeaders = {}) {
        let data = JSON.stringify(obj, null, 2);
        additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
        additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
        let res = await this.patch(requestUrl, data, additionalHeaders);
        return this._processResponse(res, this.requestOptions);
    }
    /**
     * Makes a raw http request.
     * All other methods such as get, post, patch, and request ultimately call this.
     * Prefer get, del, post and patch
     */
    async request(verb, requestUrl, data, headers) {
        if (this._disposed) {
            throw new Error('Client has already been disposed.');
        }
        let parsedUrl = new URL(requestUrl);
        let info = this._prepareRequest(verb, parsedUrl, headers);
        // Only perform retries on reads since writes may not be idempotent.
        let maxTries = this._allowRetries && RetryableHttpVerbs.indexOf(verb) != -1
            ? this._maxRetries + 1
            : 1;
        let numTries = 0;
        let response;
        while (numTries < maxTries) {
            response = await this.requestRaw(info, data);
            // Check if it's an authentication challenge
            if (response &&
                response.message &&
                response.message.statusCode === HttpCodes.Unauthorized) {
                let authenticationHandler;
                for (let i = 0; i < this.handlers.length; i++) {
                    if (this.handlers[i].canHandleAuthentication(response)) {
                        authenticationHandler = this.handlers[i];
                        break;
                    }
                }
                if (authenticationHandler) {
                    return authenticationHandler.handleAuthentication(this, info, data);
                }
                else {
                    // We have received an unauthorized response but have no handlers to handle it.
                    // Let the response return to the caller.
                    return response;
                }
            }
            let redirectsRemaining = this._maxRedirects;
            while (HttpRedirectCodes.indexOf(response.message.statusCode) != -1 &&
                this._allowRedirects &&
                redirectsRemaining > 0) {
                const redirectUrl = response.message.headers['location'];
                if (!redirectUrl) {
                    // if there's no location to redirect to, we won't
                    break;
                }
                let parsedRedirectUrl = new URL(redirectUrl);
                if (parsedUrl.protocol == 'https:' &&
                    parsedUrl.protocol != parsedRedirectUrl.protocol &&
                    !this._allowRedirectDowngrade) {
                    throw new Error('Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.');
                }
                // we need to finish reading the response before reassigning response
                // which will leak the open socket.
                await response.readBody();
                // strip authorization header if redirected to a different hostname
                if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
                    for (let header in headers) {
                        // header names are case insensitive
                        if (header.toLowerCase() === 'authorization') {
                            delete headers[header];
                        }
                    }
                }
                // let's make the request with the new redirectUrl
                info = this._prepareRequest(verb, parsedRedirectUrl, headers);
                response = await this.requestRaw(info, data);
                redirectsRemaining--;
            }
            if (HttpResponseRetryCodes.indexOf(response.message.statusCode) == -1) {
                // If not a retry code, return immediately instead of retrying
                return response;
            }
            numTries += 1;
            if (numTries < maxTries) {
                await response.readBody();
                await this._performExponentialBackoff(numTries);
            }
        }
        return response;
    }
    /**
     * Needs to be called if keepAlive is set to true in request options.
     */
    dispose() {
        if (this._agent) {
            this._agent.destroy();
        }
        this._disposed = true;
    }
    /**
     * Raw request.
     * @param info
     * @param data
     */
    requestRaw(info, data) {
        return new Promise((resolve, reject) => {
            let callbackForResult = function (err, res) {
                if (err) {
                    reject(err);
                }
                resolve(res);
            };
            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }
    /**
     * Raw request with callback.
     * @param info
     * @param data
     * @param onResult
     */
    requestRawWithCallback(info, data, onResult) {
        let socket;
        if (typeof data === 'string') {
            info.options.headers['Content-Length'] = Buffer.byteLength(data, 'utf8');
        }
        let callbackCalled = false;
        let handleResult = (err, res) => {
            if (!callbackCalled) {
                callbackCalled = true;
                onResult(err, res);
            }
        };
        let req = info.httpModule.request(info.options, (msg) => {
            let res = new HttpClientResponse(msg);
            handleResult(null, res);
        });
        req.on('socket', sock => {
            socket = sock;
        });
        // If we ever get disconnected, we want the socket to timeout eventually
        req.setTimeout(this._socketTimeout || 3 * 60000, () => {
            if (socket) {
                socket.end();
            }
            handleResult(new Error('Request timeout: ' + info.options.path), null);
        });
        req.on('error', function (err) {
            // err has statusCode property
            // res should have headers
            handleResult(err, null);
        });
        if (data && typeof data === 'string') {
            req.write(data, 'utf8');
        }
        if (data && typeof data !== 'string') {
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        }
        else {
            req.end();
        }
    }
    /**
     * Gets an http agent. This function is useful when you need an http agent that handles
     * routing through a proxy server - depending upon the url and proxy environment variables.
     * @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
     */
    getAgent(serverUrl) {
        let parsedUrl = new URL(serverUrl);
        return this._getAgent(parsedUrl);
    }
    _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        const usingSsl = info.parsedUrl.protocol === 'https:';
        info.httpModule = usingSsl ? https : http;
        const defaultPort = usingSsl ? 443 : 80;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = info.parsedUrl.port
            ? parseInt(info.parsedUrl.port)
            : defaultPort;
        info.options.path =
            (info.parsedUrl.pathname || '') + (info.parsedUrl.search || '');
        info.options.method = method;
        info.options.headers = this._mergeHeaders(headers);
        if (this.userAgent != null) {
            info.options.headers['user-agent'] = this.userAgent;
        }
        info.options.agent = this._getAgent(info.parsedUrl);
        // gives handlers an opportunity to participate
        if (this.handlers) {
            this.handlers.forEach(handler => {
                handler.prepareRequest(info.options);
            });
        }
        return info;
    }
    _mergeHeaders(headers) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        if (this.requestOptions && this.requestOptions.headers) {
            return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers));
        }
        return lowercaseKeys(headers || {});
    }
    _getExistingOrDefaultHeader(additionalHeaders, header, _default) {
        const lowercaseKeys = obj => Object.keys(obj).reduce((c, k) => ((c[k.toLowerCase()] = obj[k]), c), {});
        let clientHeader;
        if (this.requestOptions && this.requestOptions.headers) {
            clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
        }
        return additionalHeaders[header] || clientHeader || _default;
    }
    _getAgent(parsedUrl) {
        let agent;
        let proxyUrl = pm.getProxyUrl(parsedUrl);
        let useProxy = proxyUrl && proxyUrl.hostname;
        if (this._keepAlive && useProxy) {
            agent = this._proxyAgent;
        }
        if (this._keepAlive && !useProxy) {
            agent = this._agent;
        }
        // if agent is already assigned use that agent.
        if (!!agent) {
            return agent;
        }
        const usingSsl = parsedUrl.protocol === 'https:';
        let maxSockets = 100;
        if (!!this.requestOptions) {
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        if (useProxy) {
            // If using proxy, need tunnel
            if (!tunnel) {
                tunnel = __nccwpck_require__(294);
            }
            const agentOptions = {
                maxSockets: maxSockets,
                keepAlive: this._keepAlive,
                proxy: {
                    ...((proxyUrl.username || proxyUrl.password) && {
                        proxyAuth: `${proxyUrl.username}:${proxyUrl.password}`
                    }),
                    host: proxyUrl.hostname,
                    port: proxyUrl.port
                }
            };
            let tunnelAgent;
            const overHttps = proxyUrl.protocol === 'https:';
            if (usingSsl) {
                tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
            }
            else {
                tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
            }
            agent = tunnelAgent(agentOptions);
            this._proxyAgent = agent;
        }
        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
            this._agent = agent;
        }
        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            agent = usingSsl ? https.globalAgent : http.globalAgent;
        }
        if (usingSsl && this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, {
                rejectUnauthorized: false
            });
        }
        return agent;
    }
    _performExponentialBackoff(retryNumber) {
        retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
        const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
        return new Promise(resolve => setTimeout(() => resolve(), ms));
    }
    static dateTimeDeserializer(key, value) {
        if (typeof value === 'string') {
            let a = new Date(value);
            if (!isNaN(a.valueOf())) {
                return a;
            }
        }
        return value;
    }
    async _processResponse(res, options) {
        return new Promise(async (resolve, reject) => {
            const statusCode = res.message.statusCode;
            const response = {
                statusCode: statusCode,
                result: null,
                headers: {}
            };
            // not found leads to null obj returned
            if (statusCode == HttpCodes.NotFound) {
                resolve(response);
            }
            let obj;
            let contents;
            // get the result from the body
            try {
                contents = await res.readBody();
                if (contents && contents.length > 0) {
                    if (options && options.deserializeDates) {
                        obj = JSON.parse(contents, HttpClient.dateTimeDeserializer);
                    }
                    else {
                        obj = JSON.parse(contents);
                    }
                    response.result = obj;
                }
                response.headers = res.message.headers;
            }
            catch (err) {
                // Invalid resource (contents not json);  leaving result obj null
            }
            // note that 3xx redirects are handled by the http layer.
            if (statusCode > 299) {
                let msg;
                // if exception/error in body, attempt to get better error
                if (obj && obj.message) {
                    msg = obj.message;
                }
                else if (contents && contents.length > 0) {
                    // it may be the case that the exception is in the body message as string
                    msg = contents;
                }
                else {
                    msg = 'Failed request: (' + statusCode + ')';
                }
                let err = new HttpClientError(msg, statusCode);
                err.result = response.result;
                reject(err);
            }
            else {
                resolve(response);
            }
        });
    }
}
exports.HttpClient = HttpClient;


/***/ }),

/***/ 443:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function getProxyUrl(reqUrl) {
    let usingSsl = reqUrl.protocol === 'https:';
    let proxyUrl;
    if (checkBypass(reqUrl)) {
        return proxyUrl;
    }
    let proxyVar;
    if (usingSsl) {
        proxyVar = process.env['https_proxy'] || process.env['HTTPS_PROXY'];
    }
    else {
        proxyVar = process.env['http_proxy'] || process.env['HTTP_PROXY'];
    }
    if (proxyVar) {
        proxyUrl = new URL(proxyVar);
    }
    return proxyUrl;
}
exports.getProxyUrl = getProxyUrl;
function checkBypass(reqUrl) {
    if (!reqUrl.hostname) {
        return false;
    }
    let noProxy = process.env['no_proxy'] || process.env['NO_PROXY'] || '';
    if (!noProxy) {
        return false;
    }
    // Determine the request port
    let reqPort;
    if (reqUrl.port) {
        reqPort = Number(reqUrl.port);
    }
    else if (reqUrl.protocol === 'http:') {
        reqPort = 80;
    }
    else if (reqUrl.protocol === 'https:') {
        reqPort = 443;
    }
    // Format the request hostname and hostname with port
    let upperReqHosts = [reqUrl.hostname.toUpperCase()];
    if (typeof reqPort === 'number') {
        upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
    }
    // Compare request host against noproxy
    for (let upperNoProxyItem of noProxy
        .split(',')
        .map(x => x.trim().toUpperCase())
        .filter(x => x)) {
        if (upperReqHosts.some(x => x === upperNoProxyItem)) {
            return true;
        }
    }
    return false;
}
exports.checkBypass = checkBypass;


/***/ }),

/***/ 308:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

(()=>{var e={497:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.isExternalAccount=t.isServiceAccountKey=t.parseCredential=void 0;const r=n(976);const s=n(102);function parseCredential(e){e=(e||"").trim();if(!e){throw new Error(`Missing service account key JSON (got empty value)`)}if(!e.startsWith("{")){e=(0,s.fromBase64)(e)}try{const t=JSON.parse(e);return t}catch(e){const t=(0,r.errorMessage)(e);throw new SyntaxError(`Failed to parse service account key JSON credentials: ${t}`)}}t.parseCredential=parseCredential;function isServiceAccountKey(e){return e.type==="service_account"}t.isServiceAccountKey=isServiceAccountKey;function isExternalAccount(e){return e.type!=="external_account"}t.isExternalAccount=isExternalAccount;t["default"]={parseCredential:parseCredential,isServiceAccountKey:isServiceAccountKey,isExternalAccount:isExternalAccount}},962:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.parseCSV=void 0;function parseCSV(e){e=(e||"").trim();if(!e){return[]}const t=e.split(/(?<!\\),/gi);for(let e=0;e<t.length;e++){t[e]=t[e].trim().replace(/\\,/gi,",")}return t}t.parseCSV=parseCSV},102:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.fromBase64=t.toBase64=void 0;function toBase64(e){return Buffer.from(e).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}t.toBase64=toBase64;function fromBase64(e){let t=e.replace(/-/g,"+").replace(/_/g,"/");while(t.length%4)t+="=";return Buffer.from(t,"base64").toString("utf8")}t.fromBase64=fromBase64},976:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.errorMessage=void 0;function errorMessage(e){if(!e)return"";const t=(e instanceof Error?e.message:`${e}`).trim().replace("Error: ","").trim();if(!t)return"";if(t.length>1&&isUpper(t[0])&&!isUpper(t[1])){return t[0].toLowerCase()+t.slice(1)}return t}t.errorMessage=errorMessage;function isUpper(e){return e===e.toUpperCase()}},219:function(e,t,n){"use strict";var r=this&&this.__awaiter||function(e,t,n,r){function adopt(e){return e instanceof n?e:new n((function(t){t(e)}))}return new(n||(n=Promise))((function(n,s){function fulfilled(e){try{step(r.next(e))}catch(e){s(e)}}function rejected(e){try{step(r["throw"](e))}catch(e){s(e)}}function step(e){e.done?n(e.value):adopt(e.value).then(fulfilled,rejected)}step((r=r.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:true});t.removeFile=t.writeSecureFile=void 0;const s=n(147);const i=n(976);function writeSecureFile(e,t){return r(this,void 0,void 0,(function*(){yield s.promises.writeFile(e,t,{mode:416,flag:"wx"});return e}))}t.writeSecureFile=writeSecureFile;function removeFile(e){return r(this,void 0,void 0,(function*(){try{yield s.promises.unlink(e);return true}catch(t){const n=(0,i.errorMessage)(t);if(n.toUpperCase().includes("ENOENT")){return false}throw new Error(`Failed to remove "${e}": ${n}`)}}))}t.removeFile=removeFile},144:function(e,t,n){"use strict";var r=this&&this.__createBinding||(Object.create?function(e,t,n,r){if(r===undefined)r=n;Object.defineProperty(e,r,{enumerable:true,get:function(){return t[n]}})}:function(e,t,n,r){if(r===undefined)r=n;e[r]=t[n]});var s=this&&this.__exportStar||function(e,t){for(var n in e)if(n!=="default"&&!Object.prototype.hasOwnProperty.call(t,n))r(t,e,n)};Object.defineProperty(t,"__esModule",{value:true});s(n(497),t);s(n(962),t);s(n(102),t);s(n(976),t);s(n(219),t);s(n(575),t);s(n(318),t);s(n(570),t);s(n(816),t);s(n(596),t)},575:function(e,t,n){"use strict";var r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:true});t.parseKVStringAndFile=t.parseKVYAML=t.parseKVJSON=t.parseKVFile=t.parseKVString=void 0;const s=r(n(603));const i=n(147);const o=n(976);function parseKVString(e){e=(e||"").trim();if(!e){return{}}const t={};const n=e.split(/(?<!\\),/gi);for(let e=0;e<n.length;e++){const r=n[e];const s=r.indexOf("=");if(!s||s===-1){throw new SyntaxError(`Failed to parse KEY=VALUE pair "${r}": missing "="`)}const i=r.slice(0,s).trim().replace(/\\,/gi,",");const o=r.slice(s+1).trim().replace(/\\,/gi,",");if(!i||!o){throw new SyntaxError(`Failed to parse KEY=VALUE pair "${r}": no value`)}t[i]=o}return t}t.parseKVString=parseKVString;function parseKVFile(e){try{const t=(0,i.readFileSync)(e,"utf-8");if(t&&t.trim()&&t.trim()[0]==="{"){return parseKVJSON(t)}return parseKVYAML(t)}catch(t){const n=(0,o.errorMessage)(t);throw new Error(`Failed to read file '${e}': ${n}`)}}t.parseKVFile=parseKVFile;function parseKVJSON(e){e=(e||"").trim();if(!e){return{}}try{const t=JSON.parse(e);const n={};for(const[e,r]of Object.entries(t)){if(typeof e!=="string"){throw new SyntaxError(`Failed to parse key "${e}", expected string, got ${typeof e}`)}if(e.trim()===""){throw new SyntaxError(`Failed to parse key "${e}", expected at least one character`)}if(typeof r!=="string"){const t=JSON.stringify(r);throw new SyntaxError(`Failed to parse value "${t}" for "${e}", expected string, got ${typeof r}`)}if(r.trim()===""){throw new SyntaxError(`Value for key "${e}" cannot be empty (got "${r}")`)}n[e]=r}return n}catch(e){const t=(0,o.errorMessage)(e);throw new Error(`Failed to parse KV pairs as JSON: ${t}`)}}t.parseKVJSON=parseKVJSON;function parseKVYAML(e){if(!e||e.trim().length===0){return{}}const t=s.default.parse(e);const n={};for(const[e,r]of Object.entries(t)){if(typeof e!=="string"||typeof r!=="string"){throw new SyntaxError(`env_vars_file must contain only KEY: VALUE strings. Error parsing key ${e} of type ${typeof e} with value ${r} of type ${typeof r}`)}n[e.trim()]=r.trim()}return n}t.parseKVYAML=parseKVYAML;function parseKVStringAndFile(e,t){e=(e||"").trim();t=(t||"").trim();let n={};if(t){const e=parseKVFile(t);n=Object.assign(Object.assign({},n),e)}if(e){const t=parseKVString(e);n=Object.assign(Object.assign({},n),t)}return n}t.parseKVStringAndFile=parseKVStringAndFile},318:function(e,t,n){"use strict";var r=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:true});t.rawRequest=t.request=void 0;const s=n(310);const i=r(n(685));const o=r(n(687));function request(e,t,n,r){e=(e||"GET").toUpperCase();const i=new s.URL(t);r||(r={});r.protocol||(r.protocol=i.protocol);r.hostname||(r.hostname=i.hostname);r.port||(r.port=i.port);r.path||(r.path=i.pathname+i.search);r.method||(r.method=e);return rawRequest(r,n)}t.request=request;function rawRequest(e,t){const n=(e===null||e===void 0?void 0:e.protocol)==="http"||(e===null||e===void 0?void 0:e.protocol)==="http:"?i.default.request:o.default.request;return new Promise(((r,s)=>{const i=n(e,(e=>{e.setEncoding("utf8");let t="";e.on("data",(e=>{t+=e}));e.on("end",(()=>{const n=e.statusCode;if(n&&n>=400){let e=`Unuccessful HTTP response: ${n}`;if(t){e=`${e}, body: ${t}`}return s(e)}else{return r(t)}}))}));i.on("error",(e=>{s(e)}));switch(true){case t===null:case t===undefined:i.end();break;case typeof t==="string":case t instanceof Buffer:i.write(t);i.end();break;case t instanceof String:i.write(t.valueOf());i.end();break;default:t.pipe(i)}}))}t.rawRequest=rawRequest;t["default"]={request:request,rawRequest:rawRequest}},570:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.randomFilepath=t.randomFilename=void 0;const r=n(17);const s=n(113);const i=n(37);function randomFilename(e=12){return(0,s.randomBytes)(e).toString("hex")}t.randomFilename=randomFilename;function randomFilepath(e=(0,i.tmpdir)(),t=12){return(0,r.join)(e,randomFilename(t))}t.randomFilepath=randomFilepath;t["default"]={randomFilename:randomFilename,randomFilepath:randomFilepath}},816:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.parseDuration=void 0;function parseDuration(e){e=(e||"").trim();if(!e){return 0}let t=0;let n="";for(let r=0;r<e.length;r++){const s=e[r];switch(s){case" ":continue;case",":continue;case"s":{t+=+n;n="";break}case"m":{t+=+n*60;n="";break}case"h":{t+=+n*60*60;n="";break}case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":n+=s;break;default:throw new SyntaxError(`Unsupported character "${s}" at position ${r}`)}}if(n){t+=+n}return t}t.parseDuration=parseDuration},596:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:true});t.allOf=t.exactlyOneOf=t.presence=void 0;function presence(e){return(e||"").trim()||undefined}t.presence=presence;function exactlyOneOf(...e){e=e||[];let t=false;for(let n=0;n<e.length;n++){if(e[n]){if(t){return false}else{t=true}}}if(!t){return false}return true}t.exactlyOneOf=exactlyOneOf;function allOf(...e){e=e||[];for(let t=0;t<e.length;t++){if(!e[t])return false}return true}t.allOf=allOf},113:e=>{"use strict";e.exports=__nccwpck_require__(113)},147:e=>{"use strict";e.exports=__nccwpck_require__(147)},685:e=>{"use strict";e.exports=__nccwpck_require__(685)},687:e=>{"use strict";e.exports=__nccwpck_require__(687)},37:e=>{"use strict";e.exports=__nccwpck_require__(37)},17:e=>{"use strict";e.exports=__nccwpck_require__(17)},310:e=>{"use strict";e.exports=__nccwpck_require__(310)},525:(e,t,n)=>{"use strict";var r=n(941);var s=n(914);var i=n(387);const o={anchorPrefix:"a",customTags:null,indent:2,indentSeq:true,keepCstNodes:false,keepNodeTypes:true,keepBlobsInJSON:true,mapAsMap:false,maxAliasCount:100,prettyErrors:false,simpleKeys:false,version:"1.2"};const a={get binary(){return s.binaryOptions},set binary(e){Object.assign(s.binaryOptions,e)},get bool(){return s.boolOptions},set bool(e){Object.assign(s.boolOptions,e)},get int(){return s.intOptions},set int(e){Object.assign(s.intOptions,e)},get null(){return s.nullOptions},set null(e){Object.assign(s.nullOptions,e)},get str(){return s.strOptions},set str(e){Object.assign(s.strOptions,e)}};const c={"1.0":{schema:"yaml-1.1",merge:true,tagPrefixes:[{handle:"!",prefix:r.defaultTagPrefix},{handle:"!!",prefix:"tag:private.yaml.org,2002:"}]},1.1:{schema:"yaml-1.1",merge:true,tagPrefixes:[{handle:"!",prefix:"!"},{handle:"!!",prefix:r.defaultTagPrefix}]},1.2:{schema:"core",merge:false,tagPrefixes:[{handle:"!",prefix:"!"},{handle:"!!",prefix:r.defaultTagPrefix}]}};function stringifyTag(e,t){if((e.version||e.options.version)==="1.0"){const e=t.match(/^tag:private\.yaml\.org,2002:([^:/]+)$/);if(e)return"!"+e[1];const n=t.match(/^tag:([a-zA-Z0-9-]+)\.yaml\.org,2002:(.*)/);return n?`!${n[1]}/${n[2]}`:`!${t.replace(/^tag:/,"")}`}let n=e.tagPrefixes.find((e=>t.indexOf(e.prefix)===0));if(!n){const r=e.getDefaults().tagPrefixes;n=r&&r.find((e=>t.indexOf(e.prefix)===0))}if(!n)return t[0]==="!"?t:`!<${t}>`;const r=t.substr(n.prefix.length).replace(/[!,[\]{}]/g,(e=>({"!":"%21",",":"%2C","[":"%5B","]":"%5D","{":"%7B","}":"%7D"}[e])));return n.handle+r}function getTagObject(e,t){if(t instanceof s.Alias)return s.Alias;if(t.tag){const n=e.filter((e=>e.tag===t.tag));if(n.length>0)return n.find((e=>e.format===t.format))||n[0]}let n,r;if(t instanceof s.Scalar){r=t.value;const s=e.filter((e=>e.identify&&e.identify(r)||e.class&&r instanceof e.class));n=s.find((e=>e.format===t.format))||s.find((e=>!e.format))}else{r=t;n=e.find((e=>e.nodeClass&&r instanceof e.nodeClass))}if(!n){const e=r&&r.constructor?r.constructor.name:typeof r;throw new Error(`Tag not resolved for ${e} value`)}return n}function stringifyProps(e,t,{anchors:n,doc:r}){const s=[];const i=r.anchors.getName(e);if(i){n[i]=e;s.push(`&${i}`)}if(e.tag){s.push(stringifyTag(r,e.tag))}else if(!t.default){s.push(stringifyTag(r,t.tag))}return s.join(" ")}function stringify(e,t,n,r){const{anchors:i,schema:o}=t.doc;let a;if(!(e instanceof s.Node)){const t={aliasNodes:[],onTagObj:e=>a=e,prevObjects:new Map};e=o.createNode(e,true,null,t);for(const e of t.aliasNodes){e.source=e.source.node;let t=i.getName(e.source);if(!t){t=i.newName();i.map[t]=e.source}}}if(e instanceof s.Pair)return e.toString(t,n,r);if(!a)a=getTagObject(o.tags,e);const c=stringifyProps(e,a,t);if(c.length>0)t.indentAtStart=(t.indentAtStart||0)+c.length+1;const l=typeof a.stringify==="function"?a.stringify(e,t,n,r):e instanceof s.Scalar?s.stringifyString(e,t,n,r):e.toString(t,n,r);if(!c)return l;return e instanceof s.Scalar||l[0]==="{"||l[0]==="["?`${c} ${l}`:`${c}\n${t.indent}${l}`}class Anchors{static validAnchorNode(e){return e instanceof s.Scalar||e instanceof s.YAMLSeq||e instanceof s.YAMLMap}constructor(e){r._defineProperty(this,"map",Object.create(null));this.prefix=e}createAlias(e,t){this.setAnchor(e,t);return new s.Alias(e)}createMergePair(...e){const t=new s.Merge;t.value.items=e.map((e=>{if(e instanceof s.Alias){if(e.source instanceof s.YAMLMap)return e}else if(e instanceof s.YAMLMap){return this.createAlias(e)}throw new Error("Merge sources must be Map nodes or their Aliases")}));return t}getName(e){const{map:t}=this;return Object.keys(t).find((n=>t[n]===e))}getNames(){return Object.keys(this.map)}getNode(e){return this.map[e]}newName(e){if(!e)e=this.prefix;const t=Object.keys(this.map);for(let n=1;true;++n){const r=`${e}${n}`;if(!t.includes(r))return r}}resolveNodes(){const{map:e,_cstAliases:t}=this;Object.keys(e).forEach((t=>{e[t]=e[t].resolved}));t.forEach((e=>{e.source=e.source.resolved}));delete this._cstAliases}setAnchor(e,t){if(e!=null&&!Anchors.validAnchorNode(e)){throw new Error("Anchors may only be set for Scalar, Seq and Map nodes")}if(t&&/[\x00-\x19\s,[\]{}]/.test(t)){throw new Error("Anchor names must not contain whitespace or control characters")}const{map:n}=this;const r=e&&Object.keys(n).find((t=>n[t]===e));if(r){if(!t){return r}else if(r!==t){delete n[r];n[t]=e}}else{if(!t){if(!e)return null;t=this.newName()}n[t]=e}return t}}const visit=(e,t)=>{if(e&&typeof e==="object"){const{tag:n}=e;if(e instanceof s.Collection){if(n)t[n]=true;e.items.forEach((e=>visit(e,t)))}else if(e instanceof s.Pair){visit(e.key,t);visit(e.value,t)}else if(e instanceof s.Scalar){if(n)t[n]=true}}return t};const listTagNames=e=>Object.keys(visit(e,{}));function parseContents(e,t){const n={before:[],after:[]};let i=undefined;let o=false;for(const a of t){if(a.valueRange){if(i!==undefined){const t="Document contains trailing content not separated by a ... or --- line";e.errors.push(new r.YAMLSyntaxError(a,t));break}const t=s.resolveNode(e,a);if(o){t.spaceBefore=true;o=false}i=t}else if(a.comment!==null){const e=i===undefined?n.before:n.after;e.push(a.comment)}else if(a.type===r.Type.BLANK_LINE){o=true;if(i===undefined&&n.before.length>0&&!e.commentBefore){e.commentBefore=n.before.join("\n");n.before=[]}}}e.contents=i||null;if(!i){e.comment=n.before.concat(n.after).join("\n")||null}else{const t=n.before.join("\n");if(t){const e=i instanceof s.Collection&&i.items[0]?i.items[0]:i;e.commentBefore=e.commentBefore?`${t}\n${e.commentBefore}`:t}e.comment=n.after.join("\n")||null}}function resolveTagDirective({tagPrefixes:e},t){const[n,s]=t.parameters;if(!n||!s){const e="Insufficient parameters given for %TAG directive";throw new r.YAMLSemanticError(t,e)}if(e.some((e=>e.handle===n))){const e="The %TAG directive must only be given at most once per handle in the same document.";throw new r.YAMLSemanticError(t,e)}return{handle:n,prefix:s}}function resolveYamlDirective(e,t){let[n]=t.parameters;if(t.name==="YAML:1.0")n="1.0";if(!n){const e="Insufficient parameters given for %YAML directive";throw new r.YAMLSemanticError(t,e)}if(!c[n]){const s=e.version||e.options.version;const i=`Document will be parsed as YAML ${s} rather than YAML ${n}`;e.warnings.push(new r.YAMLWarning(t,i))}return n}function parseDirectives(e,t,n){const s=[];let i=false;for(const n of t){const{comment:t,name:o}=n;switch(o){case"TAG":try{e.tagPrefixes.push(resolveTagDirective(e,n))}catch(t){e.errors.push(t)}i=true;break;case"YAML":case"YAML:1.0":if(e.version){const t="The %YAML directive must only be given at most once per document.";e.errors.push(new r.YAMLSemanticError(n,t))}try{e.version=resolveYamlDirective(e,n)}catch(t){e.errors.push(t)}i=true;break;default:if(o){const t=`YAML only supports %TAG and %YAML directives, and not %${o}`;e.warnings.push(new r.YAMLWarning(n,t))}}if(t)s.push(t)}if(n&&!i&&"1.1"===(e.version||n.version||e.options.version)){const copyTagPrefix=({handle:e,prefix:t})=>({handle:e,prefix:t});e.tagPrefixes=n.tagPrefixes.map(copyTagPrefix);e.version=n.version}e.commentBefore=s.join("\n")||null}function assertCollection(e){if(e instanceof s.Collection)return true;throw new Error("Expected a YAML collection as document contents")}class Document{constructor(e){this.anchors=new Anchors(e.anchorPrefix);this.commentBefore=null;this.comment=null;this.contents=null;this.directivesEndMarker=null;this.errors=[];this.options=e;this.schema=null;this.tagPrefixes=[];this.version=null;this.warnings=[]}add(e){assertCollection(this.contents);return this.contents.add(e)}addIn(e,t){assertCollection(this.contents);this.contents.addIn(e,t)}delete(e){assertCollection(this.contents);return this.contents.delete(e)}deleteIn(e){if(s.isEmptyPath(e)){if(this.contents==null)return false;this.contents=null;return true}assertCollection(this.contents);return this.contents.deleteIn(e)}getDefaults(){return Document.defaults[this.version]||Document.defaults[this.options.version]||{}}get(e,t){return this.contents instanceof s.Collection?this.contents.get(e,t):undefined}getIn(e,t){if(s.isEmptyPath(e))return!t&&this.contents instanceof s.Scalar?this.contents.value:this.contents;return this.contents instanceof s.Collection?this.contents.getIn(e,t):undefined}has(e){return this.contents instanceof s.Collection?this.contents.has(e):false}hasIn(e){if(s.isEmptyPath(e))return this.contents!==undefined;return this.contents instanceof s.Collection?this.contents.hasIn(e):false}set(e,t){assertCollection(this.contents);this.contents.set(e,t)}setIn(e,t){if(s.isEmptyPath(e))this.contents=t;else{assertCollection(this.contents);this.contents.setIn(e,t)}}setSchema(e,t){if(!e&&!t&&this.schema)return;if(typeof e==="number")e=e.toFixed(1);if(e==="1.0"||e==="1.1"||e==="1.2"){if(this.version)this.version=e;else this.options.version=e;delete this.options.schema}else if(e&&typeof e==="string"){this.options.schema=e}if(Array.isArray(t))this.options.customTags=t;const n=Object.assign({},this.getDefaults(),this.options);this.schema=new i.Schema(n)}parse(e,t){if(this.options.keepCstNodes)this.cstNode=e;if(this.options.keepNodeTypes)this.type="DOCUMENT";const{directives:n=[],contents:s=[],directivesEndMarker:i,error:o,valueRange:a}=e;if(o){if(!o.source)o.source=this;this.errors.push(o)}parseDirectives(this,n,t);if(i)this.directivesEndMarker=true;this.range=a?[a.start,a.end]:null;this.setSchema();this.anchors._cstAliases=[];parseContents(this,s);this.anchors.resolveNodes();if(this.options.prettyErrors){for(const e of this.errors)if(e instanceof r.YAMLError)e.makePretty();for(const e of this.warnings)if(e instanceof r.YAMLError)e.makePretty()}return this}listNonDefaultTags(){return listTagNames(this.contents).filter((e=>e.indexOf(i.Schema.defaultPrefix)!==0))}setTagPrefix(e,t){if(e[0]!=="!"||e[e.length-1]!=="!")throw new Error("Handle must start and end with !");if(t){const n=this.tagPrefixes.find((t=>t.handle===e));if(n)n.prefix=t;else this.tagPrefixes.push({handle:e,prefix:t})}else{this.tagPrefixes=this.tagPrefixes.filter((t=>t.handle!==e))}}toJSON(e,t){const{keepBlobsInJSON:n,mapAsMap:r,maxAliasCount:i}=this.options;const o=n&&(typeof e!=="string"||!(this.contents instanceof s.Scalar));const a={doc:this,indentStep:"  ",keep:o,mapAsMap:o&&!!r,maxAliasCount:i,stringify:stringify};const c=Object.keys(this.anchors.map);if(c.length>0)a.anchors=new Map(c.map((e=>[this.anchors.map[e],{alias:[],aliasCount:0,count:1}])));const l=s.toJSON(this.contents,e,a);if(typeof t==="function"&&a.anchors)for(const{count:e,res:n}of a.anchors.values())t(n,e);return l}toString(){if(this.errors.length>0)throw new Error("Document with errors cannot be stringified");const e=this.options.indent;if(!Number.isInteger(e)||e<=0){const t=JSON.stringify(e);throw new Error(`"indent" option must be a positive integer, not ${t}`)}this.setSchema();const t=[];let n=false;if(this.version){let e="%YAML 1.2";if(this.schema.name==="yaml-1.1"){if(this.version==="1.0")e="%YAML:1.0";else if(this.version==="1.1")e="%YAML 1.1"}t.push(e);n=true}const r=this.listNonDefaultTags();this.tagPrefixes.forEach((({handle:e,prefix:s})=>{if(r.some((e=>e.indexOf(s)===0))){t.push(`%TAG ${e} ${s}`);n=true}}));if(n||this.directivesEndMarker)t.push("---");if(this.commentBefore){if(n||!this.directivesEndMarker)t.unshift("");t.unshift(this.commentBefore.replace(/^/gm,"#"))}const i={anchors:Object.create(null),doc:this,indent:"",indentStep:" ".repeat(e),stringify:stringify};let o=false;let a=null;if(this.contents){if(this.contents instanceof s.Node){if(this.contents.spaceBefore&&(n||this.directivesEndMarker))t.push("");if(this.contents.commentBefore)t.push(this.contents.commentBefore.replace(/^/gm,"#"));i.forceBlockIndent=!!this.comment;a=this.contents.comment}const e=a?null:()=>o=true;const r=stringify(this.contents,i,(()=>a=null),e);t.push(s.addComment(r,"",a))}else if(this.contents!==undefined){t.push(stringify(this.contents,i))}if(this.comment){if((!o||a)&&t[t.length-1]!=="")t.push("");t.push(this.comment.replace(/^/gm,"#"))}return t.join("\n")+"\n"}}r._defineProperty(Document,"defaults",c);t.Document=Document;t.defaultOptions=o;t.scalarOptions=a},941:(e,t)=>{"use strict";const n={ANCHOR:"&",COMMENT:"#",TAG:"!",DIRECTIVES_END:"-",DOCUMENT_END:"."};const r={ALIAS:"ALIAS",BLANK_LINE:"BLANK_LINE",BLOCK_FOLDED:"BLOCK_FOLDED",BLOCK_LITERAL:"BLOCK_LITERAL",COMMENT:"COMMENT",DIRECTIVE:"DIRECTIVE",DOCUMENT:"DOCUMENT",FLOW_MAP:"FLOW_MAP",FLOW_SEQ:"FLOW_SEQ",MAP:"MAP",MAP_KEY:"MAP_KEY",MAP_VALUE:"MAP_VALUE",PLAIN:"PLAIN",QUOTE_DOUBLE:"QUOTE_DOUBLE",QUOTE_SINGLE:"QUOTE_SINGLE",SEQ:"SEQ",SEQ_ITEM:"SEQ_ITEM"};const s="tag:yaml.org,2002:";const i={MAP:"tag:yaml.org,2002:map",SEQ:"tag:yaml.org,2002:seq",STR:"tag:yaml.org,2002:str"};function findLineStarts(e){const t=[0];let n=e.indexOf("\n");while(n!==-1){n+=1;t.push(n);n=e.indexOf("\n",n)}return t}function getSrcInfo(e){let t,n;if(typeof e==="string"){t=findLineStarts(e);n=e}else{if(Array.isArray(e))e=e[0];if(e&&e.context){if(!e.lineStarts)e.lineStarts=findLineStarts(e.context.src);t=e.lineStarts;n=e.context.src}}return{lineStarts:t,src:n}}function getLinePos(e,t){if(typeof e!=="number"||e<0)return null;const{lineStarts:n,src:r}=getSrcInfo(t);if(!n||!r||e>r.length)return null;for(let t=0;t<n.length;++t){const r=n[t];if(e<r){return{line:t,col:e-n[t-1]+1}}if(e===r)return{line:t+1,col:1}}const s=n.length;return{line:s,col:e-n[s-1]+1}}function getLine(e,t){const{lineStarts:n,src:r}=getSrcInfo(t);if(!n||!(e>=1)||e>n.length)return null;const s=n[e-1];let i=n[e];while(i&&i>s&&r[i-1]==="\n")--i;return r.slice(s,i)}function getPrettyContext({start:e,end:t},n,r=80){let s=getLine(e.line,n);if(!s)return null;let{col:i}=e;if(s.length>r){if(i<=r-10){s=s.substr(0,r-1)+"…"}else{const e=Math.round(r/2);if(s.length>i+e)s=s.substr(0,i+e-1)+"…";i-=s.length-r;s="…"+s.substr(1-r)}}let o=1;let a="";if(t){if(t.line===e.line&&i+(t.col-e.col)<=r+1){o=t.col-e.col}else{o=Math.min(s.length+1,r)-i;a="…"}}const c=i>1?" ".repeat(i-1):"";const l="^".repeat(o);return`${s}\n${c}${l}${a}`}class Range{static copy(e){return new Range(e.start,e.end)}constructor(e,t){this.start=e;this.end=t||e}isEmpty(){return typeof this.start!=="number"||!this.end||this.end<=this.start}setOrigRange(e,t){const{start:n,end:r}=this;if(e.length===0||r<=e[0]){this.origStart=n;this.origEnd=r;return t}let s=t;while(s<e.length){if(e[s]>n)break;else++s}this.origStart=n+s;const i=s;while(s<e.length){if(e[s]>=r)break;else++s}this.origEnd=r+s;return i}}class Node{static addStringTerminator(e,t,n){if(n[n.length-1]==="\n")return n;const r=Node.endOfWhiteSpace(e,t);return r>=e.length||e[r]==="\n"?n+"\n":n}static atDocumentBoundary(e,t,r){const s=e[t];if(!s)return true;const i=e[t-1];if(i&&i!=="\n")return false;if(r){if(s!==r)return false}else{if(s!==n.DIRECTIVES_END&&s!==n.DOCUMENT_END)return false}const o=e[t+1];const a=e[t+2];if(o!==s||a!==s)return false;const c=e[t+3];return!c||c==="\n"||c==="\t"||c===" "}static endOfIdentifier(e,t){let n=e[t];const r=n==="<";const s=r?["\n","\t"," ",">"]:["\n","\t"," ","[","]","{","}",","];while(n&&s.indexOf(n)===-1)n=e[t+=1];if(r&&n===">")t+=1;return t}static endOfIndent(e,t){let n=e[t];while(n===" ")n=e[t+=1];return t}static endOfLine(e,t){let n=e[t];while(n&&n!=="\n")n=e[t+=1];return t}static endOfWhiteSpace(e,t){let n=e[t];while(n==="\t"||n===" ")n=e[t+=1];return t}static startOfLine(e,t){let n=e[t-1];if(n==="\n")return t;while(n&&n!=="\n")n=e[t-=1];return t+1}static endOfBlockIndent(e,t,n){const r=Node.endOfIndent(e,n);if(r>n+t){return r}else{const t=Node.endOfWhiteSpace(e,r);const n=e[t];if(!n||n==="\n")return t}return null}static atBlank(e,t,n){const r=e[t];return r==="\n"||r==="\t"||r===" "||n&&!r}static nextNodeIsIndented(e,t,n){if(!e||t<0)return false;if(t>0)return true;return n&&e==="-"}static normalizeOffset(e,t){const n=e[t];return!n?t:n!=="\n"&&e[t-1]==="\n"?t-1:Node.endOfWhiteSpace(e,t)}static foldNewline(e,t,n){let r=0;let s=false;let i="";let o=e[t+1];while(o===" "||o==="\t"||o==="\n"){switch(o){case"\n":r=0;t+=1;i+="\n";break;case"\t":if(r<=n)s=true;t=Node.endOfWhiteSpace(e,t+2)-1;break;case" ":r+=1;t+=1;break}o=e[t+1]}if(!i)i=" ";if(o&&r<=n)s=true;return{fold:i,offset:t,error:s}}constructor(e,t,n){Object.defineProperty(this,"context",{value:n||null,writable:true});this.error=null;this.range=null;this.valueRange=null;this.props=t||[];this.type=e;this.value=null}getPropValue(e,t,n){if(!this.context)return null;const{src:r}=this.context;const s=this.props[e];return s&&r[s.start]===t?r.slice(s.start+(n?1:0),s.end):null}get anchor(){for(let e=0;e<this.props.length;++e){const t=this.getPropValue(e,n.ANCHOR,true);if(t!=null)return t}return null}get comment(){const e=[];for(let t=0;t<this.props.length;++t){const r=this.getPropValue(t,n.COMMENT,true);if(r!=null)e.push(r)}return e.length>0?e.join("\n"):null}commentHasRequiredWhitespace(e){const{src:t}=this.context;if(this.header&&e===this.header.end)return false;if(!this.valueRange)return false;const{end:n}=this.valueRange;return e!==n||Node.atBlank(t,n-1)}get hasComment(){if(this.context){const{src:e}=this.context;for(let t=0;t<this.props.length;++t){if(e[this.props[t].start]===n.COMMENT)return true}}return false}get hasProps(){if(this.context){const{src:e}=this.context;for(let t=0;t<this.props.length;++t){if(e[this.props[t].start]!==n.COMMENT)return true}}return false}get includesTrailingLines(){return false}get jsonLike(){const e=[r.FLOW_MAP,r.FLOW_SEQ,r.QUOTE_DOUBLE,r.QUOTE_SINGLE];return e.indexOf(this.type)!==-1}get rangeAsLinePos(){if(!this.range||!this.context)return undefined;const e=getLinePos(this.range.start,this.context.root);if(!e)return undefined;const t=getLinePos(this.range.end,this.context.root);return{start:e,end:t}}get rawValue(){if(!this.valueRange||!this.context)return null;const{start:e,end:t}=this.valueRange;return this.context.src.slice(e,t)}get tag(){for(let e=0;e<this.props.length;++e){const t=this.getPropValue(e,n.TAG,false);if(t!=null){if(t[1]==="<"){return{verbatim:t.slice(2,-1)}}else{const[e,n,r]=t.match(/^(.*!)([^!]*)$/);return{handle:n,suffix:r}}}}return null}get valueRangeContainsNewline(){if(!this.valueRange||!this.context)return false;const{start:e,end:t}=this.valueRange;const{src:n}=this.context;for(let r=e;r<t;++r){if(n[r]==="\n")return true}return false}parseComment(e){const{src:t}=this.context;if(t[e]===n.COMMENT){const n=Node.endOfLine(t,e+1);const r=new Range(e,n);this.props.push(r);return n}return e}setOrigRanges(e,t){if(this.range)t=this.range.setOrigRange(e,t);if(this.valueRange)this.valueRange.setOrigRange(e,t);this.props.forEach((n=>n.setOrigRange(e,t)));return t}toString(){const{context:{src:e},range:t,value:n}=this;if(n!=null)return n;const r=e.slice(t.start,t.end);return Node.addStringTerminator(e,t.end,r)}}class YAMLError extends Error{constructor(e,t,n){if(!n||!(t instanceof Node))throw new Error(`Invalid arguments for new ${e}`);super();this.name=e;this.message=n;this.source=t}makePretty(){if(!this.source)return;this.nodeType=this.source.type;const e=this.source.context&&this.source.context.root;if(typeof this.offset==="number"){this.range=new Range(this.offset,this.offset+1);const t=e&&getLinePos(this.offset,e);if(t){const e={line:t.line,col:t.col+1};this.linePos={start:t,end:e}}delete this.offset}else{this.range=this.source.range;this.linePos=this.source.rangeAsLinePos}if(this.linePos){const{line:t,col:n}=this.linePos.start;this.message+=` at line ${t}, column ${n}`;const r=e&&getPrettyContext(this.linePos,e);if(r)this.message+=`:\n\n${r}\n`}delete this.source}}class YAMLReferenceError extends YAMLError{constructor(e,t){super("YAMLReferenceError",e,t)}}class YAMLSemanticError extends YAMLError{constructor(e,t){super("YAMLSemanticError",e,t)}}class YAMLSyntaxError extends YAMLError{constructor(e,t){super("YAMLSyntaxError",e,t)}}class YAMLWarning extends YAMLError{constructor(e,t){super("YAMLWarning",e,t)}}function _defineProperty(e,t,n){if(t in e){Object.defineProperty(e,t,{value:n,enumerable:true,configurable:true,writable:true})}else{e[t]=n}return e}class PlainValue extends Node{static endOfLine(e,t,n){let r=e[t];let s=t;while(r&&r!=="\n"){if(n&&(r==="["||r==="]"||r==="{"||r==="}"||r===","))break;const t=e[s+1];if(r===":"&&(!t||t==="\n"||t==="\t"||t===" "||n&&t===","))break;if((r===" "||r==="\t")&&t==="#")break;s+=1;r=t}return s}get strValue(){if(!this.valueRange||!this.context)return null;let{start:e,end:t}=this.valueRange;const{src:n}=this.context;let r=n[t-1];while(e<t&&(r==="\n"||r==="\t"||r===" "))r=n[--t-1];let s="";for(let r=e;r<t;++r){const e=n[r];if(e==="\n"){const{fold:e,offset:t}=Node.foldNewline(n,r,-1);s+=e;r=t}else if(e===" "||e==="\t"){const i=r;let o=n[r+1];while(r<t&&(o===" "||o==="\t")){r+=1;o=n[r+1]}if(o!=="\n")s+=r>i?n.slice(i,r+1):e}else{s+=e}}const i=n[e];switch(i){case"\t":{const e="Plain value cannot start with a tab character";const t=[new YAMLSemanticError(this,e)];return{errors:t,str:s}}case"@":case"`":{const e=`Plain value cannot start with reserved character ${i}`;const t=[new YAMLSemanticError(this,e)];return{errors:t,str:s}}default:return s}}parseBlockValue(e){const{indent:t,inFlow:n,src:r}=this.context;let s=e;let i=e;for(let e=r[s];e==="\n";e=r[s]){if(Node.atDocumentBoundary(r,s+1))break;const e=Node.endOfBlockIndent(r,t,s+1);if(e===null||r[e]==="#")break;if(r[e]==="\n"){s=e}else{i=PlainValue.endOfLine(r,e,n);s=i}}if(this.valueRange.isEmpty())this.valueRange.start=e;this.valueRange.end=i;return i}parse(e,t){this.context=e;const{inFlow:n,src:r}=e;let s=t;const i=r[s];if(i&&i!=="#"&&i!=="\n"){s=PlainValue.endOfLine(r,t,n)}this.valueRange=new Range(t,s);s=Node.endOfWhiteSpace(r,s);s=this.parseComment(s);if(!this.hasComment||this.valueRange.isEmpty()){s=this.parseBlockValue(s)}return s}}t.Char=n;t.Node=Node;t.PlainValue=PlainValue;t.Range=Range;t.Type=r;t.YAMLError=YAMLError;t.YAMLReferenceError=YAMLReferenceError;t.YAMLSemanticError=YAMLSemanticError;t.YAMLSyntaxError=YAMLSyntaxError;t.YAMLWarning=YAMLWarning;t._defineProperty=_defineProperty;t.defaultTagPrefix=s;t.defaultTags=i},387:(e,t,n)=>{"use strict";var r=n(941);var s=n(914);var i=n(130);function createMap(e,t,n){const r=new s.YAMLMap(e);if(t instanceof Map){for(const[s,i]of t)r.items.push(e.createPair(s,i,n))}else if(t&&typeof t==="object"){for(const s of Object.keys(t))r.items.push(e.createPair(s,t[s],n))}if(typeof e.sortMapEntries==="function"){r.items.sort(e.sortMapEntries)}return r}const o={createNode:createMap,default:true,nodeClass:s.YAMLMap,tag:"tag:yaml.org,2002:map",resolve:s.resolveMap};function createSeq(e,t,n){const r=new s.YAMLSeq(e);if(t&&t[Symbol.iterator]){for(const s of t){const t=e.createNode(s,n.wrapScalars,null,n);r.items.push(t)}}return r}const a={createNode:createSeq,default:true,nodeClass:s.YAMLSeq,tag:"tag:yaml.org,2002:seq",resolve:s.resolveSeq};const c={identify:e=>typeof e==="string",default:true,tag:"tag:yaml.org,2002:str",resolve:s.resolveString,stringify(e,t,n,r){t=Object.assign({actualString:true},t);return s.stringifyString(e,t,n,r)},options:s.strOptions};const l=[o,a,c];const intIdentify$2=e=>typeof e==="bigint"||Number.isInteger(e);const intResolve$1=(e,t,n)=>s.intOptions.asBigInt?BigInt(e):parseInt(t,n);function intStringify$1(e,t,n){const{value:r}=e;if(intIdentify$2(r)&&r>=0)return n+r.toString(t);return s.stringifyNumber(e)}const f={identify:e=>e==null,createNode:(e,t,n)=>n.wrapScalars?new s.Scalar(null):null,default:true,tag:"tag:yaml.org,2002:null",test:/^(?:~|[Nn]ull|NULL)?$/,resolve:()=>null,options:s.nullOptions,stringify:()=>s.nullOptions.nullStr};const u={identify:e=>typeof e==="boolean",default:true,tag:"tag:yaml.org,2002:bool",test:/^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,resolve:e=>e[0]==="t"||e[0]==="T",options:s.boolOptions,stringify:({value:e})=>e?s.boolOptions.trueStr:s.boolOptions.falseStr};const h={identify:e=>intIdentify$2(e)&&e>=0,default:true,tag:"tag:yaml.org,2002:int",format:"OCT",test:/^0o([0-7]+)$/,resolve:(e,t)=>intResolve$1(e,t,8),options:s.intOptions,stringify:e=>intStringify$1(e,8,"0o")};const p={identify:intIdentify$2,default:true,tag:"tag:yaml.org,2002:int",test:/^[-+]?[0-9]+$/,resolve:e=>intResolve$1(e,e,10),options:s.intOptions,stringify:s.stringifyNumber};const d={identify:e=>intIdentify$2(e)&&e>=0,default:true,tag:"tag:yaml.org,2002:int",format:"HEX",test:/^0x([0-9a-fA-F]+)$/,resolve:(e,t)=>intResolve$1(e,t,16),options:s.intOptions,stringify:e=>intStringify$1(e,16,"0x")};const g={identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",test:/^(?:[-+]?\.inf|(\.nan))$/i,resolve:(e,t)=>t?NaN:e[0]==="-"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,stringify:s.stringifyNumber};const m={identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",format:"EXP",test:/^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,resolve:e=>parseFloat(e),stringify:({value:e})=>Number(e).toExponential()};const y={identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",test:/^[-+]?(?:\.([0-9]+)|[0-9]+\.([0-9]*))$/,resolve(e,t,n){const r=t||n;const i=new s.Scalar(parseFloat(e));if(r&&r[r.length-1]==="0")i.minFractionDigits=r.length;return i},stringify:s.stringifyNumber};const S=l.concat([f,u,h,p,d,g,m,y]);const intIdentify$1=e=>typeof e==="bigint"||Number.isInteger(e);const stringifyJSON=({value:e})=>JSON.stringify(e);const w=[o,a,{identify:e=>typeof e==="string",default:true,tag:"tag:yaml.org,2002:str",resolve:s.resolveString,stringify:stringifyJSON},{identify:e=>e==null,createNode:(e,t,n)=>n.wrapScalars?new s.Scalar(null):null,default:true,tag:"tag:yaml.org,2002:null",test:/^null$/,resolve:()=>null,stringify:stringifyJSON},{identify:e=>typeof e==="boolean",default:true,tag:"tag:yaml.org,2002:bool",test:/^true|false$/,resolve:e=>e==="true",stringify:stringifyJSON},{identify:intIdentify$1,default:true,tag:"tag:yaml.org,2002:int",test:/^-?(?:0|[1-9][0-9]*)$/,resolve:e=>s.intOptions.asBigInt?BigInt(e):parseInt(e,10),stringify:({value:e})=>intIdentify$1(e)?e.toString():JSON.stringify(e)},{identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",test:/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,resolve:e=>parseFloat(e),stringify:stringifyJSON}];w.scalarFallback=e=>{throw new SyntaxError(`Unresolved plain scalar ${JSON.stringify(e)}`)};const boolStringify=({value:e})=>e?s.boolOptions.trueStr:s.boolOptions.falseStr;const intIdentify=e=>typeof e==="bigint"||Number.isInteger(e);function intResolve(e,t,n){let r=t.replace(/_/g,"");if(s.intOptions.asBigInt){switch(n){case 2:r=`0b${r}`;break;case 8:r=`0o${r}`;break;case 16:r=`0x${r}`;break}const t=BigInt(r);return e==="-"?BigInt(-1)*t:t}const i=parseInt(r,n);return e==="-"?-1*i:i}function intStringify(e,t,n){const{value:r}=e;if(intIdentify(r)){const e=r.toString(t);return r<0?"-"+n+e.substr(1):n+e}return s.stringifyNumber(e)}const v=l.concat([{identify:e=>e==null,createNode:(e,t,n)=>n.wrapScalars?new s.Scalar(null):null,default:true,tag:"tag:yaml.org,2002:null",test:/^(?:~|[Nn]ull|NULL)?$/,resolve:()=>null,options:s.nullOptions,stringify:()=>s.nullOptions.nullStr},{identify:e=>typeof e==="boolean",default:true,tag:"tag:yaml.org,2002:bool",test:/^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,resolve:()=>true,options:s.boolOptions,stringify:boolStringify},{identify:e=>typeof e==="boolean",default:true,tag:"tag:yaml.org,2002:bool",test:/^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/i,resolve:()=>false,options:s.boolOptions,stringify:boolStringify},{identify:intIdentify,default:true,tag:"tag:yaml.org,2002:int",format:"BIN",test:/^([-+]?)0b([0-1_]+)$/,resolve:(e,t,n)=>intResolve(t,n,2),stringify:e=>intStringify(e,2,"0b")},{identify:intIdentify,default:true,tag:"tag:yaml.org,2002:int",format:"OCT",test:/^([-+]?)0([0-7_]+)$/,resolve:(e,t,n)=>intResolve(t,n,8),stringify:e=>intStringify(e,8,"0")},{identify:intIdentify,default:true,tag:"tag:yaml.org,2002:int",test:/^([-+]?)([0-9][0-9_]*)$/,resolve:(e,t,n)=>intResolve(t,n,10),stringify:s.stringifyNumber},{identify:intIdentify,default:true,tag:"tag:yaml.org,2002:int",format:"HEX",test:/^([-+]?)0x([0-9a-fA-F_]+)$/,resolve:(e,t,n)=>intResolve(t,n,16),stringify:e=>intStringify(e,16,"0x")},{identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",test:/^(?:[-+]?\.inf|(\.nan))$/i,resolve:(e,t)=>t?NaN:e[0]==="-"?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY,stringify:s.stringifyNumber},{identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",format:"EXP",test:/^[-+]?([0-9][0-9_]*)?(\.[0-9_]*)?[eE][-+]?[0-9]+$/,resolve:e=>parseFloat(e.replace(/_/g,"")),stringify:({value:e})=>Number(e).toExponential()},{identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",test:/^[-+]?(?:[0-9][0-9_]*)?\.([0-9_]*)$/,resolve(e,t){const n=new s.Scalar(parseFloat(e.replace(/_/g,"")));if(t){const e=t.replace(/_/g,"");if(e[e.length-1]==="0")n.minFractionDigits=e.length}return n},stringify:s.stringifyNumber}],i.binary,i.omap,i.pairs,i.set,i.intTime,i.floatTime,i.timestamp);const E={core:S,failsafe:l,json:w,yaml11:v};const O={binary:i.binary,bool:u,float:y,floatExp:m,floatNaN:g,floatTime:i.floatTime,int:p,intHex:d,intOct:h,intTime:i.intTime,map:o,null:f,omap:i.omap,pairs:i.pairs,seq:a,set:i.set,timestamp:i.timestamp};function findTagObject(e,t,n){if(t){const e=n.filter((e=>e.tag===t));const r=e.find((e=>!e.format))||e[0];if(!r)throw new Error(`Tag ${t} not found`);return r}return n.find((t=>(t.identify&&t.identify(e)||t.class&&e instanceof t.class)&&!t.format))}function createNode(e,t,n){if(e instanceof s.Node)return e;const{defaultPrefix:r,onTagObj:i,prevObjects:c,schema:l,wrapScalars:f}=n;if(t&&t.startsWith("!!"))t=r+t.slice(2);let u=findTagObject(e,t,l.tags);if(!u){if(typeof e.toJSON==="function")e=e.toJSON();if(!e||typeof e!=="object")return f?new s.Scalar(e):e;u=e instanceof Map?o:e[Symbol.iterator]?a:o}if(i){i(u);delete n.onTagObj}const h={value:undefined,node:undefined};if(e&&typeof e==="object"&&c){const t=c.get(e);if(t){const e=new s.Alias(t);n.aliasNodes.push(e);return e}h.value=e;c.set(e,h)}h.node=u.createNode?u.createNode(n.schema,e,n):f?new s.Scalar(e):e;if(t&&h.node instanceof s.Node)h.node.tag=t;return h.node}function getSchemaTags(e,t,n,r){let s=e[r.replace(/\W/g,"")];if(!s){const t=Object.keys(e).map((e=>JSON.stringify(e))).join(", ");throw new Error(`Unknown schema "${r}"; use one of ${t}`)}if(Array.isArray(n)){for(const e of n)s=s.concat(e)}else if(typeof n==="function"){s=n(s.slice())}for(let e=0;e<s.length;++e){const n=s[e];if(typeof n==="string"){const r=t[n];if(!r){const e=Object.keys(t).map((e=>JSON.stringify(e))).join(", ");throw new Error(`Unknown custom tag "${n}"; use one of ${e}`)}s[e]=r}}return s}const sortMapEntriesByKey=(e,t)=>e.key<t.key?-1:e.key>t.key?1:0;class Schema{constructor({customTags:e,merge:t,schema:n,sortMapEntries:r,tags:s}){this.merge=!!t;this.name=n;this.sortMapEntries=r===true?sortMapEntriesByKey:r||null;if(!e&&s)i.warnOptionDeprecation("tags","customTags");this.tags=getSchemaTags(E,O,e||s,n)}createNode(e,t,n,r){const s={defaultPrefix:Schema.defaultPrefix,schema:this,wrapScalars:t};const i=r?Object.assign(r,s):s;return createNode(e,n,i)}createPair(e,t,n){if(!n)n={wrapScalars:true};const r=this.createNode(e,n.wrapScalars,null,n);const i=this.createNode(t,n.wrapScalars,null,n);return new s.Pair(r,i)}}r._defineProperty(Schema,"defaultPrefix",r.defaultTagPrefix);r._defineProperty(Schema,"defaultTags",r.defaultTags);t.Schema=Schema},83:(e,t,n)=>{"use strict";var r=n(611);var s=n(525);var i=n(387);var o=n(941);var a=n(130);n(914);function createNode(e,t=true,n){if(n===undefined&&typeof t==="string"){n=t;t=true}const r=Object.assign({},s.Document.defaults[s.defaultOptions.version],s.defaultOptions);const o=new i.Schema(r);return o.createNode(e,t,n)}class Document extends s.Document{constructor(e){super(Object.assign({},s.defaultOptions,e))}}function parseAllDocuments(e,t){const n=[];let s;for(const i of r.parse(e)){const e=new Document(t);e.parse(i,s);n.push(e);s=e}return n}function parseDocument(e,t){const n=r.parse(e);const s=new Document(t).parse(n[0]);if(n.length>1){const e="Source contains multiple documents; please use YAML.parseAllDocuments()";s.errors.unshift(new o.YAMLSemanticError(n[1],e))}return s}function parse(e,t){const n=parseDocument(e,t);n.warnings.forEach((e=>a.warn(e)));if(n.errors.length>0)throw n.errors[0];return n.toJSON()}function stringify(e,t){const n=new Document(t);n.contents=e;return String(n)}const c={createNode:createNode,defaultOptions:s.defaultOptions,Document:Document,parse:parse,parseAllDocuments:parseAllDocuments,parseCST:r.parse,parseDocument:parseDocument,scalarOptions:s.scalarOptions,stringify:stringify};t.YAML=c},611:(e,t,n)=>{"use strict";var r=n(941);class BlankLine extends r.Node{constructor(){super(r.Type.BLANK_LINE)}get includesTrailingLines(){return true}parse(e,t){this.context=e;this.range=new r.Range(t,t+1);return t+1}}class CollectionItem extends r.Node{constructor(e,t){super(e,t);this.node=null}get includesTrailingLines(){return!!this.node&&this.node.includesTrailingLines}parse(e,t){this.context=e;const{parseNode:n,src:s}=e;let{atLineStart:i,lineStart:o}=e;if(!i&&this.type===r.Type.SEQ_ITEM)this.error=new r.YAMLSemanticError(this,"Sequence items must not have preceding content on the same line");const a=i?t-o:e.indent;let c=r.Node.endOfWhiteSpace(s,t+1);let l=s[c];const f=l==="#";const u=[];let h=null;while(l==="\n"||l==="#"){if(l==="#"){const e=r.Node.endOfLine(s,c+1);u.push(new r.Range(c,e));c=e}else{i=true;o=c+1;const e=r.Node.endOfWhiteSpace(s,o);if(s[e]==="\n"&&u.length===0){h=new BlankLine;o=h.parse({src:s},o)}c=r.Node.endOfIndent(s,o)}l=s[c]}if(r.Node.nextNodeIsIndented(l,c-(o+a),this.type!==r.Type.SEQ_ITEM)){this.node=n({atLineStart:i,inCollection:false,indent:a,lineStart:o,parent:this},c)}else if(l&&o>t+1){c=o-1}if(this.node){if(h){const t=e.parent.items||e.parent.contents;if(t)t.push(h)}if(u.length)Array.prototype.push.apply(this.props,u);c=this.node.range.end}else{if(f){const e=u[0];this.props.push(e);c=e.end}else{c=r.Node.endOfLine(s,t+1)}}const p=this.node?this.node.valueRange.end:c;this.valueRange=new r.Range(t,p);return c}setOrigRanges(e,t){t=super.setOrigRanges(e,t);return this.node?this.node.setOrigRanges(e,t):t}toString(){const{context:{src:e},node:t,range:n,value:s}=this;if(s!=null)return s;const i=t?e.slice(n.start,t.range.start)+String(t):e.slice(n.start,n.end);return r.Node.addStringTerminator(e,n.end,i)}}class Comment extends r.Node{constructor(){super(r.Type.COMMENT)}parse(e,t){this.context=e;const n=this.parseComment(t);this.range=new r.Range(t,n);return n}}function grabCollectionEndComments(e){let t=e;while(t instanceof CollectionItem)t=t.node;if(!(t instanceof Collection))return null;const n=t.items.length;let s=-1;for(let e=n-1;e>=0;--e){const n=t.items[e];if(n.type===r.Type.COMMENT){const{indent:t,lineStart:r}=n.context;if(t>0&&n.range.start>=r+t)break;s=e}else if(n.type===r.Type.BLANK_LINE)s=e;else break}if(s===-1)return null;const i=t.items.splice(s,n-s);const o=i[0].range.start;while(true){t.range.end=o;if(t.valueRange&&t.valueRange.end>o)t.valueRange.end=o;if(t===e)break;t=t.context.parent}return i}class Collection extends r.Node{static nextContentHasIndent(e,t,n){const s=r.Node.endOfLine(e,t)+1;t=r.Node.endOfWhiteSpace(e,s);const i=e[t];if(!i)return false;if(t>=s+n)return true;if(i!=="#"&&i!=="\n")return false;return Collection.nextContentHasIndent(e,t,n)}constructor(e){super(e.type===r.Type.SEQ_ITEM?r.Type.SEQ:r.Type.MAP);for(let t=e.props.length-1;t>=0;--t){if(e.props[t].start<e.context.lineStart){this.props=e.props.slice(0,t+1);e.props=e.props.slice(t+1);const n=e.props[0]||e.valueRange;e.range.start=n.start;break}}this.items=[e];const t=grabCollectionEndComments(e);if(t)Array.prototype.push.apply(this.items,t)}get includesTrailingLines(){return this.items.length>0}parse(e,t){this.context=e;const{parseNode:n,src:s}=e;let i=r.Node.startOfLine(s,t);const o=this.items[0];o.context.parent=this;this.valueRange=r.Range.copy(o.valueRange);const a=o.range.start-o.context.lineStart;let c=t;c=r.Node.normalizeOffset(s,c);let l=s[c];let f=r.Node.endOfWhiteSpace(s,i)===c;let u=false;while(l){while(l==="\n"||l==="#"){if(f&&l==="\n"&&!u){const e=new BlankLine;c=e.parse({src:s},c);this.valueRange.end=c;if(c>=s.length){l=null;break}this.items.push(e);c-=1}else if(l==="#"){if(c<i+a&&!Collection.nextContentHasIndent(s,c,a)){return c}const e=new Comment;c=e.parse({indent:a,lineStart:i,src:s},c);this.items.push(e);this.valueRange.end=c;if(c>=s.length){l=null;break}}i=c+1;c=r.Node.endOfIndent(s,i);if(r.Node.atBlank(s,c)){const e=r.Node.endOfWhiteSpace(s,c);const t=s[e];if(!t||t==="\n"||t==="#"){c=e}}l=s[c];f=true}if(!l){break}if(c!==i+a&&(f||l!==":")){if(c<i+a){if(i>t)c=i;break}else if(!this.error){const e="All collection items must start at the same column";this.error=new r.YAMLSyntaxError(this,e)}}if(o.type===r.Type.SEQ_ITEM){if(l!=="-"){if(i>t)c=i;break}}else if(l==="-"&&!this.error){const e=s[c+1];if(!e||e==="\n"||e==="\t"||e===" "){const e="A collection cannot be both a mapping and a sequence";this.error=new r.YAMLSyntaxError(this,e)}}const e=n({atLineStart:f,inCollection:true,indent:a,lineStart:i,parent:this},c);if(!e)return c;this.items.push(e);this.valueRange.end=e.valueRange.end;c=r.Node.normalizeOffset(s,e.range.end);l=s[c];f=false;u=e.includesTrailingLines;if(l){let e=c-1;let t=s[e];while(t===" "||t==="\t")t=s[--e];if(t==="\n"){i=e+1;f=true}}const h=grabCollectionEndComments(e);if(h)Array.prototype.push.apply(this.items,h)}return c}setOrigRanges(e,t){t=super.setOrigRanges(e,t);this.items.forEach((n=>{t=n.setOrigRanges(e,t)}));return t}toString(){const{context:{src:e},items:t,range:n,value:s}=this;if(s!=null)return s;let i=e.slice(n.start,t[0].range.start)+String(t[0]);for(let e=1;e<t.length;++e){const n=t[e];const{atLineStart:r,indent:s}=n.context;if(r)for(let e=0;e<s;++e)i+=" ";i+=String(n)}return r.Node.addStringTerminator(e,n.end,i)}}class Directive extends r.Node{constructor(){super(r.Type.DIRECTIVE);this.name=null}get parameters(){const e=this.rawValue;return e?e.trim().split(/[ \t]+/):[]}parseName(e){const{src:t}=this.context;let n=e;let r=t[n];while(r&&r!=="\n"&&r!=="\t"&&r!==" ")r=t[n+=1];this.name=t.slice(e,n);return n}parseParameters(e){const{src:t}=this.context;let n=e;let s=t[n];while(s&&s!=="\n"&&s!=="#")s=t[n+=1];this.valueRange=new r.Range(e,n);return n}parse(e,t){this.context=e;let n=this.parseName(t+1);n=this.parseParameters(n);n=this.parseComment(n);this.range=new r.Range(t,n);return n}}class Document extends r.Node{static startCommentOrEndBlankLine(e,t){const n=r.Node.endOfWhiteSpace(e,t);const s=e[n];return s==="#"||s==="\n"?n:t}constructor(){super(r.Type.DOCUMENT);this.directives=null;this.contents=null;this.directivesEndMarker=null;this.documentEndMarker=null}parseDirectives(e){const{src:t}=this.context;this.directives=[];let n=true;let s=false;let i=e;while(!r.Node.atDocumentBoundary(t,i,r.Char.DIRECTIVES_END)){i=Document.startCommentOrEndBlankLine(t,i);switch(t[i]){case"\n":if(n){const e=new BlankLine;i=e.parse({src:t},i);if(i<t.length){this.directives.push(e)}}else{i+=1;n=true}break;case"#":{const e=new Comment;i=e.parse({src:t},i);this.directives.push(e);n=false}break;case"%":{const e=new Directive;i=e.parse({parent:this,src:t},i);this.directives.push(e);s=true;n=false}break;default:if(s){this.error=new r.YAMLSemanticError(this,"Missing directives-end indicator line")}else if(this.directives.length>0){this.contents=this.directives;this.directives=[]}return i}}if(t[i]){this.directivesEndMarker=new r.Range(i,i+3);return i+3}if(s){this.error=new r.YAMLSemanticError(this,"Missing directives-end indicator line")}else if(this.directives.length>0){this.contents=this.directives;this.directives=[]}return i}parseContents(e){const{parseNode:t,src:n}=this.context;if(!this.contents)this.contents=[];let s=e;while(n[s-1]==="-")s-=1;let i=r.Node.endOfWhiteSpace(n,e);let o=s===e;this.valueRange=new r.Range(i);while(!r.Node.atDocumentBoundary(n,i,r.Char.DOCUMENT_END)){switch(n[i]){case"\n":if(o){const e=new BlankLine;i=e.parse({src:n},i);if(i<n.length){this.contents.push(e)}}else{i+=1;o=true}s=i;break;case"#":{const e=new Comment;i=e.parse({src:n},i);this.contents.push(e);o=false}break;default:{const e=r.Node.endOfIndent(n,i);const a={atLineStart:o,indent:-1,inFlow:false,inCollection:false,lineStart:s,parent:this};const c=t(a,e);if(!c)return this.valueRange.end=e;this.contents.push(c);i=c.range.end;o=false;const l=grabCollectionEndComments(c);if(l)Array.prototype.push.apply(this.contents,l)}}i=Document.startCommentOrEndBlankLine(n,i)}this.valueRange.end=i;if(n[i]){this.documentEndMarker=new r.Range(i,i+3);i+=3;if(n[i]){i=r.Node.endOfWhiteSpace(n,i);if(n[i]==="#"){const e=new Comment;i=e.parse({src:n},i);this.contents.push(e)}switch(n[i]){case"\n":i+=1;break;case undefined:break;default:this.error=new r.YAMLSyntaxError(this,"Document end marker line cannot have a non-comment suffix")}}}return i}parse(e,t){e.root=this;this.context=e;const{src:n}=e;let r=n.charCodeAt(t)===65279?t+1:t;r=this.parseDirectives(r);r=this.parseContents(r);return r}setOrigRanges(e,t){t=super.setOrigRanges(e,t);this.directives.forEach((n=>{t=n.setOrigRanges(e,t)}));if(this.directivesEndMarker)t=this.directivesEndMarker.setOrigRange(e,t);this.contents.forEach((n=>{t=n.setOrigRanges(e,t)}));if(this.documentEndMarker)t=this.documentEndMarker.setOrigRange(e,t);return t}toString(){const{contents:e,directives:t,value:n}=this;if(n!=null)return n;let s=t.join("");if(e.length>0){if(t.length>0||e[0].type===r.Type.COMMENT)s+="---\n";s+=e.join("")}if(s[s.length-1]!=="\n")s+="\n";return s}}class Alias extends r.Node{parse(e,t){this.context=e;const{src:n}=e;let s=r.Node.endOfIdentifier(n,t+1);this.valueRange=new r.Range(t+1,s);s=r.Node.endOfWhiteSpace(n,s);s=this.parseComment(s);return s}}const s={CLIP:"CLIP",KEEP:"KEEP",STRIP:"STRIP"};class BlockValue extends r.Node{constructor(e,t){super(e,t);this.blockIndent=null;this.chomping=s.CLIP;this.header=null}get includesTrailingLines(){return this.chomping===s.KEEP}get strValue(){if(!this.valueRange||!this.context)return null;let{start:e,end:t}=this.valueRange;const{indent:n,src:i}=this.context;if(this.valueRange.isEmpty())return"";let o=null;let a=i[t-1];while(a==="\n"||a==="\t"||a===" "){t-=1;if(t<=e){if(this.chomping===s.KEEP)break;else return""}if(a==="\n")o=t;a=i[t-1]}let c=t+1;if(o){if(this.chomping===s.KEEP){c=o;t=this.valueRange.end}else{t=o}}const l=n+this.blockIndent;const f=this.type===r.Type.BLOCK_FOLDED;let u=true;let h="";let p="";let d=false;for(let n=e;n<t;++n){for(let e=0;e<l;++e){if(i[n]!==" ")break;n+=1}const e=i[n];if(e==="\n"){if(p==="\n")h+="\n";else p="\n"}else{const s=r.Node.endOfLine(i,n);const o=i.slice(n,s);n=s;if(f&&(e===" "||e==="\t")&&n<c){if(p===" ")p="\n";else if(!d&&!u&&p==="\n")p="\n\n";h+=p+o;p=s<t&&i[s]||"";d=true}else{h+=p+o;p=f&&n<c?" ":"\n";d=false}if(u&&o!=="")u=false}}return this.chomping===s.STRIP?h:h+"\n"}parseBlockHeader(e){const{src:t}=this.context;let n=e+1;let i="";while(true){const o=t[n];switch(o){case"-":this.chomping=s.STRIP;break;case"+":this.chomping=s.KEEP;break;case"0":case"1":case"2":case"3":case"4":case"5":case"6":case"7":case"8":case"9":i+=o;break;default:this.blockIndent=Number(i)||null;this.header=new r.Range(e,n);return n}n+=1}}parseBlockValue(e){const{indent:t,src:n}=this.context;const i=!!this.blockIndent;let o=e;let a=e;let c=1;for(let e=n[o];e==="\n";e=n[o]){o+=1;if(r.Node.atDocumentBoundary(n,o))break;const e=r.Node.endOfBlockIndent(n,t,o);if(e===null)break;const s=n[e];const l=e-(o+t);if(!this.blockIndent){if(n[e]!=="\n"){if(l<c){const e="Block scalars with more-indented leading empty lines must use an explicit indentation indicator";this.error=new r.YAMLSemanticError(this,e)}this.blockIndent=l}else if(l>c){c=l}}else if(s&&s!=="\n"&&l<this.blockIndent){if(n[e]==="#")break;if(!this.error){const e=i?"explicit indentation indicator":"first line";const t=`Block scalars must not be less indented than their ${e}`;this.error=new r.YAMLSemanticError(this,t)}}if(n[e]==="\n"){o=e}else{o=a=r.Node.endOfLine(n,e)}}if(this.chomping!==s.KEEP){o=n[a]?a+1:a}this.valueRange=new r.Range(e+1,o);return o}parse(e,t){this.context=e;const{src:n}=e;let s=this.parseBlockHeader(t);s=r.Node.endOfWhiteSpace(n,s);s=this.parseComment(s);s=this.parseBlockValue(s);return s}setOrigRanges(e,t){t=super.setOrigRanges(e,t);return this.header?this.header.setOrigRange(e,t):t}}class FlowCollection extends r.Node{constructor(e,t){super(e,t);this.items=null}prevNodeIsJsonLike(e=this.items.length){const t=this.items[e-1];return!!t&&(t.jsonLike||t.type===r.Type.COMMENT&&this.prevNodeIsJsonLike(e-1))}parse(e,t){this.context=e;const{parseNode:n,src:s}=e;let{indent:i,lineStart:o}=e;let a=s[t];this.items=[{char:a,offset:t}];let c=r.Node.endOfWhiteSpace(s,t+1);a=s[c];while(a&&a!=="]"&&a!=="}"){switch(a){case"\n":{o=c+1;const e=r.Node.endOfWhiteSpace(s,o);if(s[e]==="\n"){const e=new BlankLine;o=e.parse({src:s},o);this.items.push(e)}c=r.Node.endOfIndent(s,o);if(c<=o+i){a=s[c];if(c<o+i||a!=="]"&&a!=="}"){const e="Insufficient indentation in flow collection";this.error=new r.YAMLSemanticError(this,e)}}}break;case",":{this.items.push({char:a,offset:c});c+=1}break;case"#":{const e=new Comment;c=e.parse({src:s},c);this.items.push(e)}break;case"?":case":":{const e=s[c+1];if(e==="\n"||e==="\t"||e===" "||e===","||a===":"&&this.prevNodeIsJsonLike()){this.items.push({char:a,offset:c});c+=1;break}}default:{const e=n({atLineStart:false,inCollection:false,inFlow:true,indent:-1,lineStart:o,parent:this},c);if(!e){this.valueRange=new r.Range(t,c);return c}this.items.push(e);c=r.Node.normalizeOffset(s,e.range.end)}}c=r.Node.endOfWhiteSpace(s,c);a=s[c]}this.valueRange=new r.Range(t,c+1);if(a){this.items.push({char:a,offset:c});c=r.Node.endOfWhiteSpace(s,c+1);c=this.parseComment(c)}return c}setOrigRanges(e,t){t=super.setOrigRanges(e,t);this.items.forEach((n=>{if(n instanceof r.Node){t=n.setOrigRanges(e,t)}else if(e.length===0){n.origOffset=n.offset}else{let r=t;while(r<e.length){if(e[r]>n.offset)break;else++r}n.origOffset=n.offset+r;t=r}}));return t}toString(){const{context:{src:e},items:t,range:n,value:s}=this;if(s!=null)return s;const i=t.filter((e=>e instanceof r.Node));let o="";let a=n.start;i.forEach((t=>{const n=e.slice(a,t.range.start);a=t.range.end;o+=n+String(t);if(o[o.length-1]==="\n"&&e[a-1]!=="\n"&&e[a]==="\n"){a+=1}}));o+=e.slice(a,n.end);return r.Node.addStringTerminator(e,n.end,o)}}class QuoteDouble extends r.Node{static endOfQuote(e,t){let n=e[t];while(n&&n!=='"'){t+=n==="\\"?2:1;n=e[t]}return t+1}get strValue(){if(!this.valueRange||!this.context)return null;const e=[];const{start:t,end:n}=this.valueRange;const{indent:s,src:i}=this.context;if(i[n-1]!=='"')e.push(new r.YAMLSyntaxError(this,'Missing closing "quote'));let o="";for(let a=t+1;a<n-1;++a){const t=i[a];if(t==="\n"){if(r.Node.atDocumentBoundary(i,a+1))e.push(new r.YAMLSemanticError(this,"Document boundary indicators are not allowed within string values"));const{fold:t,offset:n,error:c}=r.Node.foldNewline(i,a,s);o+=t;a=n;if(c)e.push(new r.YAMLSemanticError(this,"Multi-line double-quoted string needs to be sufficiently indented"))}else if(t==="\\"){a+=1;switch(i[a]){case"0":o+="\0";break;case"a":o+="";break;case"b":o+="\b";break;case"e":o+="";break;case"f":o+="\f";break;case"n":o+="\n";break;case"r":o+="\r";break;case"t":o+="\t";break;case"v":o+="\v";break;case"N":o+="";break;case"_":o+=" ";break;case"L":o+="\u2028";break;case"P":o+="\u2029";break;case" ":o+=" ";break;case'"':o+='"';break;case"/":o+="/";break;case"\\":o+="\\";break;case"\t":o+="\t";break;case"x":o+=this.parseCharCode(a+1,2,e);a+=2;break;case"u":o+=this.parseCharCode(a+1,4,e);a+=4;break;case"U":o+=this.parseCharCode(a+1,8,e);a+=8;break;case"\n":while(i[a+1]===" "||i[a+1]==="\t")a+=1;break;default:e.push(new r.YAMLSyntaxError(this,`Invalid escape sequence ${i.substr(a-1,2)}`));o+="\\"+i[a]}}else if(t===" "||t==="\t"){const e=a;let n=i[a+1];while(n===" "||n==="\t"){a+=1;n=i[a+1]}if(n!=="\n")o+=a>e?i.slice(e,a+1):t}else{o+=t}}return e.length>0?{errors:e,str:o}:o}parseCharCode(e,t,n){const{src:s}=this.context;const i=s.substr(e,t);const o=i.length===t&&/^[0-9a-fA-F]+$/.test(i);const a=o?parseInt(i,16):NaN;if(isNaN(a)){n.push(new r.YAMLSyntaxError(this,`Invalid escape sequence ${s.substr(e-2,t+2)}`));return s.substr(e-2,t+2)}return String.fromCodePoint(a)}parse(e,t){this.context=e;const{src:n}=e;let s=QuoteDouble.endOfQuote(n,t+1);this.valueRange=new r.Range(t,s);s=r.Node.endOfWhiteSpace(n,s);s=this.parseComment(s);return s}}class QuoteSingle extends r.Node{static endOfQuote(e,t){let n=e[t];while(n){if(n==="'"){if(e[t+1]!=="'")break;n=e[t+=2]}else{n=e[t+=1]}}return t+1}get strValue(){if(!this.valueRange||!this.context)return null;const e=[];const{start:t,end:n}=this.valueRange;const{indent:s,src:i}=this.context;if(i[n-1]!=="'")e.push(new r.YAMLSyntaxError(this,"Missing closing 'quote"));let o="";for(let a=t+1;a<n-1;++a){const t=i[a];if(t==="\n"){if(r.Node.atDocumentBoundary(i,a+1))e.push(new r.YAMLSemanticError(this,"Document boundary indicators are not allowed within string values"));const{fold:t,offset:n,error:c}=r.Node.foldNewline(i,a,s);o+=t;a=n;if(c)e.push(new r.YAMLSemanticError(this,"Multi-line single-quoted string needs to be sufficiently indented"))}else if(t==="'"){o+=t;a+=1;if(i[a]!=="'")e.push(new r.YAMLSyntaxError(this,"Unescaped single quote? This should not happen."))}else if(t===" "||t==="\t"){const e=a;let n=i[a+1];while(n===" "||n==="\t"){a+=1;n=i[a+1]}if(n!=="\n")o+=a>e?i.slice(e,a+1):t}else{o+=t}}return e.length>0?{errors:e,str:o}:o}parse(e,t){this.context=e;const{src:n}=e;let s=QuoteSingle.endOfQuote(n,t+1);this.valueRange=new r.Range(t,s);s=r.Node.endOfWhiteSpace(n,s);s=this.parseComment(s);return s}}function createNewNode(e,t){switch(e){case r.Type.ALIAS:return new Alias(e,t);case r.Type.BLOCK_FOLDED:case r.Type.BLOCK_LITERAL:return new BlockValue(e,t);case r.Type.FLOW_MAP:case r.Type.FLOW_SEQ:return new FlowCollection(e,t);case r.Type.MAP_KEY:case r.Type.MAP_VALUE:case r.Type.SEQ_ITEM:return new CollectionItem(e,t);case r.Type.COMMENT:case r.Type.PLAIN:return new r.PlainValue(e,t);case r.Type.QUOTE_DOUBLE:return new QuoteDouble(e,t);case r.Type.QUOTE_SINGLE:return new QuoteSingle(e,t);default:return null}}class ParseContext{static parseType(e,t,n){switch(e[t]){case"*":return r.Type.ALIAS;case">":return r.Type.BLOCK_FOLDED;case"|":return r.Type.BLOCK_LITERAL;case"{":return r.Type.FLOW_MAP;case"[":return r.Type.FLOW_SEQ;case"?":return!n&&r.Node.atBlank(e,t+1,true)?r.Type.MAP_KEY:r.Type.PLAIN;case":":return!n&&r.Node.atBlank(e,t+1,true)?r.Type.MAP_VALUE:r.Type.PLAIN;case"-":return!n&&r.Node.atBlank(e,t+1,true)?r.Type.SEQ_ITEM:r.Type.PLAIN;case'"':return r.Type.QUOTE_DOUBLE;case"'":return r.Type.QUOTE_SINGLE;default:return r.Type.PLAIN}}constructor(e={},{atLineStart:t,inCollection:n,inFlow:s,indent:i,lineStart:o,parent:a}={}){r._defineProperty(this,"parseNode",((e,t)=>{if(r.Node.atDocumentBoundary(this.src,t))return null;const n=new ParseContext(this,e);const{props:s,type:i,valueStart:o}=n.parseProps(t);const a=createNewNode(i,s);let c=a.parse(n,o);a.range=new r.Range(t,c);if(c<=t){a.error=new Error(`Node#parse consumed no characters`);a.error.parseEnd=c;a.error.source=a;a.range.end=t+1}if(n.nodeStartsCollection(a)){if(!a.error&&!n.atLineStart&&n.parent.type===r.Type.DOCUMENT){a.error=new r.YAMLSyntaxError(a,"Block collection must not have preceding content here (e.g. directives-end indicator)")}const e=new Collection(a);c=e.parse(new ParseContext(n),c);e.range=new r.Range(t,c);return e}return a}));this.atLineStart=t!=null?t:e.atLineStart||false;this.inCollection=n!=null?n:e.inCollection||false;this.inFlow=s!=null?s:e.inFlow||false;this.indent=i!=null?i:e.indent;this.lineStart=o!=null?o:e.lineStart;this.parent=a!=null?a:e.parent||{};this.root=e.root;this.src=e.src}nodeStartsCollection(e){const{inCollection:t,inFlow:n,src:s}=this;if(t||n)return false;if(e instanceof CollectionItem)return true;let i=e.range.end;if(s[i]==="\n"||s[i-1]==="\n")return false;i=r.Node.endOfWhiteSpace(s,i);return s[i]===":"}parseProps(e){const{inFlow:t,parent:n,src:s}=this;const i=[];let o=false;e=this.atLineStart?r.Node.endOfIndent(s,e):r.Node.endOfWhiteSpace(s,e);let a=s[e];while(a===r.Char.ANCHOR||a===r.Char.COMMENT||a===r.Char.TAG||a==="\n"){if(a==="\n"){let t=e;let i;do{i=t+1;t=r.Node.endOfIndent(s,i)}while(s[t]==="\n");const a=t-(i+this.indent);const c=n.type===r.Type.SEQ_ITEM&&n.context.atLineStart;if(s[t]!=="#"&&!r.Node.nextNodeIsIndented(s[t],a,!c))break;this.atLineStart=true;this.lineStart=i;o=false;e=t}else if(a===r.Char.COMMENT){const t=r.Node.endOfLine(s,e+1);i.push(new r.Range(e,t));e=t}else{let t=r.Node.endOfIdentifier(s,e+1);if(a===r.Char.TAG&&s[t]===","&&/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+,\d\d\d\d(-\d\d){0,2}\/\S/.test(s.slice(e+1,t+13))){t=r.Node.endOfIdentifier(s,t+5)}i.push(new r.Range(e,t));o=true;e=r.Node.endOfWhiteSpace(s,t)}a=s[e]}if(o&&a===":"&&r.Node.atBlank(s,e+1,true))e-=1;const c=ParseContext.parseType(s,e,t);return{props:i,type:c,valueStart:e}}}function parse(e){const t=[];if(e.indexOf("\r")!==-1){e=e.replace(/\r\n?/g,((e,n)=>{if(e.length>1)t.push(n);return"\n"}))}const n=[];let r=0;do{const t=new Document;const s=new ParseContext({src:e});r=t.parse(s,r);n.push(t)}while(r<e.length);n.setOrigRanges=()=>{if(t.length===0)return false;for(let e=1;e<t.length;++e)t[e]-=e;let e=0;for(let r=0;r<n.length;++r){e=n[r].setOrigRanges(t,e)}t.splice(0,t.length);return true};n.toString=()=>n.join("...\n");return n}t.parse=parse},914:(e,t,n)=>{"use strict";var r=n(941);function addCommentBefore(e,t,n){if(!n)return e;const r=n.replace(/[\s\S]^/gm,`$&${t}#`);return`#${r}\n${t}${e}`}function addComment(e,t,n){return!n?e:n.indexOf("\n")===-1?`${e} #${n}`:`${e}\n`+n.replace(/^/gm,`${t||""}#`)}class Node{}function toJSON(e,t,n){if(Array.isArray(e))return e.map(((e,t)=>toJSON(e,String(t),n)));if(e&&typeof e.toJSON==="function"){const r=n&&n.anchors&&n.anchors.get(e);if(r)n.onCreate=e=>{r.res=e;delete n.onCreate};const s=e.toJSON(t,n);if(r&&n.onCreate)n.onCreate(s);return s}if((!n||!n.keep)&&typeof e==="bigint")return Number(e);return e}class Scalar extends Node{constructor(e){super();this.value=e}toJSON(e,t){return t&&t.keep?this.value:toJSON(this.value,e,t)}toString(){return String(this.value)}}function collectionFromPath(e,t,n){let r=n;for(let e=t.length-1;e>=0;--e){const n=t[e];if(Number.isInteger(n)&&n>=0){const e=[];e[n]=r;r=e}else{const e={};Object.defineProperty(e,n,{value:r,writable:true,enumerable:true,configurable:true});r=e}}return e.createNode(r,false)}const isEmptyPath=e=>e==null||typeof e==="object"&&e[Symbol.iterator]().next().done;class Collection extends Node{constructor(e){super();r._defineProperty(this,"items",[]);this.schema=e}addIn(e,t){if(isEmptyPath(e))this.add(t);else{const[n,...r]=e;const s=this.get(n,true);if(s instanceof Collection)s.addIn(r,t);else if(s===undefined&&this.schema)this.set(n,collectionFromPath(this.schema,r,t));else throw new Error(`Expected YAML collection at ${n}. Remaining path: ${r}`)}}deleteIn([e,...t]){if(t.length===0)return this.delete(e);const n=this.get(e,true);if(n instanceof Collection)return n.deleteIn(t);else throw new Error(`Expected YAML collection at ${e}. Remaining path: ${t}`)}getIn([e,...t],n){const r=this.get(e,true);if(t.length===0)return!n&&r instanceof Scalar?r.value:r;else return r instanceof Collection?r.getIn(t,n):undefined}hasAllNullValues(){return this.items.every((e=>{if(!e||e.type!=="PAIR")return false;const t=e.value;return t==null||t instanceof Scalar&&t.value==null&&!t.commentBefore&&!t.comment&&!t.tag}))}hasIn([e,...t]){if(t.length===0)return this.has(e);const n=this.get(e,true);return n instanceof Collection?n.hasIn(t):false}setIn([e,...t],n){if(t.length===0){this.set(e,n)}else{const r=this.get(e,true);if(r instanceof Collection)r.setIn(t,n);else if(r===undefined&&this.schema)this.set(e,collectionFromPath(this.schema,t,n));else throw new Error(`Expected YAML collection at ${e}. Remaining path: ${t}`)}}toJSON(){return null}toString(e,{blockItem:t,flowChars:n,isMap:s,itemIndent:i},o,a){const{indent:c,indentStep:l,stringify:f}=e;const u=this.type===r.Type.FLOW_MAP||this.type===r.Type.FLOW_SEQ||e.inFlow;if(u)i+=l;const h=s&&this.hasAllNullValues();e=Object.assign({},e,{allNullValues:h,indent:i,inFlow:u,type:null});let p=false;let d=false;const g=this.items.reduce(((t,n,r)=>{let s;if(n){if(!p&&n.spaceBefore)t.push({type:"comment",str:""});if(n.commentBefore)n.commentBefore.match(/^.*$/gm).forEach((e=>{t.push({type:"comment",str:`#${e}`})}));if(n.comment)s=n.comment;if(u&&(!p&&n.spaceBefore||n.commentBefore||n.comment||n.key&&(n.key.commentBefore||n.key.comment)||n.value&&(n.value.commentBefore||n.value.comment)))d=true}p=false;let o=f(n,e,(()=>s=null),(()=>p=true));if(u&&!d&&o.includes("\n"))d=true;if(u&&r<this.items.length-1)o+=",";o=addComment(o,i,s);if(p&&(s||u))p=false;t.push({type:"item",str:o});return t}),[]);let m;if(g.length===0){m=n.start+n.end}else if(u){const{start:e,end:t}=n;const r=g.map((e=>e.str));if(d||r.reduce(((e,t)=>e+t.length+2),2)>Collection.maxFlowStringSingleLineLength){m=e;for(const e of r){m+=e?`\n${l}${c}${e}`:"\n"}m+=`\n${c}${t}`}else{m=`${e} ${r.join(" ")} ${t}`}}else{const e=g.map(t);m=e.shift();for(const t of e)m+=t?`\n${c}${t}`:"\n"}if(this.comment){m+="\n"+this.comment.replace(/^/gm,`${c}#`);if(o)o()}else if(p&&a)a();return m}}r._defineProperty(Collection,"maxFlowStringSingleLineLength",60);function asItemIndex(e){let t=e instanceof Scalar?e.value:e;if(t&&typeof t==="string")t=Number(t);return Number.isInteger(t)&&t>=0?t:null}class YAMLSeq extends Collection{add(e){this.items.push(e)}delete(e){const t=asItemIndex(e);if(typeof t!=="number")return false;const n=this.items.splice(t,1);return n.length>0}get(e,t){const n=asItemIndex(e);if(typeof n!=="number")return undefined;const r=this.items[n];return!t&&r instanceof Scalar?r.value:r}has(e){const t=asItemIndex(e);return typeof t==="number"&&t<this.items.length}set(e,t){const n=asItemIndex(e);if(typeof n!=="number")throw new Error(`Expected a valid index, not ${e}.`);this.items[n]=t}toJSON(e,t){const n=[];if(t&&t.onCreate)t.onCreate(n);let r=0;for(const e of this.items)n.push(toJSON(e,String(r++),t));return n}toString(e,t,n){if(!e)return JSON.stringify(this);return super.toString(e,{blockItem:e=>e.type==="comment"?e.str:`- ${e.str}`,flowChars:{start:"[",end:"]"},isMap:false,itemIndent:(e.indent||"")+"  "},t,n)}}const stringifyKey=(e,t,n)=>{if(t===null)return"";if(typeof t!=="object")return String(t);if(e instanceof Node&&n&&n.doc)return e.toString({anchors:Object.create(null),doc:n.doc,indent:"",indentStep:n.indentStep,inFlow:true,inStringifyKey:true,stringify:n.stringify});return JSON.stringify(t)};class Pair extends Node{constructor(e,t=null){super();this.key=e;this.value=t;this.type=Pair.Type.PAIR}get commentBefore(){return this.key instanceof Node?this.key.commentBefore:undefined}set commentBefore(e){if(this.key==null)this.key=new Scalar(null);if(this.key instanceof Node)this.key.commentBefore=e;else{const e="Pair.commentBefore is an alias for Pair.key.commentBefore. To set it, the key must be a Node.";throw new Error(e)}}addToJSMap(e,t){const n=toJSON(this.key,"",e);if(t instanceof Map){const r=toJSON(this.value,n,e);t.set(n,r)}else if(t instanceof Set){t.add(n)}else{const r=stringifyKey(this.key,n,e);const s=toJSON(this.value,r,e);if(r in t)Object.defineProperty(t,r,{value:s,writable:true,enumerable:true,configurable:true});else t[r]=s}return t}toJSON(e,t){const n=t&&t.mapAsMap?new Map:{};return this.addToJSMap(t,n)}toString(e,t,n){if(!e||!e.doc)return JSON.stringify(this);const{indent:s,indentSeq:i,simpleKeys:o}=e.doc.options;let{key:a,value:c}=this;let l=a instanceof Node&&a.comment;if(o){if(l){throw new Error("With simple keys, key nodes cannot have comments")}if(a instanceof Collection){const e="With simple keys, collection cannot be used as a key value";throw new Error(e)}}let f=!o&&(!a||l||(a instanceof Node?a instanceof Collection||a.type===r.Type.BLOCK_FOLDED||a.type===r.Type.BLOCK_LITERAL:typeof a==="object"));const{doc:u,indent:h,indentStep:p,stringify:d}=e;e=Object.assign({},e,{implicitKey:!f,indent:h+p});let g=false;let m=d(a,e,(()=>l=null),(()=>g=true));m=addComment(m,e.indent,l);if(!f&&m.length>1024){if(o)throw new Error("With simple keys, single line scalar must not span more than 1024 characters");f=true}if(e.allNullValues&&!o){if(this.comment){m=addComment(m,e.indent,this.comment);if(t)t()}else if(g&&!l&&n)n();return e.inFlow&&!f?m:`? ${m}`}m=f?`? ${m}\n${h}:`:`${m}:`;if(this.comment){m=addComment(m,e.indent,this.comment);if(t)t()}let y="";let S=null;if(c instanceof Node){if(c.spaceBefore)y="\n";if(c.commentBefore){const t=c.commentBefore.replace(/^/gm,`${e.indent}#`);y+=`\n${t}`}S=c.comment}else if(c&&typeof c==="object"){c=u.schema.createNode(c,true)}e.implicitKey=false;if(!f&&!this.comment&&c instanceof Scalar)e.indentAtStart=m.length+1;g=false;if(!i&&s>=2&&!e.inFlow&&!f&&c instanceof YAMLSeq&&c.type!==r.Type.FLOW_SEQ&&!c.tag&&!u.anchors.getName(c)){e.indent=e.indent.substr(2)}const w=d(c,e,(()=>S=null),(()=>g=true));let v=" ";if(y||this.comment){v=`${y}\n${e.indent}`}else if(!f&&c instanceof Collection){const t=w[0]==="["||w[0]==="{";if(!t||w.includes("\n"))v=`\n${e.indent}`}else if(w[0]==="\n")v="";if(g&&!S&&n)n();return addComment(m+v+w,e.indent,S)}}r._defineProperty(Pair,"Type",{PAIR:"PAIR",MERGE_PAIR:"MERGE_PAIR"});const getAliasCount=(e,t)=>{if(e instanceof Alias){const n=t.get(e.source);return n.count*n.aliasCount}else if(e instanceof Collection){let n=0;for(const r of e.items){const e=getAliasCount(r,t);if(e>n)n=e}return n}else if(e instanceof Pair){const n=getAliasCount(e.key,t);const r=getAliasCount(e.value,t);return Math.max(n,r)}return 1};class Alias extends Node{static stringify({range:e,source:t},{anchors:n,doc:r,implicitKey:s,inStringifyKey:i}){let o=Object.keys(n).find((e=>n[e]===t));if(!o&&i)o=r.anchors.getName(t)||r.anchors.newName();if(o)return`*${o}${s?" ":""}`;const a=r.anchors.getName(t)?"Alias node must be after source node":"Source node not found for alias node";throw new Error(`${a} [${e}]`)}constructor(e){super();this.source=e;this.type=r.Type.ALIAS}set tag(e){throw new Error("Alias nodes cannot have tags")}toJSON(e,t){if(!t)return toJSON(this.source,e,t);const{anchors:n,maxAliasCount:s}=t;const i=n.get(this.source);if(!i||i.res===undefined){const e="This should not happen: Alias anchor was not resolved?";if(this.cstNode)throw new r.YAMLReferenceError(this.cstNode,e);else throw new ReferenceError(e)}if(s>=0){i.count+=1;if(i.aliasCount===0)i.aliasCount=getAliasCount(this.source,n);if(i.count*i.aliasCount>s){const e="Excessive alias count indicates a resource exhaustion attack";if(this.cstNode)throw new r.YAMLReferenceError(this.cstNode,e);else throw new ReferenceError(e)}}return i.res}toString(e){return Alias.stringify(this,e)}}r._defineProperty(Alias,"default",true);function findPair(e,t){const n=t instanceof Scalar?t.value:t;for(const r of e){if(r instanceof Pair){if(r.key===t||r.key===n)return r;if(r.key&&r.key.value===n)return r}}return undefined}class YAMLMap extends Collection{add(e,t){if(!e)e=new Pair(e);else if(!(e instanceof Pair))e=new Pair(e.key||e,e.value);const n=findPair(this.items,e.key);const r=this.schema&&this.schema.sortMapEntries;if(n){if(t)n.value=e.value;else throw new Error(`Key ${e.key} already set`)}else if(r){const t=this.items.findIndex((t=>r(e,t)<0));if(t===-1)this.items.push(e);else this.items.splice(t,0,e)}else{this.items.push(e)}}delete(e){const t=findPair(this.items,e);if(!t)return false;const n=this.items.splice(this.items.indexOf(t),1);return n.length>0}get(e,t){const n=findPair(this.items,e);const r=n&&n.value;return!t&&r instanceof Scalar?r.value:r}has(e){return!!findPair(this.items,e)}set(e,t){this.add(new Pair(e,t),true)}toJSON(e,t,n){const r=n?new n:t&&t.mapAsMap?new Map:{};if(t&&t.onCreate)t.onCreate(r);for(const e of this.items)e.addToJSMap(t,r);return r}toString(e,t,n){if(!e)return JSON.stringify(this);for(const e of this.items){if(!(e instanceof Pair))throw new Error(`Map items must all be pairs; found ${JSON.stringify(e)} instead`)}return super.toString(e,{blockItem:e=>e.str,flowChars:{start:"{",end:"}"},isMap:true,itemIndent:e.indent||""},t,n)}}const s="<<";class Merge extends Pair{constructor(e){if(e instanceof Pair){let t=e.value;if(!(t instanceof YAMLSeq)){t=new YAMLSeq;t.items.push(e.value);t.range=e.value.range}super(e.key,t);this.range=e.range}else{super(new Scalar(s),new YAMLSeq)}this.type=Pair.Type.MERGE_PAIR}addToJSMap(e,t){for(const{source:n}of this.value.items){if(!(n instanceof YAMLMap))throw new Error("Merge sources must be maps");const r=n.toJSON(null,e,Map);for(const[e,n]of r){if(t instanceof Map){if(!t.has(e))t.set(e,n)}else if(t instanceof Set){t.add(e)}else if(!Object.prototype.hasOwnProperty.call(t,e)){Object.defineProperty(t,e,{value:n,writable:true,enumerable:true,configurable:true})}}}return t}toString(e,t){const n=this.value;if(n.items.length>1)return super.toString(e,t);this.value=n.items[0];const r=super.toString(e,t);this.value=n;return r}}const i={defaultType:r.Type.BLOCK_LITERAL,lineWidth:76};const o={trueStr:"true",falseStr:"false"};const a={asBigInt:false};const c={nullStr:"null"};const l={defaultType:r.Type.PLAIN,doubleQuoted:{jsonEncoding:false,minMultiLineLength:40},fold:{lineWidth:80,minContentWidth:20}};function resolveScalar(e,t,n){for(const{format:n,test:r,resolve:s}of t){if(r){const t=e.match(r);if(t){let e=s.apply(null,t);if(!(e instanceof Scalar))e=new Scalar(e);if(n)e.format=n;return e}}}if(n)e=n(e);return new Scalar(e)}const f="flow";const u="block";const h="quoted";const consumeMoreIndentedLines=(e,t)=>{let n=e[t+1];while(n===" "||n==="\t"){do{n=e[t+=1]}while(n&&n!=="\n");n=e[t+1]}return t};function foldFlowLines(e,t,n,{indentAtStart:r,lineWidth:s=80,minContentWidth:i=20,onFold:o,onOverflow:a}){if(!s||s<0)return e;const c=Math.max(1+i,1+s-t.length);if(e.length<=c)return e;const l=[];const f={};let p=s-t.length;if(typeof r==="number"){if(r>s-Math.max(2,i))l.push(0);else p=s-r}let d=undefined;let g=undefined;let m=false;let y=-1;let S=-1;let w=-1;if(n===u){y=consumeMoreIndentedLines(e,y);if(y!==-1)p=y+c}for(let t;t=e[y+=1];){if(n===h&&t==="\\"){S=y;switch(e[y+1]){case"x":y+=3;break;case"u":y+=5;break;case"U":y+=9;break;default:y+=1}w=y}if(t==="\n"){if(n===u)y=consumeMoreIndentedLines(e,y);p=y+c;d=undefined}else{if(t===" "&&g&&g!==" "&&g!=="\n"&&g!=="\t"){const t=e[y+1];if(t&&t!==" "&&t!=="\n"&&t!=="\t")d=y}if(y>=p){if(d){l.push(d);p=d+c;d=undefined}else if(n===h){while(g===" "||g==="\t"){g=t;t=e[y+=1];m=true}const n=y>w+1?y-2:S-1;if(f[n])return e;l.push(n);f[n]=true;p=n+c;d=undefined}else{m=true}}}g=t}if(m&&a)a();if(l.length===0)return e;if(o)o();let v=e.slice(0,l[0]);for(let r=0;r<l.length;++r){const s=l[r];const i=l[r+1]||e.length;if(s===0)v=`\n${t}${e.slice(0,i)}`;else{if(n===h&&f[s])v+=`${e[s]}\\`;v+=`\n${t}${e.slice(s+1,i)}`}}return v}const getFoldOptions=({indentAtStart:e})=>e?Object.assign({indentAtStart:e},l.fold):l.fold;const containsDocumentMarker=e=>/^(%|---|\.\.\.)/m.test(e);function lineLengthOverLimit(e,t,n){if(!t||t<0)return false;const r=t-n;const s=e.length;if(s<=r)return false;for(let t=0,n=0;t<s;++t){if(e[t]==="\n"){if(t-n>r)return true;n=t+1;if(s-n<=r)return false}}return true}function doubleQuotedString(e,t){const{implicitKey:n}=t;const{jsonEncoding:r,minMultiLineLength:s}=l.doubleQuoted;const i=JSON.stringify(e);if(r)return i;const o=t.indent||(containsDocumentMarker(e)?"  ":"");let a="";let c=0;for(let e=0,t=i[e];t;t=i[++e]){if(t===" "&&i[e+1]==="\\"&&i[e+2]==="n"){a+=i.slice(c,e)+"\\ ";e+=1;c=e;t="\\"}if(t==="\\")switch(i[e+1]){case"u":{a+=i.slice(c,e);const t=i.substr(e+2,4);switch(t){case"0000":a+="\\0";break;case"0007":a+="\\a";break;case"000b":a+="\\v";break;case"001b":a+="\\e";break;case"0085":a+="\\N";break;case"00a0":a+="\\_";break;case"2028":a+="\\L";break;case"2029":a+="\\P";break;default:if(t.substr(0,2)==="00")a+="\\x"+t.substr(2);else a+=i.substr(e,6)}e+=5;c=e+1}break;case"n":if(n||i[e+2]==='"'||i.length<s){e+=1}else{a+=i.slice(c,e)+"\n\n";while(i[e+2]==="\\"&&i[e+3]==="n"&&i[e+4]!=='"'){a+="\n";e+=2}a+=o;if(i[e+2]===" ")a+="\\";e+=1;c=e+1}break;default:e+=1}}a=c?a+i.slice(c):i;return n?a:foldFlowLines(a,o,h,getFoldOptions(t))}function singleQuotedString(e,t){if(t.implicitKey){if(/\n/.test(e))return doubleQuotedString(e,t)}else{if(/[ \t]\n|\n[ \t]/.test(e))return doubleQuotedString(e,t)}const n=t.indent||(containsDocumentMarker(e)?"  ":"");const r="'"+e.replace(/'/g,"''").replace(/\n+/g,`$&\n${n}`)+"'";return t.implicitKey?r:foldFlowLines(r,n,f,getFoldOptions(t))}function blockString({comment:e,type:t,value:n},s,i,o){if(/\n[\t ]+$/.test(n)||/^\s*$/.test(n)){return doubleQuotedString(n,s)}const a=s.indent||(s.forceBlockIndent||containsDocumentMarker(n)?"  ":"");const c=a?"2":"1";const f=t===r.Type.BLOCK_FOLDED?false:t===r.Type.BLOCK_LITERAL?true:!lineLengthOverLimit(n,l.fold.lineWidth,a.length);let h=f?"|":">";if(!n)return h+"\n";let p="";let d="";n=n.replace(/[\n\t ]*$/,(e=>{const t=e.indexOf("\n");if(t===-1){h+="-"}else if(n===e||t!==e.length-1){h+="+";if(o)o()}d=e.replace(/\n$/,"");return""})).replace(/^[\n ]*/,(e=>{if(e.indexOf(" ")!==-1)h+=c;const t=e.match(/ +$/);if(t){p=e.slice(0,-t[0].length);return t[0]}else{p=e;return""}}));if(d)d=d.replace(/\n+(?!\n|$)/g,`$&${a}`);if(p)p=p.replace(/\n+/g,`$&${a}`);if(e){h+=" #"+e.replace(/ ?[\r\n]+/g," ");if(i)i()}if(!n)return`${h}${c}\n${a}${d}`;if(f){n=n.replace(/\n+/g,`$&${a}`);return`${h}\n${a}${p}${n}${d}`}n=n.replace(/\n+/g,"\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g,"$1$2").replace(/\n+/g,`$&${a}`);const g=foldFlowLines(`${p}${n}${d}`,a,u,l.fold);return`${h}\n${a}${g}`}function plainString(e,t,n,s){const{comment:i,type:o,value:a}=e;const{actualString:c,implicitKey:l,indent:u,inFlow:h}=t;if(l&&/[\n[\]{},]/.test(a)||h&&/[[\]{},]/.test(a)){return doubleQuotedString(a,t)}if(!a||/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(a)){return l||h||a.indexOf("\n")===-1?a.indexOf('"')!==-1&&a.indexOf("'")===-1?singleQuotedString(a,t):doubleQuotedString(a,t):blockString(e,t,n,s)}if(!l&&!h&&o!==r.Type.PLAIN&&a.indexOf("\n")!==-1){return blockString(e,t,n,s)}if(u===""&&containsDocumentMarker(a)){t.forceBlockIndent=true;return blockString(e,t,n,s)}const p=a.replace(/\n+/g,`$&\n${u}`);if(c){const{tags:e}=t.doc.schema;const n=resolveScalar(p,e,e.scalarFallback).value;if(typeof n!=="string")return doubleQuotedString(a,t)}const d=l?p:foldFlowLines(p,u,f,getFoldOptions(t));if(i&&!h&&(d.indexOf("\n")!==-1||i.indexOf("\n")!==-1)){if(n)n();return addCommentBefore(d,u,i)}return d}function stringifyString(e,t,n,s){const{defaultType:i}=l;const{implicitKey:o,inFlow:a}=t;let{type:c,value:f}=e;if(typeof f!=="string"){f=String(f);e=Object.assign({},e,{value:f})}const _stringify=i=>{switch(i){case r.Type.BLOCK_FOLDED:case r.Type.BLOCK_LITERAL:return blockString(e,t,n,s);case r.Type.QUOTE_DOUBLE:return doubleQuotedString(f,t);case r.Type.QUOTE_SINGLE:return singleQuotedString(f,t);case r.Type.PLAIN:return plainString(e,t,n,s);default:return null}};if(c!==r.Type.QUOTE_DOUBLE&&/[\x00-\x08\x0b-\x1f\x7f-\x9f]/.test(f)){c=r.Type.QUOTE_DOUBLE}else if((o||a)&&(c===r.Type.BLOCK_FOLDED||c===r.Type.BLOCK_LITERAL)){c=r.Type.QUOTE_DOUBLE}let u=_stringify(c);if(u===null){u=_stringify(i);if(u===null)throw new Error(`Unsupported default string type ${i}`)}return u}function stringifyNumber({format:e,minFractionDigits:t,tag:n,value:r}){if(typeof r==="bigint")return String(r);if(!isFinite(r))return isNaN(r)?".nan":r<0?"-.inf":".inf";let s=JSON.stringify(r);if(!e&&t&&(!n||n==="tag:yaml.org,2002:float")&&/^\d/.test(s)){let e=s.indexOf(".");if(e<0){e=s.length;s+="."}let n=t-(s.length-e-1);while(n-- >0)s+="0"}return s}function checkFlowCollectionEnd(e,t){let n,s;switch(t.type){case r.Type.FLOW_MAP:n="}";s="flow map";break;case r.Type.FLOW_SEQ:n="]";s="flow sequence";break;default:e.push(new r.YAMLSemanticError(t,"Not a flow collection!?"));return}let i;for(let e=t.items.length-1;e>=0;--e){const n=t.items[e];if(!n||n.type!==r.Type.COMMENT){i=n;break}}if(i&&i.char!==n){const o=`Expected ${s} to end with ${n}`;let a;if(typeof i.offset==="number"){a=new r.YAMLSemanticError(t,o);a.offset=i.offset+1}else{a=new r.YAMLSemanticError(i,o);if(i.range&&i.range.end)a.offset=i.range.end-i.range.start}e.push(a)}}function checkFlowCommentSpace(e,t){const n=t.context.src[t.range.start-1];if(n!=="\n"&&n!=="\t"&&n!==" "){const n="Comments must be separated from other tokens by white space characters";e.push(new r.YAMLSemanticError(t,n))}}function getLongKeyError(e,t){const n=String(t);const s=n.substr(0,8)+"..."+n.substr(-8);return new r.YAMLSemanticError(e,`The "${s}" key is too long`)}function resolveComments(e,t){for(const{afterKey:n,before:r,comment:s}of t){let t=e.items[r];if(!t){if(s!==undefined){if(e.comment)e.comment+="\n"+s;else e.comment=s}}else{if(n&&t.value)t=t.value;if(s===undefined){if(n||!t.commentBefore)t.spaceBefore=true}else{if(t.commentBefore)t.commentBefore+="\n"+s;else t.commentBefore=s}}}}function resolveString(e,t){const n=t.strValue;if(!n)return"";if(typeof n==="string")return n;n.errors.forEach((n=>{if(!n.source)n.source=t;e.errors.push(n)}));return n.str}function resolveTagHandle(e,t){const{handle:n,suffix:s}=t.tag;let i=e.tagPrefixes.find((e=>e.handle===n));if(!i){const s=e.getDefaults().tagPrefixes;if(s)i=s.find((e=>e.handle===n));if(!i)throw new r.YAMLSemanticError(t,`The ${n} tag handle is non-default and was not declared.`)}if(!s)throw new r.YAMLSemanticError(t,`The ${n} tag has no suffix.`);if(n==="!"&&(e.version||e.options.version)==="1.0"){if(s[0]==="^"){e.warnings.push(new r.YAMLWarning(t,"YAML 1.0 ^ tag expansion is not supported"));return s}if(/[:/]/.test(s)){const e=s.match(/^([a-z0-9-]+)\/(.*)/i);return e?`tag:${e[1]}.yaml.org,2002:${e[2]}`:`tag:${s}`}}return i.prefix+decodeURIComponent(s)}function resolveTagName(e,t){const{tag:n,type:s}=t;let i=false;if(n){const{handle:s,suffix:o,verbatim:a}=n;if(a){if(a!=="!"&&a!=="!!")return a;const n=`Verbatim tags aren't resolved, so ${a} is invalid.`;e.errors.push(new r.YAMLSemanticError(t,n))}else if(s==="!"&&!o){i=true}else{try{return resolveTagHandle(e,t)}catch(t){e.errors.push(t)}}}switch(s){case r.Type.BLOCK_FOLDED:case r.Type.BLOCK_LITERAL:case r.Type.QUOTE_DOUBLE:case r.Type.QUOTE_SINGLE:return r.defaultTags.STR;case r.Type.FLOW_MAP:case r.Type.MAP:return r.defaultTags.MAP;case r.Type.FLOW_SEQ:case r.Type.SEQ:return r.defaultTags.SEQ;case r.Type.PLAIN:return i?r.defaultTags.STR:null;default:return null}}function resolveByTagName(e,t,n){const{tags:r}=e.schema;const s=[];for(const i of r){if(i.tag===n){if(i.test)s.push(i);else{const n=i.resolve(e,t);return n instanceof Collection?n:new Scalar(n)}}}const i=resolveString(e,t);if(typeof i==="string"&&s.length>0)return resolveScalar(i,s,r.scalarFallback);return null}function getFallbackTagName({type:e}){switch(e){case r.Type.FLOW_MAP:case r.Type.MAP:return r.defaultTags.MAP;case r.Type.FLOW_SEQ:case r.Type.SEQ:return r.defaultTags.SEQ;default:return r.defaultTags.STR}}function resolveTag(e,t,n){try{const r=resolveByTagName(e,t,n);if(r){if(n&&t.tag)r.tag=n;return r}}catch(n){if(!n.source)n.source=t;e.errors.push(n);return null}try{const s=getFallbackTagName(t);if(!s)throw new Error(`The tag ${n} is unavailable`);const i=`The tag ${n} is unavailable, falling back to ${s}`;e.warnings.push(new r.YAMLWarning(t,i));const o=resolveByTagName(e,t,s);o.tag=n;return o}catch(n){const s=new r.YAMLReferenceError(t,n.message);s.stack=n.stack;e.errors.push(s);return null}}const isCollectionItem=e=>{if(!e)return false;const{type:t}=e;return t===r.Type.MAP_KEY||t===r.Type.MAP_VALUE||t===r.Type.SEQ_ITEM};function resolveNodeProps(e,t){const n={before:[],after:[]};let s=false;let i=false;const o=isCollectionItem(t.context.parent)?t.context.parent.props.concat(t.props):t.props;for(const{start:a,end:c}of o){switch(t.context.src[a]){case r.Char.COMMENT:{if(!t.commentHasRequiredWhitespace(a)){const n="Comments must be separated from other tokens by white space characters";e.push(new r.YAMLSemanticError(t,n))}const{header:s,valueRange:i}=t;const o=i&&(a>i.start||s&&a>s.start)?n.after:n.before;o.push(t.context.src.slice(a+1,c));break}case r.Char.ANCHOR:if(s){const n="A node can have at most one anchor";e.push(new r.YAMLSemanticError(t,n))}s=true;break;case r.Char.TAG:if(i){const n="A node can have at most one tag";e.push(new r.YAMLSemanticError(t,n))}i=true;break}}return{comments:n,hasAnchor:s,hasTag:i}}function resolveNodeValue(e,t){const{anchors:n,errors:s,schema:i}=e;if(t.type===r.Type.ALIAS){const e=t.rawValue;const i=n.getNode(e);if(!i){const n=`Aliased anchor not found: ${e}`;s.push(new r.YAMLReferenceError(t,n));return null}const o=new Alias(i);n._cstAliases.push(o);return o}const o=resolveTagName(e,t);if(o)return resolveTag(e,t,o);if(t.type!==r.Type.PLAIN){const e=`Failed to resolve ${t.type} node here`;s.push(new r.YAMLSyntaxError(t,e));return null}try{const n=resolveString(e,t);return resolveScalar(n,i.tags,i.tags.scalarFallback)}catch(e){if(!e.source)e.source=t;s.push(e);return null}}function resolveNode(e,t){if(!t)return null;if(t.error)e.errors.push(t.error);const{comments:n,hasAnchor:s,hasTag:i}=resolveNodeProps(e.errors,t);if(s){const{anchors:n}=e;const r=t.anchor;const s=n.getNode(r);if(s)n.map[n.newName(r)]=s;n.map[r]=t}if(t.type===r.Type.ALIAS&&(s||i)){const n="An alias node must not specify any properties";e.errors.push(new r.YAMLSemanticError(t,n))}const o=resolveNodeValue(e,t);if(o){o.range=[t.range.start,t.range.end];if(e.options.keepCstNodes)o.cstNode=t;if(e.options.keepNodeTypes)o.type=t.type;const r=n.before.join("\n");if(r){o.commentBefore=o.commentBefore?`${o.commentBefore}\n${r}`:r}const s=n.after.join("\n");if(s)o.comment=o.comment?`${o.comment}\n${s}`:s}return t.resolved=o}function resolveMap(e,t){if(t.type!==r.Type.MAP&&t.type!==r.Type.FLOW_MAP){const n=`A ${t.type} node cannot be resolved as a mapping`;e.errors.push(new r.YAMLSyntaxError(t,n));return null}const{comments:n,items:i}=t.type===r.Type.FLOW_MAP?resolveFlowMapItems(e,t):resolveBlockMapItems(e,t);const o=new YAMLMap;o.items=i;resolveComments(o,n);let a=false;for(let n=0;n<i.length;++n){const{key:o}=i[n];if(o instanceof Collection)a=true;if(e.schema.merge&&o&&o.value===s){i[n]=new Merge(i[n]);const s=i[n].value.items;let o=null;s.some((e=>{if(e instanceof Alias){const{type:t}=e.source;if(t===r.Type.MAP||t===r.Type.FLOW_MAP)return false;return o="Merge nodes aliases can only point to maps"}return o="Merge nodes can only have Alias nodes as values"}));if(o)e.errors.push(new r.YAMLSemanticError(t,o))}else{for(let s=n+1;s<i.length;++s){const{key:n}=i[s];if(o===n||o&&n&&Object.prototype.hasOwnProperty.call(o,"value")&&o.value===n.value){const n=`Map keys must be unique; "${o}" is repeated`;e.errors.push(new r.YAMLSemanticError(t,n));break}}}}if(a&&!e.options.mapAsMap){const n="Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";e.warnings.push(new r.YAMLWarning(t,n))}t.resolved=o;return o}const valueHasPairComment=({context:{lineStart:e,node:t,src:n},props:s})=>{if(s.length===0)return false;const{start:i}=s[0];if(t&&i>t.valueRange.start)return false;if(n[i]!==r.Char.COMMENT)return false;for(let t=e;t<i;++t)if(n[t]==="\n")return false;return true};function resolvePairComment(e,t){if(!valueHasPairComment(e))return;const n=e.getPropValue(0,r.Char.COMMENT,true);let s=false;const i=t.value.commentBefore;if(i&&i.startsWith(n)){t.value.commentBefore=i.substr(n.length+1);s=true}else{const r=t.value.comment;if(!e.node&&r&&r.startsWith(n)){t.value.comment=r.substr(n.length+1);s=true}}if(s)t.comment=n}function resolveBlockMapItems(e,t){const n=[];const s=[];let i=undefined;let o=null;for(let a=0;a<t.items.length;++a){const c=t.items[a];switch(c.type){case r.Type.BLANK_LINE:n.push({afterKey:!!i,before:s.length});break;case r.Type.COMMENT:n.push({afterKey:!!i,before:s.length,comment:c.comment});break;case r.Type.MAP_KEY:if(i!==undefined)s.push(new Pair(i));if(c.error)e.errors.push(c.error);i=resolveNode(e,c.node);o=null;break;case r.Type.MAP_VALUE:{if(i===undefined)i=null;if(c.error)e.errors.push(c.error);if(!c.context.atLineStart&&c.node&&c.node.type===r.Type.MAP&&!c.node.context.atLineStart){const t="Nested mappings are not allowed in compact mappings";e.errors.push(new r.YAMLSemanticError(c.node,t))}let n=c.node;if(!n&&c.props.length>0){n=new r.PlainValue(r.Type.PLAIN,[]);n.context={parent:c,src:c.context.src};const e=c.range.start+1;n.range={start:e,end:e};n.valueRange={start:e,end:e};if(typeof c.range.origStart==="number"){const e=c.range.origStart+1;n.range.origStart=n.range.origEnd=e;n.valueRange.origStart=n.valueRange.origEnd=e}}const a=new Pair(i,resolveNode(e,n));resolvePairComment(c,a);s.push(a);if(i&&typeof o==="number"){if(c.range.start>o+1024)e.errors.push(getLongKeyError(t,i))}i=undefined;o=null}break;default:if(i!==undefined)s.push(new Pair(i));i=resolveNode(e,c);o=c.range.start;if(c.error)e.errors.push(c.error);e:for(let n=a+1;;++n){const s=t.items[n];switch(s&&s.type){case r.Type.BLANK_LINE:case r.Type.COMMENT:continue e;case r.Type.MAP_VALUE:break e;default:{const t="Implicit map keys need to be followed by map values";e.errors.push(new r.YAMLSemanticError(c,t));break e}}}if(c.valueRangeContainsNewline){const t="Implicit map keys need to be on a single line";e.errors.push(new r.YAMLSemanticError(c,t))}}}if(i!==undefined)s.push(new Pair(i));return{comments:n,items:s}}function resolveFlowMapItems(e,t){const n=[];const s=[];let i=undefined;let o=false;let a="{";for(let c=0;c<t.items.length;++c){const l=t.items[c];if(typeof l.char==="string"){const{char:n,offset:f}=l;if(n==="?"&&i===undefined&&!o){o=true;a=":";continue}if(n===":"){if(i===undefined)i=null;if(a===":"){a=",";continue}}else{if(o){if(i===undefined&&n!==",")i=null;o=false}if(i!==undefined){s.push(new Pair(i));i=undefined;if(n===","){a=":";continue}}}if(n==="}"){if(c===t.items.length-1)continue}else if(n===a){a=":";continue}const u=`Flow map contains an unexpected ${n}`;const h=new r.YAMLSyntaxError(t,u);h.offset=f;e.errors.push(h)}else if(l.type===r.Type.BLANK_LINE){n.push({afterKey:!!i,before:s.length})}else if(l.type===r.Type.COMMENT){checkFlowCommentSpace(e.errors,l);n.push({afterKey:!!i,before:s.length,comment:l.comment})}else if(i===undefined){if(a===",")e.errors.push(new r.YAMLSemanticError(l,"Separator , missing in flow map"));i=resolveNode(e,l)}else{if(a!==",")e.errors.push(new r.YAMLSemanticError(l,"Indicator : missing in flow map entry"));s.push(new Pair(i,resolveNode(e,l)));i=undefined;o=false}}checkFlowCollectionEnd(e.errors,t);if(i!==undefined)s.push(new Pair(i));return{comments:n,items:s}}function resolveSeq(e,t){if(t.type!==r.Type.SEQ&&t.type!==r.Type.FLOW_SEQ){const n=`A ${t.type} node cannot be resolved as a sequence`;e.errors.push(new r.YAMLSyntaxError(t,n));return null}const{comments:n,items:s}=t.type===r.Type.FLOW_SEQ?resolveFlowSeqItems(e,t):resolveBlockSeqItems(e,t);const i=new YAMLSeq;i.items=s;resolveComments(i,n);if(!e.options.mapAsMap&&s.some((e=>e instanceof Pair&&e.key instanceof Collection))){const n="Keys with collection values will be stringified as YAML due to JS Object restrictions. Use mapAsMap: true to avoid this.";e.warnings.push(new r.YAMLWarning(t,n))}t.resolved=i;return i}function resolveBlockSeqItems(e,t){const n=[];const s=[];for(let i=0;i<t.items.length;++i){const o=t.items[i];switch(o.type){case r.Type.BLANK_LINE:n.push({before:s.length});break;case r.Type.COMMENT:n.push({comment:o.comment,before:s.length});break;case r.Type.SEQ_ITEM:if(o.error)e.errors.push(o.error);s.push(resolveNode(e,o.node));if(o.hasProps){const t="Sequence items cannot have tags or anchors before the - indicator";e.errors.push(new r.YAMLSemanticError(o,t))}break;default:if(o.error)e.errors.push(o.error);e.errors.push(new r.YAMLSyntaxError(o,`Unexpected ${o.type} node in sequence`))}}return{comments:n,items:s}}function resolveFlowSeqItems(e,t){const n=[];const s=[];let i=false;let o=undefined;let a=null;let c="[";let l=null;for(let f=0;f<t.items.length;++f){const u=t.items[f];if(typeof u.char==="string"){const{char:n,offset:h}=u;if(n!==":"&&(i||o!==undefined)){if(i&&o===undefined)o=c?s.pop():null;s.push(new Pair(o));i=false;o=undefined;a=null}if(n===c){c=null}else if(!c&&n==="?"){i=true}else if(c!=="["&&n===":"&&o===undefined){if(c===","){o=s.pop();if(o instanceof Pair){const n="Chaining flow sequence pairs is invalid";const s=new r.YAMLSemanticError(t,n);s.offset=h;e.errors.push(s)}if(!i&&typeof a==="number"){const n=u.range?u.range.start:u.offset;if(n>a+1024)e.errors.push(getLongKeyError(t,o));const{src:s}=l.context;for(let t=a;t<n;++t)if(s[t]==="\n"){const t="Implicit keys of flow sequence pairs need to be on a single line";e.errors.push(new r.YAMLSemanticError(l,t));break}}}else{o=null}a=null;i=false;c=null}else if(c==="["||n!=="]"||f<t.items.length-1){const s=`Flow sequence contains an unexpected ${n}`;const i=new r.YAMLSyntaxError(t,s);i.offset=h;e.errors.push(i)}}else if(u.type===r.Type.BLANK_LINE){n.push({before:s.length})}else if(u.type===r.Type.COMMENT){checkFlowCommentSpace(e.errors,u);n.push({comment:u.comment,before:s.length})}else{if(c){const t=`Expected a ${c} in flow sequence`;e.errors.push(new r.YAMLSemanticError(u,t))}const t=resolveNode(e,u);if(o===undefined){s.push(t);l=u}else{s.push(new Pair(o,t));o=undefined}a=u.range.start;c=","}}checkFlowCollectionEnd(e.errors,t);if(o!==undefined)s.push(new Pair(o));return{comments:n,items:s}}t.Alias=Alias;t.Collection=Collection;t.Merge=Merge;t.Node=Node;t.Pair=Pair;t.Scalar=Scalar;t.YAMLMap=YAMLMap;t.YAMLSeq=YAMLSeq;t.addComment=addComment;t.binaryOptions=i;t.boolOptions=o;t.findPair=findPair;t.intOptions=a;t.isEmptyPath=isEmptyPath;t.nullOptions=c;t.resolveMap=resolveMap;t.resolveNode=resolveNode;t.resolveSeq=resolveSeq;t.resolveString=resolveString;t.strOptions=l;t.stringifyNumber=stringifyNumber;t.stringifyString=stringifyString;t.toJSON=toJSON},130:(e,t,n)=>{"use strict";var r=n(941);var s=n(914);const i={identify:e=>e instanceof Uint8Array,default:false,tag:"tag:yaml.org,2002:binary",resolve:(e,t)=>{const n=s.resolveString(e,t);if(typeof Buffer==="function"){return Buffer.from(n,"base64")}else if(typeof atob==="function"){const e=atob(n.replace(/[\n\r]/g,""));const t=new Uint8Array(e.length);for(let n=0;n<e.length;++n)t[n]=e.charCodeAt(n);return t}else{const n="This environment does not support reading binary tags; either Buffer or atob is required";e.errors.push(new r.YAMLReferenceError(t,n));return null}},options:s.binaryOptions,stringify:({comment:e,type:t,value:n},i,o,a)=>{let c;if(typeof Buffer==="function"){c=n instanceof Buffer?n.toString("base64"):Buffer.from(n.buffer).toString("base64")}else if(typeof btoa==="function"){let e="";for(let t=0;t<n.length;++t)e+=String.fromCharCode(n[t]);c=btoa(e)}else{throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required")}if(!t)t=s.binaryOptions.defaultType;if(t===r.Type.QUOTE_DOUBLE){n=c}else{const{lineWidth:e}=s.binaryOptions;const i=Math.ceil(c.length/e);const o=new Array(i);for(let t=0,n=0;t<i;++t,n+=e){o[t]=c.substr(n,e)}n=o.join(t===r.Type.BLOCK_LITERAL?"\n":" ")}return s.stringifyString({comment:e,type:t,value:n},i,o,a)}};function parsePairs(e,t){const n=s.resolveSeq(e,t);for(let e=0;e<n.items.length;++e){let i=n.items[e];if(i instanceof s.Pair)continue;else if(i instanceof s.YAMLMap){if(i.items.length>1){const e="Each pair must have its own sequence indicator";throw new r.YAMLSemanticError(t,e)}const e=i.items[0]||new s.Pair;if(i.commentBefore)e.commentBefore=e.commentBefore?`${i.commentBefore}\n${e.commentBefore}`:i.commentBefore;if(i.comment)e.comment=e.comment?`${i.comment}\n${e.comment}`:i.comment;i=e}n.items[e]=i instanceof s.Pair?i:new s.Pair(i)}return n}function createPairs(e,t,n){const r=new s.YAMLSeq(e);r.tag="tag:yaml.org,2002:pairs";for(const s of t){let t,i;if(Array.isArray(s)){if(s.length===2){t=s[0];i=s[1]}else throw new TypeError(`Expected [key, value] tuple: ${s}`)}else if(s&&s instanceof Object){const e=Object.keys(s);if(e.length===1){t=e[0];i=s[t]}else throw new TypeError(`Expected { key: value } tuple: ${s}`)}else{t=s}const o=e.createPair(t,i,n);r.items.push(o)}return r}const o={default:false,tag:"tag:yaml.org,2002:pairs",resolve:parsePairs,createNode:createPairs};class YAMLOMap extends s.YAMLSeq{constructor(){super();r._defineProperty(this,"add",s.YAMLMap.prototype.add.bind(this));r._defineProperty(this,"delete",s.YAMLMap.prototype.delete.bind(this));r._defineProperty(this,"get",s.YAMLMap.prototype.get.bind(this));r._defineProperty(this,"has",s.YAMLMap.prototype.has.bind(this));r._defineProperty(this,"set",s.YAMLMap.prototype.set.bind(this));this.tag=YAMLOMap.tag}toJSON(e,t){const n=new Map;if(t&&t.onCreate)t.onCreate(n);for(const e of this.items){let r,i;if(e instanceof s.Pair){r=s.toJSON(e.key,"",t);i=s.toJSON(e.value,r,t)}else{r=s.toJSON(e,"",t)}if(n.has(r))throw new Error("Ordered maps must not include duplicate keys");n.set(r,i)}return n}}r._defineProperty(YAMLOMap,"tag","tag:yaml.org,2002:omap");function parseOMap(e,t){const n=parsePairs(e,t);const i=[];for(const{key:e}of n.items){if(e instanceof s.Scalar){if(i.includes(e.value)){const e="Ordered maps must not include duplicate keys";throw new r.YAMLSemanticError(t,e)}else{i.push(e.value)}}}return Object.assign(new YAMLOMap,n)}function createOMap(e,t,n){const r=createPairs(e,t,n);const s=new YAMLOMap;s.items=r.items;return s}const a={identify:e=>e instanceof Map,nodeClass:YAMLOMap,default:false,tag:"tag:yaml.org,2002:omap",resolve:parseOMap,createNode:createOMap};class YAMLSet extends s.YAMLMap{constructor(){super();this.tag=YAMLSet.tag}add(e){const t=e instanceof s.Pair?e:new s.Pair(e);const n=s.findPair(this.items,t.key);if(!n)this.items.push(t)}get(e,t){const n=s.findPair(this.items,e);return!t&&n instanceof s.Pair?n.key instanceof s.Scalar?n.key.value:n.key:n}set(e,t){if(typeof t!=="boolean")throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof t}`);const n=s.findPair(this.items,e);if(n&&!t){this.items.splice(this.items.indexOf(n),1)}else if(!n&&t){this.items.push(new s.Pair(e))}}toJSON(e,t){return super.toJSON(e,t,Set)}toString(e,t,n){if(!e)return JSON.stringify(this);if(this.hasAllNullValues())return super.toString(e,t,n);else throw new Error("Set items must all have null values")}}r._defineProperty(YAMLSet,"tag","tag:yaml.org,2002:set");function parseSet(e,t){const n=s.resolveMap(e,t);if(!n.hasAllNullValues())throw new r.YAMLSemanticError(t,"Set items must all have null values");return Object.assign(new YAMLSet,n)}function createSet(e,t,n){const r=new YAMLSet;for(const s of t)r.items.push(e.createPair(s,null,n));return r}const c={identify:e=>e instanceof Set,nodeClass:YAMLSet,default:false,tag:"tag:yaml.org,2002:set",resolve:parseSet,createNode:createSet};const parseSexagesimal=(e,t)=>{const n=t.split(":").reduce(((e,t)=>e*60+Number(t)),0);return e==="-"?-n:n};const stringifySexagesimal=({value:e})=>{if(isNaN(e)||!isFinite(e))return s.stringifyNumber(e);let t="";if(e<0){t="-";e=Math.abs(e)}const n=[e%60];if(e<60){n.unshift(0)}else{e=Math.round((e-n[0])/60);n.unshift(e%60);if(e>=60){e=Math.round((e-n[0])/60);n.unshift(e)}}return t+n.map((e=>e<10?"0"+String(e):String(e))).join(":").replace(/000000\d*$/,"")};const l={identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:int",format:"TIME",test:/^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+)$/,resolve:(e,t,n)=>parseSexagesimal(t,n.replace(/_/g,"")),stringify:stringifySexagesimal};const f={identify:e=>typeof e==="number",default:true,tag:"tag:yaml.org,2002:float",format:"TIME",test:/^([-+]?)([0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*)$/,resolve:(e,t,n)=>parseSexagesimal(t,n.replace(/_/g,"")),stringify:stringifySexagesimal};const u={identify:e=>e instanceof Date,default:true,tag:"tag:yaml.org,2002:timestamp",test:RegExp("^(?:"+"([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})"+"(?:(?:t|T|[ \\t]+)"+"([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)"+"(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?"+")?"+")$"),resolve:(e,t,n,r,s,i,o,a,c)=>{if(a)a=(a+"00").substr(1,3);let l=Date.UTC(t,n-1,r,s||0,i||0,o||0,a||0);if(c&&c!=="Z"){let e=parseSexagesimal(c[0],c.slice(1));if(Math.abs(e)<30)e*=60;l-=6e4*e}return new Date(l)},stringify:({value:e})=>e.toISOString().replace(/((T00:00)?:00)?\.000Z$/,"")};function shouldWarn(e){const t=typeof process!=="undefined"&&process.env||{};if(e){if(typeof YAML_SILENCE_DEPRECATION_WARNINGS!=="undefined")return!YAML_SILENCE_DEPRECATION_WARNINGS;return!t.YAML_SILENCE_DEPRECATION_WARNINGS}if(typeof YAML_SILENCE_WARNINGS!=="undefined")return!YAML_SILENCE_WARNINGS;return!t.YAML_SILENCE_WARNINGS}function warn(e,t){if(shouldWarn(false)){const n=typeof process!=="undefined"&&process.emitWarning;if(n)n(e,t);else{console.warn(t?`${t}: ${e}`:e)}}}function warnFileDeprecation(e){if(shouldWarn(true)){const t=e.replace(/.*yaml[/\\]/i,"").replace(/\.js$/,"").replace(/\\/g,"/");warn(`The endpoint 'yaml/${t}' will be removed in a future release.`,"DeprecationWarning")}}const h={};function warnOptionDeprecation(e,t){if(!h[e]&&shouldWarn(true)){h[e]=true;let n=`The option '${e}' will be removed in a future release`;n+=t?`, use '${t}' instead.`:".";warn(n,"DeprecationWarning")}}t.binary=i;t.floatTime=f;t.intTime=l;t.omap=a;t.pairs=o;t.set=c;t.timestamp=u;t.warn=warn;t.warnFileDeprecation=warnFileDeprecation;t.warnOptionDeprecation=warnOptionDeprecation},603:(e,t,n)=>{e.exports=n(83).YAML}};var t={};function __nccwpck_require2_(n){var r=t[n];if(r!==undefined){return r.exports}var s=t[n]={exports:{}};var i=true;try{e[n].call(s.exports,s,s.exports,__nccwpck_require2_);i=false}finally{if(i)delete t[n]}return s.exports}if(typeof __nccwpck_require2_!=="undefined")__nccwpck_require2_.ab=__dirname+"/";var n=__nccwpck_require2_(144);module.exports=n})();
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 294:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = __nccwpck_require__(219);


/***/ }),

/***/ 219:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";


var net = __nccwpck_require__(808);
var tls = __nccwpck_require__(404);
var http = __nccwpck_require__(685);
var https = __nccwpck_require__(687);
var events = __nccwpck_require__(361);
var assert = __nccwpck_require__(491);
var util = __nccwpck_require__(837);


exports.httpOverHttp = httpOverHttp;
exports.httpsOverHttp = httpsOverHttp;
exports.httpOverHttps = httpOverHttps;
exports.httpsOverHttps = httpsOverHttps;


function httpOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  return agent;
}

function httpsOverHttp(options) {
  var agent = new TunnelingAgent(options);
  agent.request = http.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}

function httpOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  return agent;
}

function httpsOverHttps(options) {
  var agent = new TunnelingAgent(options);
  agent.request = https.request;
  agent.createSocket = createSecureSocket;
  agent.defaultPort = 443;
  return agent;
}


function TunnelingAgent(options) {
  var self = this;
  self.options = options || {};
  self.proxyOptions = self.options.proxy || {};
  self.maxSockets = self.options.maxSockets || http.Agent.defaultMaxSockets;
  self.requests = [];
  self.sockets = [];

  self.on('free', function onFree(socket, host, port, localAddress) {
    var options = toOptions(host, port, localAddress);
    for (var i = 0, len = self.requests.length; i < len; ++i) {
      var pending = self.requests[i];
      if (pending.host === options.host && pending.port === options.port) {
        // Detect the request to connect same origin server,
        // reuse the connection.
        self.requests.splice(i, 1);
        pending.request.onSocket(socket);
        return;
      }
    }
    socket.destroy();
    self.removeSocket(socket);
  });
}
util.inherits(TunnelingAgent, events.EventEmitter);

TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
  var self = this;
  var options = mergeOptions({request: req}, self.options, toOptions(host, port, localAddress));

  if (self.sockets.length >= this.maxSockets) {
    // We are over limit so we'll add it to the queue.
    self.requests.push(options);
    return;
  }

  // If we are under maxSockets create a new one.
  self.createSocket(options, function(socket) {
    socket.on('free', onFree);
    socket.on('close', onCloseOrRemove);
    socket.on('agentRemove', onCloseOrRemove);
    req.onSocket(socket);

    function onFree() {
      self.emit('free', socket, options);
    }

    function onCloseOrRemove(err) {
      self.removeSocket(socket);
      socket.removeListener('free', onFree);
      socket.removeListener('close', onCloseOrRemove);
      socket.removeListener('agentRemove', onCloseOrRemove);
    }
  });
};

TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
  var self = this;
  var placeholder = {};
  self.sockets.push(placeholder);

  var connectOptions = mergeOptions({}, self.proxyOptions, {
    method: 'CONNECT',
    path: options.host + ':' + options.port,
    agent: false,
    headers: {
      host: options.host + ':' + options.port
    }
  });
  if (options.localAddress) {
    connectOptions.localAddress = options.localAddress;
  }
  if (connectOptions.proxyAuth) {
    connectOptions.headers = connectOptions.headers || {};
    connectOptions.headers['Proxy-Authorization'] = 'Basic ' +
        new Buffer(connectOptions.proxyAuth).toString('base64');
  }

  debug('making CONNECT request');
  var connectReq = self.request(connectOptions);
  connectReq.useChunkedEncodingByDefault = false; // for v0.6
  connectReq.once('response', onResponse); // for v0.6
  connectReq.once('upgrade', onUpgrade);   // for v0.6
  connectReq.once('connect', onConnect);   // for v0.7 or later
  connectReq.once('error', onError);
  connectReq.end();

  function onResponse(res) {
    // Very hacky. This is necessary to avoid http-parser leaks.
    res.upgrade = true;
  }

  function onUpgrade(res, socket, head) {
    // Hacky.
    process.nextTick(function() {
      onConnect(res, socket, head);
    });
  }

  function onConnect(res, socket, head) {
    connectReq.removeAllListeners();
    socket.removeAllListeners();

    if (res.statusCode !== 200) {
      debug('tunneling socket could not be established, statusCode=%d',
        res.statusCode);
      socket.destroy();
      var error = new Error('tunneling socket could not be established, ' +
        'statusCode=' + res.statusCode);
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    if (head.length > 0) {
      debug('got illegal response body from proxy');
      socket.destroy();
      var error = new Error('got illegal response body from proxy');
      error.code = 'ECONNRESET';
      options.request.emit('error', error);
      self.removeSocket(placeholder);
      return;
    }
    debug('tunneling connection has established');
    self.sockets[self.sockets.indexOf(placeholder)] = socket;
    return cb(socket);
  }

  function onError(cause) {
    connectReq.removeAllListeners();

    debug('tunneling socket could not be established, cause=%s\n',
          cause.message, cause.stack);
    var error = new Error('tunneling socket could not be established, ' +
                          'cause=' + cause.message);
    error.code = 'ECONNRESET';
    options.request.emit('error', error);
    self.removeSocket(placeholder);
  }
};

TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
  var pos = this.sockets.indexOf(socket)
  if (pos === -1) {
    return;
  }
  this.sockets.splice(pos, 1);

  var pending = this.requests.shift();
  if (pending) {
    // If we have pending requests and a socket gets closed a new one
    // needs to be created to take over in the pool for the one that closed.
    this.createSocket(pending, function(socket) {
      pending.request.onSocket(socket);
    });
  }
};

function createSecureSocket(options, cb) {
  var self = this;
  TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
    var hostHeader = options.request.getHeader('host');
    var tlsOptions = mergeOptions({}, self.options, {
      socket: socket,
      servername: hostHeader ? hostHeader.replace(/:.*$/, '') : options.host
    });

    // 0 is dummy port for v0.6
    var secureSocket = tls.connect(0, tlsOptions);
    self.sockets[self.sockets.indexOf(socket)] = secureSocket;
    cb(secureSocket);
  });
}


function toOptions(host, port, localAddress) {
  if (typeof host === 'string') { // since v0.10
    return {
      host: host,
      port: port,
      localAddress: localAddress
    };
  }
  return host; // for v0.11 or later
}

function mergeOptions(target) {
  for (var i = 1, len = arguments.length; i < len; ++i) {
    var overrides = arguments[i];
    if (typeof overrides === 'object') {
      var keys = Object.keys(overrides);
      for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
        var k = keys[j];
        if (overrides[k] !== undefined) {
          target[k] = overrides[k];
        }
      }
    }
  }
  return target;
}


var debug;
if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) {
  debug = function() {
    var args = Array.prototype.slice.call(arguments);
    if (typeof args[0] === 'string') {
      args[0] = 'TUNNEL: ' + args[0];
    } else {
      args.unshift('TUNNEL:');
    }
    console.error.apply(console, args);
  }
} else {
  debug = function() {};
}
exports.debug = debug; // for test


/***/ }),

/***/ 48:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseClient = void 0;
const https_1 = __importDefault(__nccwpck_require__(687));
const url_1 = __nccwpck_require__(310);
// Do not listen to the linter - this can NOT be rewritten as an ES6 import statement.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: appVersion } = __nccwpck_require__(598);
class BaseClient {
    /**
     * request is a high-level helper that returns a promise from the executed
     * request.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    static request(opts, data) {
        if (!opts.headers) {
            opts.headers = {};
        }
        if (!opts.headers['User-Agent']) {
            opts.headers['User-Agent'] = `google-github-actions:auth/${appVersion}`;
        }
        return new Promise((resolve, reject) => {
            const req = https_1.default.request(opts, (res) => {
                res.setEncoding('utf8');
                let body = '';
                res.on('data', (data) => {
                    body += data;
                });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(body);
                    }
                    else {
                        resolve(body);
                    }
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            if (data != null) {
                req.write(data);
            }
            req.end();
        });
    }
    /**
     * googleIDToken generates a Google Cloud ID token for the provided
     * service account email or unique id.
     */
    static googleIDToken(token, { serviceAccount, audience, delegates, includeEmail }) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
            const tokenURL = new url_1.URL(`https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateIdToken`);
            const data = {
                delegates: delegates,
                audience: audience,
                includeEmail: includeEmail,
            };
            const opts = {
                hostname: tokenURL.hostname,
                port: tokenURL.port,
                path: tokenURL.pathname + tokenURL.search,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            };
            try {
                const resp = yield BaseClient.request(opts, JSON.stringify(data));
                const parsed = JSON.parse(resp);
                return {
                    token: parsed['token'],
                };
            }
            catch (err) {
                throw new Error(`failed to generate Google Cloud ID token for ${serviceAccount}: ${err}`);
            }
        });
    }
    /**
     * googleAccessToken generates a Google Cloud access token for the provided
     * service account email or unique id.
     */
    static googleAccessToken(token, { serviceAccount, delegates, scopes, lifetime }) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceAccountID = `projects/-/serviceAccounts/${serviceAccount}`;
            const tokenURL = new url_1.URL(`https://iamcredentials.googleapis.com/v1/${serviceAccountID}:generateAccessToken`);
            const data = {};
            if (delegates && delegates.length > 0) {
                data.delegates = delegates;
            }
            if (scopes && scopes.length > 0) {
                // Not a typo, the API expects the field to be "scope" (singular).
                data.scope = scopes;
            }
            if (lifetime && lifetime > 0) {
                data.lifetime = `${lifetime}s`;
            }
            const opts = {
                hostname: tokenURL.hostname,
                port: tokenURL.port,
                path: tokenURL.pathname + tokenURL.search,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            };
            try {
                const resp = yield BaseClient.request(opts, JSON.stringify(data));
                const parsed = JSON.parse(resp);
                return {
                    accessToken: parsed['accessToken'],
                    expiration: parsed['expireTime'],
                };
            }
            catch (err) {
                throw new Error(`Failed to generate Google Cloud access token for ${serviceAccount}: ${err}`);
            }
        });
    }
    /**
     * googleOAuthToken generates a Google Cloud OAuth token using the legacy
     * OAuth endpoints.
     *
     * @param assertion A signed JWT.
     */
    static googleOAuthToken(assertion) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenURL = new url_1.URL('https://oauth2.googleapis.com/token');
            const opts = {
                hostname: tokenURL.hostname,
                port: tokenURL.port,
                path: tokenURL.pathname + tokenURL.search,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };
            const data = new url_1.URLSearchParams();
            data.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
            data.append('assertion', assertion);
            try {
                const resp = yield BaseClient.request(opts, data.toString());
                const parsed = JSON.parse(resp);
                // Normalize the expiration to be a timestamp like the iamcredentials API.
                // This API returns the number of seconds until expiration, so convert
                // that into a date.
                const expiration = new Date(new Date().getTime() + parsed['expires_in'] * 10000);
                return {
                    accessToken: parsed['access_token'],
                    expiration: expiration.toISOString(),
                };
            }
            catch (err) {
                throw new Error(`Failed to generate Google Cloud OAuth token: ${err}`);
            }
        });
    }
}
exports.BaseClient = BaseClient;


/***/ }),

/***/ 326:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CredentialsJSONClient_projectID, _CredentialsJSONClient_credentials;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CredentialsJSONClient = void 0;
const crypto_1 = __nccwpck_require__(113);
const actions_utils_1 = __nccwpck_require__(308);
/**
 * CredentialsJSONClient is a client that accepts a service account key JSON
 * credential.
 */
class CredentialsJSONClient {
    constructor(opts) {
        _CredentialsJSONClient_projectID.set(this, void 0);
        _CredentialsJSONClient_credentials.set(this, void 0);
        const credentials = (0, actions_utils_1.parseCredential)(opts.credentialsJSON);
        if (!(0, actions_utils_1.isServiceAccountKey)(credentials)) {
            throw new Error(`Provided credential is not a valid service account key JSON`);
        }
        __classPrivateFieldSet(this, _CredentialsJSONClient_credentials, credentials, "f");
        __classPrivateFieldSet(this, _CredentialsJSONClient_projectID, opts.projectID || __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").project_id, "f");
    }
    /**
     * getAuthToken generates a token capable of calling the iamcredentials API.
     */
    getAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const header = {
                alg: 'RS256',
                typ: 'JWT',
                kid: __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").private_key_id,
            };
            const now = Math.floor(new Date().getTime() / 1000);
            const body = {
                iss: __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").client_email,
                sub: __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").client_email,
                aud: 'https://iamcredentials.googleapis.com/',
                iat: now,
                exp: now + 3599,
            };
            const message = (0, actions_utils_1.toBase64)(JSON.stringify(header)) + '.' + (0, actions_utils_1.toBase64)(JSON.stringify(body));
            try {
                const signer = (0, crypto_1.createSign)('RSA-SHA256');
                signer.write(message);
                signer.end();
                const signature = signer.sign(__classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").private_key);
                return message + '.' + (0, actions_utils_1.toBase64)(signature);
            }
            catch (err) {
                throw new Error(`Failed to sign auth token using ${yield this.getServiceAccount()}: ${err}`);
            }
        });
    }
    /**
     * signJWT signs the given JWT with the private key.
     *
     * @param unsignedJWT The JWT to sign.
     */
    signJWT(unsignedJWT) {
        return __awaiter(this, void 0, void 0, function* () {
            const header = {
                alg: 'RS256',
                typ: 'JWT',
                kid: __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").private_key_id,
            };
            const message = (0, actions_utils_1.toBase64)(JSON.stringify(header)) + '.' + (0, actions_utils_1.toBase64)(unsignedJWT);
            try {
                const signer = (0, crypto_1.createSign)('RSA-SHA256');
                signer.write(message);
                signer.end();
                const signature = signer.sign(__classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").private_key);
                const jwt = message + '.' + (0, actions_utils_1.toBase64)(signature);
                return jwt;
            }
            catch (err) {
                throw new Error(`Failed to sign JWT using ${yield this.getServiceAccount()}: ${err}`);
            }
        });
    }
    /**
     * getProjectID returns the project ID. If an override was given, the override
     * is returned. Otherwise, this will be the project ID that was extracted from
     * the service account key JSON.
     */
    getProjectID() {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _CredentialsJSONClient_projectID, "f");
        });
    }
    /**
     * getServiceAccount returns the service account email for the authentication,
     * extracted from the Service Account Key JSON.
     */
    getServiceAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f").client_email;
        });
    }
    /**
     * createCredentialsFile creates a Google Cloud credentials file that can be
     * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
     */
    createCredentialsFile(outputDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const outputFile = (0, actions_utils_1.randomFilepath)(outputDir);
            return yield (0, actions_utils_1.writeSecureFile)(outputFile, JSON.stringify(__classPrivateFieldGet(this, _CredentialsJSONClient_credentials, "f")));
        });
    }
}
exports.CredentialsJSONClient = CredentialsJSONClient;
_CredentialsJSONClient_projectID = new WeakMap(), _CredentialsJSONClient_credentials = new WeakMap();


/***/ }),

/***/ 790:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _WorkloadIdentityClient_projectID, _WorkloadIdentityClient_providerID, _WorkloadIdentityClient_serviceAccount, _WorkloadIdentityClient_token, _WorkloadIdentityClient_audience, _WorkloadIdentityClient_oidcTokenRequestURL, _WorkloadIdentityClient_oidcTokenRequestToken;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkloadIdentityClient = void 0;
const url_1 = __nccwpck_require__(310);
const actions_utils_1 = __nccwpck_require__(308);
const base_1 = __nccwpck_require__(48);
/**
 * WorkloadIdentityClient is a client that uses the GitHub Actions runtime to
 * authentication via Workload Identity.
 */
class WorkloadIdentityClient {
    constructor(opts) {
        _WorkloadIdentityClient_projectID.set(this, void 0);
        _WorkloadIdentityClient_providerID.set(this, void 0);
        _WorkloadIdentityClient_serviceAccount.set(this, void 0);
        _WorkloadIdentityClient_token.set(this, void 0);
        _WorkloadIdentityClient_audience.set(this, void 0);
        _WorkloadIdentityClient_oidcTokenRequestURL.set(this, void 0);
        _WorkloadIdentityClient_oidcTokenRequestToken.set(this, void 0);
        __classPrivateFieldSet(this, _WorkloadIdentityClient_providerID, opts.providerID, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_serviceAccount, opts.serviceAccount, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_token, opts.token, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_audience, opts.audience, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_oidcTokenRequestURL, opts.oidcTokenRequestURL, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_oidcTokenRequestToken, opts.oidcTokenRequestToken, "f");
        __classPrivateFieldSet(this, _WorkloadIdentityClient_projectID, opts.projectID || this.extractProjectIDFromServiceAccountEmail(__classPrivateFieldGet(this, _WorkloadIdentityClient_serviceAccount, "f")), "f");
    }
    /**
     * extractProjectIDFromServiceAccountEmail extracts the project ID from the
     * service account email address.
     */
    extractProjectIDFromServiceAccountEmail(str) {
        if (!str) {
            return '';
        }
        const [, dn] = str.split('@', 2);
        if (!str.endsWith('.iam.gserviceaccount.com')) {
            throw new Error(`Service account email ${str} is not of the form ` +
                `"[name]@[project].iam.gserviceaccount.com. You must manually ` +
                `specify the "project_id" parameter in your GitHub Actions workflow.`);
        }
        const [project] = dn.split('.', 2);
        return project;
    }
    /**
     * getAuthToken generates a Google Cloud federated token using the provided
     * OIDC token and Workload Identity Provider.
     */
    getAuthToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const stsURL = new url_1.URL('https://sts.googleapis.com/v1/token');
            const data = {
                audience: '//iam.googleapis.com/' + __classPrivateFieldGet(this, _WorkloadIdentityClient_providerID, "f"),
                grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
                requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
                scope: 'https://www.googleapis.com/auth/cloud-platform',
                subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
                subjectToken: __classPrivateFieldGet(this, _WorkloadIdentityClient_token, "f"),
            };
            const opts = {
                hostname: stsURL.hostname,
                port: stsURL.port,
                path: stsURL.pathname + stsURL.search,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            };
            try {
                const resp = yield base_1.BaseClient.request(opts, JSON.stringify(data));
                const parsed = JSON.parse(resp);
                return parsed['access_token'];
            }
            catch (err) {
                throw new Error(`Failed to generate Google Cloud federated token for ${__classPrivateFieldGet(this, _WorkloadIdentityClient_providerID, "f")}: ${err}`);
            }
        });
    }
    /**
     * signJWT signs the given JWT using the IAM credentials endpoint.
     *
     * @param unsignedJWT The JWT to sign.
     * @param delegates List of service account email address to use for
     * impersonation in the delegation chain to sign the JWT.
     */
    signJWT(unsignedJWT, delegates) {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceAccount = yield this.getServiceAccount();
            const federatedToken = yield this.getAuthToken();
            const signJWTURL = new url_1.URL(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:signJwt`);
            const data = {
                payload: unsignedJWT,
            };
            if (delegates && delegates.length > 0) {
                data.delegates = delegates;
            }
            const opts = {
                hostname: signJWTURL.hostname,
                port: signJWTURL.port,
                path: signJWTURL.pathname + signJWTURL.search,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${federatedToken}`,
                    'Content-Type': 'application/json',
                },
            };
            try {
                const resp = yield base_1.BaseClient.request(opts, JSON.stringify(data));
                const parsed = JSON.parse(resp);
                return parsed['signedJwt'];
            }
            catch (err) {
                throw new Error(`Failed to sign JWT using ${serviceAccount}: ${err}`);
            }
        });
    }
    /**
     * getProjectID returns the project ID. If an override was given, the override
     * is returned. Otherwise, this will be the project ID that was extracted from
     * the service account key JSON.
     */
    getProjectID() {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _WorkloadIdentityClient_projectID, "f");
        });
    }
    /**
     * getServiceAccount returns the service account email for the authentication,
     * extracted from the input parameter.
     */
    getServiceAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _WorkloadIdentityClient_serviceAccount, "f");
        });
    }
    /**
     * createCredentialsFile creates a Google Cloud credentials file that can be
     * set as GOOGLE_APPLICATION_CREDENTIALS for gcloud and client libraries.
     */
    createCredentialsFile(outputDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestURL = new url_1.URL(__classPrivateFieldGet(this, _WorkloadIdentityClient_oidcTokenRequestURL, "f"));
            // Append the audience value to the request.
            const params = requestURL.searchParams;
            params.set('audience', __classPrivateFieldGet(this, _WorkloadIdentityClient_audience, "f"));
            requestURL.search = params.toString();
            const data = {
                type: 'external_account',
                audience: `//iam.googleapis.com/${__classPrivateFieldGet(this, _WorkloadIdentityClient_providerID, "f")}`,
                subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
                token_url: 'https://sts.googleapis.com/v1/token',
                service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${__classPrivateFieldGet(this, _WorkloadIdentityClient_serviceAccount, "f")}:generateAccessToken`,
                credential_source: {
                    url: requestURL,
                    headers: {
                        Authorization: `Bearer ${__classPrivateFieldGet(this, _WorkloadIdentityClient_oidcTokenRequestToken, "f")}`,
                    },
                    format: {
                        type: 'json',
                        subject_token_field_name: 'value',
                    },
                },
            };
            const outputFile = (0, actions_utils_1.randomFilepath)(outputDir);
            return yield (0, actions_utils_1.writeSecureFile)(outputFile, JSON.stringify(data));
        });
    }
}
exports.WorkloadIdentityClient = WorkloadIdentityClient;
_WorkloadIdentityClient_projectID = new WeakMap(), _WorkloadIdentityClient_providerID = new WeakMap(), _WorkloadIdentityClient_serviceAccount = new WeakMap(), _WorkloadIdentityClient_token = new WeakMap(), _WorkloadIdentityClient_audience = new WeakMap(), _WorkloadIdentityClient_oidcTokenRequestURL = new WeakMap(), _WorkloadIdentityClient_oidcTokenRequestToken = new WeakMap();


/***/ }),

/***/ 399:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __nccwpck_require__(186);
const actions_utils_1 = __nccwpck_require__(308);
const workload_identity_client_1 = __nccwpck_require__(790);
const credentials_json_client_1 = __nccwpck_require__(326);
const base_1 = __nccwpck_require__(48);
const utils_1 = __nccwpck_require__(314);
const secretsWarning = `If you are specifying input values via GitHub secrets, ensure the secret ` +
    `is being injected into the environment. By default, secrets are not ` +
    `passed to workflows triggered from forks, including Dependabot.`;
const oidcWarning = `GitHub Actions did not inject $ACTIONS_ID_TOKEN_REQUEST_TOKEN or ` +
    `$ACTIONS_ID_TOKEN_REQUEST_URL into this job. This most likely means the ` +
    `GitHub Actions workflow permissions are incorrect, or this job is being ` +
    `run from a fork. For more information, please see https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token`;
const headWarning = `google-github-actions/auth is pinned at HEAD. We strongly advise against ` +
    `pinning to "@main" as it may be unstable. Please update your GitHub ` +
    `Action YAML from:\n` +
    `\n` +
    `    uses: 'google-github-actions/auth@main'\n` +
    `\n` +
    `to:\n` +
    `\n` +
    `    uses: 'google-github-actions/auth@v0'\n` +
    `\n` +
    `Alternatively, you can pin to any git tag or git SHA in the repository.`;
/**
 * Executes the main action, documented inline.
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        // Warn if pinned to HEAD
        if (process.env.GITHUB_ACTION_REF == 'main') {
            (0, core_1.warning)(headWarning);
        }
        try {
            // Load configuration.
            const projectID = (0, core_1.getInput)('project_id');
            const workloadIdentityProvider = (0, core_1.getInput)('workload_identity_provider');
            const serviceAccount = (0, core_1.getInput)('service_account');
            const audience = (0, core_1.getInput)('audience') || `https://iam.googleapis.com/${workloadIdentityProvider}`;
            const credentialsJSON = (0, core_1.getInput)('credentials_json');
            const createCredentialsFile = (0, core_1.getBooleanInput)('create_credentials_file');
            const tokenFormat = (0, core_1.getInput)('token_format');
            const delegates = (0, actions_utils_1.parseCSV)((0, core_1.getInput)('delegates'));
            // Ensure exactly one of workload_identity_provider and credentials_json was
            // provided.
            if (!(0, actions_utils_1.exactlyOneOf)(workloadIdentityProvider, credentialsJSON)) {
                throw new Error('The GitHub Action workflow must specify exactly one of ' +
                    '"workload_identity_provider" or "credentials_json"! ' +
                    secretsWarning);
            }
            // Ensure a service_account was provided if using WIF.
            if (workloadIdentityProvider && !serviceAccount) {
                throw new Error('The GitHub Action workflow must specify a "service_account" to ' +
                    'impersonate when using "workload_identity_provider"! ' +
                    secretsWarning);
            }
            // Instantiate the correct client based on the provided input parameters.
            let client;
            if (workloadIdentityProvider) {
                (0, core_1.debug)(`Using workload identity provider "${workloadIdentityProvider}"`);
                // If we're going to do the OIDC dance, we need to make sure these values
                // are set. If they aren't, core.getIDToken() will fail and so will
                // generating the credentials file.
                const oidcTokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
                const oidcTokenRequestURL = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
                if (!oidcTokenRequestToken || !oidcTokenRequestURL) {
                    throw new Error(oidcWarning);
                }
                const token = yield (0, core_1.getIDToken)(audience);
                client = new workload_identity_client_1.WorkloadIdentityClient({
                    projectID: projectID,
                    providerID: workloadIdentityProvider,
                    serviceAccount: serviceAccount,
                    token: token,
                    audience: audience,
                    oidcTokenRequestToken: oidcTokenRequestToken,
                    oidcTokenRequestURL: oidcTokenRequestURL,
                });
            }
            else {
                (0, core_1.debug)(`Using credentials JSON`);
                client = new credentials_json_client_1.CredentialsJSONClient({
                    projectID: projectID,
                    credentialsJSON: credentialsJSON,
                });
            }
            // Always write the credentials file first, before trying to generate
            // tokens. This will ensure the file is written even if token generation
            // fails, which means continue-on-error actions will still have the file
            // available.
            if (createCredentialsFile) {
                (0, core_1.debug)(`Creating credentials file`);
                // Note: We explicitly and intentionally export to GITHUB_WORKSPACE
                // instead of RUNNER_TEMP, because RUNNER_TEMP is not shared with
                // Docker-based actions on the filesystem. Exporting to GITHUB_WORKSPACE
                // ensures that the exported credentials are automatically available to
                // Docker-based actions without user modification.
                //
                // This has the unintended side-effect of leaking credentials over time,
                // because GITHUB_WORKSPACE is not automatically cleaned up on self-hosted
                // runners. To mitigate this issue, this action defines a post step to
                // remove any created credentials.
                const githubWorkspace = process.env.GITHUB_WORKSPACE;
                if (!githubWorkspace) {
                    throw new Error('$GITHUB_WORKSPACE is not set');
                }
                // Create credentials file.
                const credentialsPath = yield client.createCredentialsFile(githubWorkspace);
                (0, core_1.info)(`Created credentials file at "${credentialsPath}"`);
                // Output to be available to future steps.
                (0, core_1.setOutput)('credentials_file_path', credentialsPath);
                // CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE is picked up by gcloud to use
                // a specific credential file (subject to change and equivalent to auth/credential_file_override)
                (0, core_1.exportVariable)('CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE', credentialsPath);
                // GOOGLE_APPLICATION_CREDENTIALS is used by Application Default Credentials
                // in all GCP client libraries
                (0, core_1.exportVariable)('GOOGLE_APPLICATION_CREDENTIALS', credentialsPath);
                // GOOGLE_GHA_CREDS_PATH is used by other Google GitHub Actions
                (0, core_1.exportVariable)('GOOGLE_GHA_CREDS_PATH', credentialsPath);
            }
            // Set the project ID environment variables to the computed values.
            const computedProjectID = yield client.getProjectID();
            (0, core_1.setOutput)('project_id', computedProjectID);
            (0, core_1.exportVariable)('CLOUDSDK_PROJECT', computedProjectID);
            (0, core_1.exportVariable)('CLOUDSDK_CORE_PROJECT', computedProjectID);
            (0, core_1.exportVariable)('GCP_PROJECT', computedProjectID);
            (0, core_1.exportVariable)('GCLOUD_PROJECT', computedProjectID);
            (0, core_1.exportVariable)('GOOGLE_CLOUD_PROJECT', computedProjectID);
            switch (tokenFormat) {
                case '': {
                    break;
                }
                case null: {
                    break;
                }
                case 'access_token': {
                    (0, core_1.debug)(`Creating access token`);
                    const accessTokenLifetime = (0, actions_utils_1.parseDuration)((0, core_1.getInput)('access_token_lifetime'));
                    const accessTokenScopes = (0, actions_utils_1.parseCSV)((0, core_1.getInput)('access_token_scopes'));
                    const accessTokenSubject = (0, core_1.getInput)('access_token_subject');
                    const serviceAccount = yield client.getServiceAccount();
                    // If a subject was provided, use the traditional OAuth 2.0 flow to
                    // perform Domain-Wide Delegation. Otherwise, use the modern IAM
                    // Credentials endpoints.
                    let accessToken, expiration;
                    if (accessTokenSubject) {
                        (0, core_1.info)(`An access token subject was specified, triggering Domain-Wide ` +
                            `Delegation flow. This flow does not support specifying an ` +
                            `access token lifetime of greater than 1 hour.`);
                        const unsignedJWT = (0, utils_1.buildDomainWideDelegationJWT)(serviceAccount, accessTokenSubject, accessTokenScopes, accessTokenLifetime);
                        const signedJWT = yield client.signJWT(unsignedJWT, delegates);
                        ({ accessToken, expiration } = yield base_1.BaseClient.googleOAuthToken(signedJWT));
                    }
                    else {
                        const authToken = yield client.getAuthToken();
                        ({ accessToken, expiration } = yield base_1.BaseClient.googleAccessToken(authToken, {
                            serviceAccount,
                            delegates,
                            scopes: accessTokenScopes,
                            lifetime: accessTokenLifetime,
                        }));
                    }
                    (0, core_1.setSecret)(accessToken);
                    (0, core_1.setOutput)('access_token', accessToken);
                    (0, core_1.setOutput)('access_token_expiration', expiration);
                    break;
                }
                case 'id_token': {
                    (0, core_1.debug)(`Creating id token`);
                    const idTokenAudience = (0, core_1.getInput)('id_token_audience', { required: true });
                    const idTokenIncludeEmail = (0, core_1.getBooleanInput)('id_token_include_email');
                    const serviceAccount = yield client.getServiceAccount();
                    const authToken = yield client.getAuthToken();
                    const { token } = yield base_1.BaseClient.googleIDToken(authToken, {
                        serviceAccount,
                        audience: idTokenAudience,
                        delegates,
                        includeEmail: idTokenIncludeEmail,
                    });
                    (0, core_1.setSecret)(token);
                    (0, core_1.setOutput)('id_token', token);
                    break;
                }
                default: {
                    throw new Error(`Unknown token format "${tokenFormat}"`);
                }
            }
        }
        catch (err) {
            const msg = (0, actions_utils_1.errorMessage)(err);
            (0, core_1.setFailed)(`google-github-actions/auth failed with: ${msg}`);
        }
    });
}
run();


/***/ }),

/***/ 314:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildDomainWideDelegationJWT = void 0;
/**
 * buildDomainWideDelegationJWT constructs an _unsigned_ JWT to be used for a
 * DWD exchange. The JWT must be signed and then exchanged with the OAuth
 * endpoints for a token.
 *
 * @param serviceAccount Email address of the service account.
 * @param subject Email address to use for impersonation.
 * @param scopes List of scopes to authorize.
 * @param lifetime Number of seconds for which the JWT should be valid.
 */
function buildDomainWideDelegationJWT(serviceAccount, subject, scopes, lifetime) {
    const now = Math.floor(new Date().getTime() / 1000);
    const body = {
        iss: serviceAccount,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + lifetime,
    };
    if (subject && subject.trim().length > 0) {
        body.sub = subject;
    }
    if (scopes && scopes.length > 0) {
        // Yes, this is a space delimited list.
        // Not a typo, the API expects the field to be "scope" (singular).
        body.scope = scopes.join(' ');
    }
    return JSON.stringify(body);
}
exports.buildDomainWideDelegationJWT = buildDomainWideDelegationJWT;


/***/ }),

/***/ 491:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 361:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 685:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 687:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 808:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 404:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 598:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"@google-github-actions/auth","version":"0.4.4","description":"Authenticate to Google Cloud using OIDC tokens or JSON service account keys.","main":"dist/main/index.js","scripts":{"build":"ncc build src/main.ts -o dist/main && ncc build src/post.ts -o dist/post","lint":"eslint . --ext .ts,.tsx","format":"prettier --write **/*.ts","test":"mocha -r ts-node/register -t 120s \'tests/**/*.test.ts\'"},"repository":{"type":"git","url":"https://github.com/google-github-actions/auth"},"keywords":["actions","google cloud","identity","auth","oidc"],"author":"GoogleCloudPlatform","license":"Apache-2.0","dependencies":{"@actions/core":"^1.6.0","@google-github-actions/actions-utils":"^0.1.0"},"devDependencies":{"@types/chai":"^4.3.0","@types/mocha":"^9.0.0","@types/node":"^17.0.2","@typescript-eslint/eslint-plugin":"^5.8.0","@typescript-eslint/parser":"^5.8.0","@vercel/ncc":"^0.33.1","chai":"^4.3.4","eslint":"^8.5.0","eslint-config-prettier":"^8.3.0","eslint-plugin-prettier":"^4.0.0","mocha":"^9.1.3","prettier":"^2.5.1","ts-node":"^10.4.0","typescript":"^4.5.4"}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(399);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;