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
        .usage('[options] <tree>')
        .option('-p, --pretty', 'Pretty printing')
        .version(buildVersion, '-v, --version')
        .description('Manifest.json generator. <tree> is a colon-separated json structure ending with the file you want to reference.')
        .parse(process.argv);

    // Check if we have input
    if (!commander.args[0]) {
        console.error('No input specified.');
        return 1;
    }

    let jsonTree = commander.args[0].split(':'),
        targetFile = jsonTree.pop(),
        targetFilePath = path.join(cwd, targetFile),
        manifest = {};

    // Check if file that needs to be added to the manifest exits
    if (!fs.existsSync(targetFilePath)) {
        console.error('The input file "' + targetFilePath + '" does not exist.');
        return 1;
    }

    // Read the manifest if any
    if (fs.existsSync(manifestPath)) {
        manifest = fs.readFileSync(manifestPath);
        manifest = JSON.parse(manifest);
    }

    let len = jsonTree.length,
        last = jsonTree[len - 1],
        bustSuffix = (new Date()).getTime(),
        bustingName = targetFile.replace(/(\.[^ .]+)?$/, `.${bustSuffix}$1`),
        old = resolve(jsonTree, manifest);


    try {
        if (old && fs.existsSync(old)) fs.unlinkSync(old);
        fs.renameSync(targetFile, bustingName)
    } catch (e) {
    }


    if (!len) {
        manifest[last] = bustingName;
    } else {
        jsonTree.reduce((o, i) => {
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
