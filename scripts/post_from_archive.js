#!/usr/bin/env node

'use strict';

// The url to the _files.xml needs to be passed to this script

var Promise = require('bluebird');
const rp = require('request-promise');
const parseString = Promise.promisify(require('xml2js').parseString);
const path = require('path');
const yaml = Promise.promisifyAll(require('node-yaml'));

const url = process.argv[2];
const source = path.basename(url);
const dir = path.dirname(url);

let files = [];
let meta = {};

function mapXml (item) {
    for (let k in item) {
        if (k === '$') continue;
        if (Array.isArray(item[k]) && item[k].length === 1) item[k] = item[k][0];
    }
    for (let k in item['$']) item[k] = item['$'][k];
    delete item['$'];

    return item;
}

rp(url)
    .then(function (data) {
        return parseString(data);
    })
    .then(function (filesObject) {
        files = filesObject.files.file.map(mapXml);
        
        let meta = files.filter(file => 
            file.name !== source && 
            file.source === 'original' &&
            file.format === 'Metadata' &&
            file.name.endsWith('.xml')
        ).shift();

        console.log(files);
        
        console.log(meta);
        
        return rp(`${dir}/${meta.name}`);
    }).then(function (metaString) {
        return parseString(metaString);
    }).then(function (metaObject) {
        meta = mapXml(metaObject.metadata);
        console.log(meta);

        let dateStr = meta.publicdate || meta.addeddate;
        if (!dateStr.endsWith('Z')) dateStr = `${dateStr}Z`;

        let date = new Date(dateStr);

        const title = meta.title.trim();
        let slug = title
            .replace(/ +/g, '-')
            .replace(/[^A-Za-z0-9-]/g, '')
            .replace(/-+$/, '').replace(/^-+/, '')
            .toLowerCase();
        let filename = `${date.toISOString().replace(/T.+/, '')}-${slug}`;

        let post = {
            archive_id: meta.identifier,
            author: {
                name: meta.creator,
                email: meta.uploader
            },
            date: date.toISOString(),
            title: title,
            description: meta.description.replace(/<br *\/?>$/, ''),
            language: meta.language,
            enclosures: []
        };

        let filepath = path.join(process.cwd(), 'posts', filename);

        return yaml.writeAsync(filepath, post);
    })
    .catch(function (err) {
        console.error('Failed to build post');
        console.error(err.message);
        process.exit(1);
    });
