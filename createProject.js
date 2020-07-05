#!/usr/bin/env node

const fs = require('fs');
const commander = require('commander');
const packageJson = require('./package.json');
const projectSettings = require('./project.json');
const path = require('path');
const ncp = require('ncp');
const { spawn } = require('child_process');

const program = new commander.Command(packageJson.name);

const steps = [
    {
        step: 'Make project skeleton',
        run: async (name) => {
            fs.mkdirSync(name);
            await createSkeleton(name);
            createPackageJson(name);
        },
    },
    {
        step: 'Install dependencies',
        run: async (name) => {
            await install(name);
        }
    }
];

function createSkeleton(projectName) {
    return new Promise((resolve, reject) => {
        fs.readdir(__dirname, (error, files) => {
            if (error) {
                reject(error);
            }

            for (let file of files) {
                if (!projectSettings.ignore_copy.includes(file) && file !== projectName) {
                    ncp(path.join(__dirname, file), path.join('./', projectName, file));
                }
            }

            resolve();
        });
    });
}

function createPackageJson(projectName) {
    let projectPackageJson = packageJson;

    projectPackageJson.name = projectName;
    projectPackageJson.version = '0.0.1';
    projectPackageJson.dependencies = projectSettings.dependencies;
    projectPackageJson.main = projectSettings.main;

    fs.writeFileSync(path.join(projectName, 'package.json'), JSON.stringify(projectPackageJson, null, 2));
}

function install(projectName) {
    return new Promise((resolve, reject) => {
        let child = spawn('npm', ['install'], { cwd: path.join('.', projectName) });

        child.on('error', (error) => {
            reject(error);
        });

        child.on('close', (code) => {
           resolve(code);
        });
    });
}

async function creaateProject(name) {
    if (fs.existsSync(name)) {
        console.log('project ' + name + ' already exists!');
        return;
    }

    try {
        let step_num = 1;

        for (let step of steps) {
            console.log(`Step (${step_num}/${steps.length}): ${step.step}`);
            await step.run(name);
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