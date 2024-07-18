const gulp = require('gulp');
const uglify = require('gulp-uglify');

gulp.task('minify-js', function() {
    return gulp.src('src/*.js') // Adjust the source path as needed
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', gulp.series('minify-js'));
