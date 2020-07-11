// Import `src` and `dest` from gulp for use in the task.
const { src, dest, task, watch } = require('gulp');

// Import Gulp plugins.
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');

const paths = {
    src: './src/**/*.js',
    dist: './dist'
};

function build(done) {
    // This will grab any file within src/ or its
    // subdirectories, then ...
    return src(paths.src)
        .pipe(sourcemaps.init())
        // Stop the process if an error is thrown.
        .pipe(plumber())
        // Transpile the JS code using Babel's preset-env.
        .pipe(babel())
        // Generate sourcemaps
        .pipe(sourcemaps.write('.'))
        // Save each component as a separate file in dist.
        .pipe(dest(paths.dist))
}

function buildWatch(done) {
    return watch(paths.src, build);
}

// Gulp 4 uses exported objects as its tasks. Here we only have a
// single export that represents the default gulp task.
exports.default = build;
exports.build = build;
exports.watch = buildWatch;