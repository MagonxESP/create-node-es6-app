#!/usr/bin/env node

const fs = require('fs');
const commander = require('commander');
const packageJson = require('./package.json');
const path = require('path');
const ncp = require('ncp');
const spawn = require('cross-spawn');
const validateNpmPackageName = require('validate-npm-package-name');

const program = new commander.Command(packageJson.name);

const steps = [
    {
        step: 'Make project skeleton',
        run: async (rootPath, name) => {
            fs.mkdirSync(rootPath, { recursive: true });
            await createSkeleton(rootPath, name);
            createPackageJson(rootPath, name);
        },
    },
    {
        step: 'Install dependencies',
        run: async (rootPath, name) => {
            await runCmd(rootPath,'npm', ['install']);
        }
    }
];

function createSkeleton(root, projectName) {
    return new Promise((resolve, reject) => {
        const skeletonFiles = ['src', 'gulpfile.js', '.gitignore'];

        fs.readdir(__dirname, (error, files) => {
            if (error) {
                reject(error);
            }

            for (let file of files) {
                if (skeletonFiles.includes(file)) {
                    ncp(path.join(__dirname, file), path.join(root, file));
                }
            }

            resolve();
        });
    });
}

function createPackageJson(root, projectName) {
    let projectPackageJson = {
        name: projectName,
        description: "",
        author: "",
        license: "MIT",
        version: "0.0.1",
        main: "./dist/index.js",
        scripts: {
            test: "echo \"Error: no test specified\" && exit 1",
            build: "gulp",
            start: "node ./dist/index.js"
        },
        dependencies: {},
        devDependencies: {
            "@babel/core": "^7.10.4",
            "@babel/preset-env": "^7.10.4",
            "babel-cli": "^6.26.0",
            "gulp": "^4.0.2",
            "gulp-babel": "^8.0.0",
            "gulp-plumber": "^1.2.1",
            "gulp-sourcemaps": "^2.6.5"
        }
    };

    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(projectPackageJson, null, 2));
}

function runCmd(root, command, args) {
    return new Promise((resolve, reject) => {
        let child = spawn.sync(command, args, { cwd: root, stdio: 'inherit' });

        child.on('error', (error) => {
            reject(error);
        });

        child.on('close', (code) => {
            resolve(code);
        });
    });
}

function validateName(name) {
    const nameValidation = validateNpmPackageName(name);

    if (!nameValidation.validForNewPackages) {
        if (nameValidation.errors.length > 0) {
            console.log('Invalid name errors:');
            console.log(nameValidation.errors.join('\n'));
        }

        return false;
    }

    return true;
}

async function creaateProject(name) {
    const root = path.resolve(name);
    const appName = path.basename(root);

    if (!validateName(appName)) {
        return;
    }

    if (fs.existsSync(name)) {
        console.log('project at path ' + name + ' already exists!');
        return;
    }

    try {
        let step_num = 1;

        for (let step of steps) {
            console.log(`Step (${step_num}/${steps.length}): ${step.step}`);
            await step.run(root, appName);
            console.log('done!');
            step_num++;
        }
    } catch (exception) {
        console.log(exception.toString());
    }
}

program.version(packageJson.version)
    .arguments('<project-name>')
    .action(creaateProject)
    .parse(process.argv);