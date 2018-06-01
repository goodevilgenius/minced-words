#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
const hbs = require('handlebars');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const yaml = Promise.promisifyAll(require('node-yaml'));

let mainTemplate = function () {};
let site = {};

yaml.readAsync(path.join(process.cwd(), 'config.yml'))
    .then(function (siteConfig) {
        site = siteConfig;
        return fs.readFileAsync(path.join(process.cwd(), 'templates', 'main.hbs'), 'utf8');
    })
    .then(function (template) {
        mainTemplate = hbs.compile(template);

        return Promise.resolve(mainTemplate);
    })
    .then(function (main) {
        return fs.writeFileAsync(
            path.join('build', 'index.html'),
            main({site: site, content: '<h1>Hi</h1>'})
        );
    })
    .catch(function (err) {
        console.error('Failed to build site');
        console.error(err.message);
        process.exit(1);
    });

