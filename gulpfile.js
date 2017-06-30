const gulp = require("gulp");
const tsc = require("gulp-typescript");
const maps = require("gulp-sourcemaps");
const rename = require("gulp-rename");
const sequence = require("run-sequence");
const del = require("del");
const browserify = require("browserify");
const tsify = require("tsify");
const path = require("path");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");

var tsconfig = {
    "outDir": "out",
    "target": "es6",
    "module": "commonjs",
    "inlineSources": true,
    "inlineSourceMap": true,
    "removeComments": true
};

/**
 * Clean up output directory.
 */
gulp.task("clean", function() {
    return del("out");
});

/**
 * Build client and server modules.
 * We build client twice, because the server can reuse code this way.
 * It can require modules, but not bundled ones.
 */
gulp.task("build-all", function() 
{
    return gulp
        .src("src/**/*.ts")
        .pipe(maps.init())
        .pipe(tsc(tsconfig))
        .js
        .pipe(maps.mapSources(function(sourcePath, file) {
            return sourcePath; // It is fine for now
        }))
        .pipe(maps.write())
        .pipe(gulp.dest("out"));
});

/**
 * Build and bundle client modules into one file - needed for older browsers.
 */
gulp.task("build-bundle-client", function() 
{
    return browserify({ "debug": true })
        .add(path.resolve(__dirname, "src/www/lib/index.ts"))
        .plugin(tsify, tsconfig) // Tsfiy is needed for sourcemaps to work
        .bundle()
        .pipe(source("index.bundle.js"))
        .pipe(buffer())
        .pipe(gulp.dest("out/www/lib"));
});

/**
 * Copy static files and resources.
 */
gulp.task("copy-static", function() 
{
    return gulp
        .src(["src/www/**/*", "!src/www/**/*.ts"])
        .pipe(gulp.dest("out/www/"));
});

/**
 * Default action.
 */
gulp.task("default", function() {
    sequence("clean", ["build-all", "build-bundle-client", "copy-static"]);
});