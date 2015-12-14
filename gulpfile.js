'use strict';

const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');

const pluginRenames = {
  'gulp-eslint': 'eslint'
};

const plugins = gulpLoadPlugins({
  rename: pluginRenames,
  replaceString: /^gulp(-|\.)/
});

gulp.task('eslint', () => {
  return gulp.src(['lib/**/*.js', 'test/**/*.js'])
    .pipe(plugins.eslint('eslint.yaml'))
    .pipe(plugins.eslint.format());
});

gulp.task('default', ['eslint']);
