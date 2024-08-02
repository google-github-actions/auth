// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  AnnotationProperties,
  debug as logDebug,
  error as logError,
  info as logInfo,
  notice as logNotice,
  warning as logWarning,
} from '@actions/core';

/**
 * LoggerFunction is the type signature of a log function for the GitHub Actions
 * SDK.
 */
// eslint-disable-next-line no-unused-vars
type LoggerFunction = (message: string, properties?: AnnotationProperties) => void;

/**
 * Logger is a class that handles namespaced logging.
 */
export class Logger {
  readonly #namespace?: string;

  constructor(namespace?: string) {
    this.#namespace = namespace;
  }

  withNamespace(namespace: string): Logger {
    const { constructor } = Object.getPrototypeOf(this);
    if (this.#namespace) {
      return new constructor(`${this.#namespace}.${namespace}`);
    }
    return new constructor(namespace);
  }

  debug(...args: any[]) {
    this.logMessage(logDebug, ...args);
  }

  error(...args: any[]) {
    this.logMessage(logError, ...args);
  }

  info(...args: any[]) {
    this.logMessage(logInfo, ...args);
  }

  notice(...args: any[]) {
    this.logMessage(logNotice, ...args);
  }

  warning(...args: any[]) {
    this.logMessage(logWarning, ...args);
  }

  protected logMessage(loggerFn: LoggerFunction, ...args: object[]) {
    if (!args || args.length === 0) {
      return;
    }

    let message = '';
    if (this.#namespace) {
      message += this.#namespace + ': ';
    }
    for (let i = 0; i < args.length; i++) {
      const obj = args[i];

      if (typeof obj === 'undefined' || obj === undefined || obj === null) {
        continue;
      }

      if (typeof obj === 'string' || obj instanceof String) {
        message += obj;
      } else {
        message += JSON.stringify(obj, null, 2);
      }

      if (i < args.length - 1) {
        message += ', ';
      }
    }

    loggerFn(message);
  }
}

/**
 * NullLogger is a logger that doesn't actually emit any output.
 */
export class NullLogger extends Logger {
  debug(...args: any[]) {
    this.logMessage(() => {}, ...args);
  }

  error(...args: any[]) {
    this.logMessage(() => {}, ...args);
  }

  info(...args: any[]) {
    this.logMessage(() => {}, ...args);
  }

  notice(...args: any[]) {
    this.logMessage(() => {}, ...args);
  }

  warning(...args: any[]) {
    this.logMessage(() => {}, ...args);
  }
}
