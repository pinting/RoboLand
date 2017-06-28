const gulp = require("gulp");
const tsc = require("gulp-typescript");
const copy = require("gulp-copy");
const del = require("del");

var clientProject = tsc.createProject("tsconfig.www.json");
var serverProject = tsc.createProject("tsconfig.json");

/**
 * Build client scripts
 */
gulp.task("build-client", function() 
{
    return clientProject
        .src()
        .pipe(clientProject())
        .js
        .pipe(gulp.dest(""));
});

/**
 * Build server scripts
 */
gulp.task("build-server", function() 
{
    return serverProject
        .src()
        .pipe(serverProject())
        .js
        .pipe(gulp.dest("out"));
});

/**
 * Copy static files and resources
 */
gulp.task("copy-static", function() 
{
    return gulp
        .src(["src/www/**/*", "!src/www/**/*.ts"])
        .pipe(gulp.dest("out/www/"));
});

gulp.task("default", ["copy-static", "build-client", "build-server"]);