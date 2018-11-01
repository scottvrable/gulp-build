var gulp        = require('gulp'),
    pug         = require('gulp-pug'),
    sass        = require('gulp-sass'),
    prefix      = require('gulp-autoprefixer'),
    sourcemaps  = require('gulp-sourcemaps'),
    browserify  = require('browserify'),
    browserSync = require('browser-sync').create(),
    babelify    = require('babelify'),
    uglifyify   = require('uglifyify'),
    bourbon     = require('bourbon'),
    svgo        = require('gulp-svgo'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    realFavicon = require ('gulp-real-favicon'),
    fs          = require('fs');

// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons. This task takes a few seconds to complete.
// You should run it at least once to create the icons. Then,
// you should run it whenever RealFaviconGenerator updates its
// package (see the check-for-favicon-update task below).
gulp.task('generate-favicon', function(done) {
  realFavicon.generateFavicon({
    masterPicture: 'src/favicon.png',
    dest: 'build/',
    iconsPath: '/',
    design: {
      ios: {
        pictureAspect: 'noChange',
        assets: {
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false,
          declareOnlyDefaultIcon: true
        }
      },
      desktopBrowser: {},
      windows: {
        pictureAspect: 'noChange',
        backgroundColor: '#ecd532',
        onConflict: 'override',
        assets: {
          windows80Ie10Tile: false,
          windows10Ie11EdgeTiles: {
            small: false,
            medium: true,
            big: false,
            rectangle: false
          }
        }
      },
      androidChrome: {
        pictureAspect: 'noChange',
        themeColor: '#ffffff',
        manifest: {
          display: 'standalone',
          orientation: 'notSet',
          onConflict: 'override',
          declared: true
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        }
      },
      safariPinnedTab: {
        pictureAspect: 'blackAndWhite',
        threshold: 62.5,
        themeColor: '#bb54d1'
      }
    },
    settings: {
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: false,
      readmeFile: false,
      htmlCodeFile: false,
      usePathAsIs: false
    },
    markupFile: FAVICON_DATA_FILE
  }, function() {
    done();
  });
});

gulp.task('browserSync', () => {
  browserSync.init({
    server: {
      baseDir: 'build'
    }
  });
});

// Inject the favicon markups in your HTML pages. You should run
// this task whenever you modify a page. You can keep this task
// as is or refactor your existing HTML pipeline.
gulp.task('inject-favicon-markups', function() {
  return gulp.src([ 'build/**/*.html' ])
    .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
    .pipe(gulp.dest('build'));
});

// Check for updates on RealFaviconGenerator (think: Apple has just
// released a new Touch icon along with the latest version of iOS).
// Run this task from time to time. Ideally, make it part of your
// continuous integration system.
gulp.task('check-for-favicon-update', function(done) {
  var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
  realFavicon.checkForUpdates(currentVersion, function(err) {
    if (err) {
      throw err;
    }
  });
});

gulp.task('buildHTML', () => {
  return gulp.src(['./src/**/*.pug', '!./src/**/_*/**/*'])
    .pipe(pug())
    .pipe(gulp.dest('./build/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('buildSass', () => {
  return gulp.src('./src/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: bourbon.includePaths
    }))
    .on('error', sass.logError)
    .pipe(prefix({
      browsers: 'last 2 versions',
      cascade: false
    }))
    .pipe(sourcemaps.write('./sourcemaps/'))
    .pipe(gulp.dest('./build/css/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('buildJS', () => {
  var bundleStream = browserify(['src/js/index.js'])
        .transform(babelify, {presets: ['env'], sourceMaps: true})
        .transform(uglifyify, {global: true})
        .bundle();

  bundleStream
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./sourcemaps/'))
    .pipe(gulp.dest('build/js/'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

gulp.task('transferImages', () => {
  return gulp.src('./src/img/**')
    .pipe(svgo())
    .pipe(gulp.dest('./build/img/'));
});

gulp.task('transferFonts', () => {
  return gulp.src('./src/fonts/**')
    .pipe(gulp.dest('./build/fonts/'));
});

gulp.task('watch', ['browserSync'], () => {
  gulp.watch('./src/**/*.pug', ['buildHTML']);
  gulp.watch('./src/**/*.scss', ['buildSass']);
  gulp.watch('./src/**/*.js', ['buildJS']);
});

gulp.task('default', ['generate-favicon', 'buildHTML', 'inject-favicon-markups',  'buildSass', 'buildJS', 'transferImages', 'transferFonts', 'watch']);
