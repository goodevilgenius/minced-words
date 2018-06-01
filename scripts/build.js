#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
const hbs = require('handlebars');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const yaml = Promise.promisifyAll(require('node-yaml'));

let mainTemplate = function () {};
let site = {};

// Read config
yaml.readAsync(path.join(process.cwd(), 'config.yml'))
    .then(function (siteConfig) {
        site = siteConfig;

        // Read main template
        return fs.readFileAsync(path.join(process.cwd(), 'templates', 'main.hbs'), 'utf8');
    })
    .then(function (template) {
        // Compile main template
        mainTemplate = hbs.compile(template);

        return Promise.resolve(true);
    })
    .then(function () {
        // Write index
        return fs.writeFileAsync(
            path.join('build', 'index.html'),
            mainTemplate({site: site, content: '<h1>Hi</h1>'})
        );
    })
    .catch(function (err) {
        console.error('Failed to build site');
        console.error(err.message);
        process.exit(1);
    });

