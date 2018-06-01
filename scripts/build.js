#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
const hbs = require('handlebars');
const fs = require('fs');
const path = require('path');
const yaml = Promise.promisifyAll(require('node-yaml'));

const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);

let mainTemplate = function () {};
let site = {};

yaml.readAsync(path.join(process.cwd(), '_config.yml'))
    .then(function (siteConfig) {
        site = siteConfig;
        return readFile(path.join(process.cwd(), 'templates', 'main.hbs'), 'utf8');
    })
    .catch(function (err) {
        console.error('Failed to read master template');
        console.error(err.message);
        process.exit(1);
    })
    .then(function (template) {
        mainTemplate = hbs.compile(template);

        return Promise.resolve(mainTemplate);
    })
    .then(function (main) {
        return writeFile(
            path.join('build', 'index.html'),
            main({site: site, content: '<h1>Hi</h1>'})
        );
    });
