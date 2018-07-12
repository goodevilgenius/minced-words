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
const partialDir = path.join(root, 'partials');
const postsDir = path.join(root, 'posts');
const buildDir = path.join(root, 'build');

let templates = {};
let site = {};
let posts = [];
let formats = [];
let feeds = {};

hbs.registerHelper('call', function (object, method, ...params) {
    return object[method](...params);
});

// Read config
yaml.readAsync(path.join(root, 'config.yml'))
    .then(function (siteConfig) {
        site = siteConfig;

        // set some defaults for site
        if ('keywords' in site) site.keywordsList = site.keywords.join(',');
        if ('image' in site) {
            if (site.image.indexOf('http') < 0) {
                site.image = `${site.url}/${site.root}/${site.image}`;
            }
        }

        if (!('frequency' in site)) site.frequency = 'Monthly';
        if (!('rating' in site)) site.rating = 'TV-PG';

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

        // read partials
        return fs.readdirAsync(partialDir);
    }).then(function (files) {
        files = files.filter(file => file.substr(-4) === '.hbs');
        return Promise.map(files, function (file) {
            return fs.readFileAsync(path.join(partialDir, file), 'utf8')
                .then(function (data) {
                    const name = file.substr(0, file.length - 4);
                    hbs.registerPartial(name, data);
                    return Promise.resolve();
                });
        });
    }).then(() => fs.readdirAsync(postsDir))
    .then(function (files) {
        // Parse posts
        return Promise.map(files, file => yaml.readAsync(path.join(
            postsDir,
            file
        )));
    })
    .then(function (parsedPosts) {
        posts = parsedPosts;
        posts = posts.map(function (post) {
            post.date = new Date(post.date);
            if (!post.enclosures) post.enclosures = [];
            post.duration = post.enclosures.reduce(function (carry, enc) {
                if (enc.duration) {
                    return enc.duration;
                }

                return carry;
            }, 0);

            return post;
        });
        posts.sort(function (a, b) {
            return b.date - a.date;
        });

        formats = posts.reduce(function (carry, post) {
            return carry.concat(post.enclosures);
        }, []).map(enc => enc.name.replace(/^.+\./, '').toLowerCase())
        .filter((ext, idx, ar) => ar.indexOf(ext) === idx);

        return Promise.resolve(true);
    })
    .then(function () {
        // Write main feed
        feeds['Main Feed'] = 'feed.xml';

        return fs.writeFileAsync(
            path.join(buildDir, 'feed.xml'),
            templates.feed({
                site: site,
                posts: posts,
                lastPost: posts[0],
                now: new Date()
            })
        );
    })
    .then(function () {
        // Write format feeds
        return Promise.map(formats, function (format) {
            let name = `${format.toUpperCase()} Feed`;

            let newSite = JSON.parse(JSON.stringify(site));
            newSite.title = `${newSite.title} - ${name}`;

            let file = `feed.${format}.xml`;
            feeds[name] =  file;

            let thesePosts = posts.map(function (post) {
                // Clone it
                let newPost = JSON.parse(JSON.stringify(post));
                newPost.date = new Date(newPost.date);

                if (!('enclosures' in newPost)) newPost.enclosures = [];
                newPost.enclosures = newPost.enclosures.filter(enc => enc.name.endsWith(format));

                return newPost;
            }).filter(post => post.enclosures.length > 0);

            return fs.writeFileAsync(
                path.join(buildDir, file),
                templates.feed({
                    site: newSite,
                    posts: thesePosts,
                    lastPost: thesePosts[0],
                    now: new Date()
                })
            );
        });
    })
    .then(function () {
        // Write index
        return fs.writeFileAsync(
            path.join(buildDir, 'index.html'),
            templates.main({
                site: site,
                feeds: feeds,
                content: '<h1>Hi</h1>\n<pre>' + JSON.stringify(posts) + '</pre>\n<pre>' + JSON.stringify(feeds) + '</pre>'
            })
        );
    })
    .catch(function (err) {
        console.error('Failed to build site');
        console.error(err.message);
        console.error(err.stack);
        process.exit(1);
    });
