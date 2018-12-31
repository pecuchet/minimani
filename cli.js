#!/usr/bin/env node

const
    fs = require('fs'),
    path = require('path'),
    commander = require('commander'),
    resolve = (path, obj) => {
        return path.reduce((prev, curr) => prev && prev[curr], obj)
    };

(() => {
    const
        cwd = process.cwd(),
        packageConfig = fs.readFileSync(path.join(__dirname, 'package.json')),
        buildVersion = JSON.parse(packageConfig).version,
        manifestPath = path.join(cwd, 'manifest.json');

    commander
        .usage('[options] <file>')
        .option('-t, --tree <tree>', 'The path in the json tree separated by colons')
        .version(buildVersion, '-v, --version')
        .option('-p, --pretty', 'Pretty print manifest file')
        .parse(process.argv);


    let file = commander.args[0],
        manifest = {};

    // Check if we have the file that needs to be added to the manifest
    if (!file || !fs.existsSync(file)) {
        console.error('No input file!');
        return 1;
    }

    // Read the manifest if any
    if (fs.existsSync(manifestPath)) {
        manifest = fs.readFileSync(manifestPath);
        manifest = JSON.parse(manifest);
    }

    let jsonPath = commander.tree.split(':'),
        len = jsonPath.length,
        last = jsonPath[len - 1],
        bust = (new Date()).getTime(),
        bustingName = file.replace(/(\.[^ .]+)?$/, `.${bust}$1`),
        old = resolve(jsonPath, manifest);


    try {
        if (old && fs.existsSync(old)) fs.unlinkSync(old);
        fs.renameSync(file, bustingName)
    } catch (e) {
    }


    if (!len) {
        manifest[last] = bustingName;
    } else {
        jsonPath.reduce((o, i) => {
            if (i !== last) {
                if (o[i]) return o[i];
                return o[i] = {};
            }
            return o[last] = bustingName;
        }, manifest);
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, (commander.pretty ? 2 : null)));

    return 0;
})();
