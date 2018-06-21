#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');
const hbs = require('handlebars');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const yaml = Promise.promisifyAll(require('node-yaml'));

// directories
const root = process.cwd();
const templateDir = path.join(root, 'templates');
const postsDir = path.join(root, 'posts');
const buildDir = path.join(root, 'build');

let templates = {};
let site = {};
let posts = [];

hbs.registerHelper('call', function (object, method, ...params) {
    return object[method](...params);
});

// Read config
yaml.readAsync(path.join(root, 'config.yml'))
    .then(function (siteConfig) {
        site = siteConfig;

        // read all templates
        return fs.readdirAsync(templateDir);
    })
    .then(function (files) {
        files = files.filter(file => file.substr(-4) === '.hbs');
        return Promise.map(files, function (file) {
            return fs.readFileAsync(path.join(templateDir, file), 'utf8')
                .then(data => Promise.resolve({
                    file: file.substr(0, file.length - 4),
                    data: data
                }));
        });
    })
    .then(function (templatesData) {
        // Compile main template
        templatesData.forEach(temp => templates[temp.file] = hbs.compile(temp.data));

        // Read posts
        return fs.readdirAsync(postsDir);
    })
    .then(function (files) {
        // Parse posts
        return Promise.map(files, file => yaml.readAsync(path.join(
            postsDir,
            file
        )));
    })
    .then(function (parsedPosts) {
        posts = parsedPosts;
        posts.sort(function (a, b) {
            return (new Date(b.date)) - (new Date(a.date));
        });

        return Promise.resolve(true);
    })
    .then(function () {
        // Write index
        return fs.writeFileAsync(
            path.join(buildDir, 'index.html'),
            templates.main({
                site: site,
                content: '<h1>Hi</h1>\n<pre>' + JSON.stringify(posts) + '</pre>'
            })
        );
    })
    .then(function () {
        return fs.writeFileAsync(
            path.join(buildDir, 'feed.xml'),
            templates.feed({
                site: site,
                now: new Date()
            })
        );
    })
    .catch(function (err) {
        console.error('Failed to build site');
        console.error(err.message);
        process.exit(1);
    });

