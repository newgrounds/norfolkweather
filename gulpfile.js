var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    connect = require('gulp-connect'),
    browserify = require('gulp-browserify'),
    reactify = require('reactify'),
    notify = require('gulp-notify');

// starts server and injects livereload
gulp.task('connect', function () {
    connect.server({
        port: 8000,
        livereload: true
    });
});

var handleErrors = function (err) {
    notify.onError({
        message: "<%= error.message %>"
    }).apply(this, arguments);

    this.emit('end');
};

// browserify to require react
gulp.task('browserify', function () {
    return gulp.src('src_js/*.js')
        .pipe(browserify({transform: 'reactify'}))
        .on('error', handleErrors)
        .pipe(gulp.dest('js'))
        .pipe(connect.reload());
});

// lint task to keep my JS in check
gulp.task('lint', function () {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(connect.reload());
});

// compile sass because who has time to do this manually
gulp.task('sass', function () {
    return gulp.src('scss/*.scss')
        .pipe(sass())
        .on('error', handleErrors)
        .pipe(gulp.dest('css'))
        .pipe(connect.reload());
});

// watch for html changes
gulp.task('html', function () {
    return gulp.src('*.html')
        .pipe(connect.reload());
});

// look for changes
gulp.task('watch', function () {
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('*.html', ['html']);
    gulp.watch('src_js/*.js', ['browserify']);
    //gulp.watch('js/*.js', ['lint']);
});

// set default task to do everything
gulp.task('default', ['connect', 'sass', 'browserify', /*'lint', */'watch']);
