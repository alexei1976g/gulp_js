const { src, dest, series, parallel, watch } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const concat = require('gulp-concat')
const htmlMin = require('gulp-htmlmin')
const autoprefixer = require('gulp-autoprefixer')
const cleanCSS = require('gulp-clean-css')
const imagemin = require('gulp-imagemin')
const fonter = require('gulp-fonter')
const ttf2woff2 = require('gulp-ttf2woff2')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify-es').default
const notify = require('gulp-notify')
const sourcemaps = require('gulp-sourcemaps')
const groupMedia = require('gulp-group-css-media-queries')
const del = require('del')
const browserSync = require('browser-sync').create()

const clean = () => {
    return del(['dist'], { force: true })
}

const styles = () => {
  return src('src/sass/style.scss')
    .pipe(sass({
      includePaths: [
        'sass/vendor/',
        'sass/global/',
        'sass/blocks/'
      ]
    }).on('error', sass.logError))
    .pipe(groupMedia())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(dest('dist/css'))
    .pipe(browserSync.stream())
}

const htmlMinify = () => {
    return src('src/**/*.html')
        .pipe(htmlMin({ collapseWhitespace: true }))
        .pipe(dest('dist'))
        .pipe(browserSync.stream())
}

const scripts = () => {
  const files = [
  'src/js/card-manager.js',     
  'src/js/product-cards.js',  
  'src/js/product-sort.js',
  'src/js/product-filter.js', 
  'src/js/pagination.js',
  'src/js/day-products-renderer.js',
  'src/js/city-selector.js',  
  'src/js/tooltip-manager.js',
  'src/js/accordion.js',
  'src/js/validate.js',
  'src/js/just-validate.js',
  'src/js/burger-menu.js',
  'src/js/main.js'    
  ];

  return src(files)            
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(concat('scripts.js'))
    .pipe(uglify().on('error', notify.onError()))
    .pipe(sourcemaps.write())
    .pipe(dest('dist/js'))
    .pipe(browserSync.stream());
};

const data = () => {
    return src('src/data/**/*')
        .pipe(dest('dist/data'))
}

const images = () => {
    return src([
        'src/images/**/*.jpg',
        'src/images/**/*.png',
    ], { encoding: false })
        .pipe(imagemin())
        .pipe(dest('dist/images'))
}

 const fonts = () => {
    return src('src/fonts/*.*')
    .pipe(fonter({
        formats: ['woff', 'ttf']
    }))
    .pipe(ttf2woff2())
    .pipe(dest('dist/fonts'))
}

const watchFiles = () => {
    browserSync.init({
        server: { baseDir: './dist' },
        port: 3000,
        open: true
    })
    watch('src/**/*.html', htmlMinify)
    watch('src/sass/**/*.scss', styles)
    watch('src/js/**/*.js', scripts)
    watch('src/data/**/*.json', data)
}

exports.styles = styles
exports.htmlMinify = htmlMinify
exports.scripts = scripts
exports.data = data
exports.images = images
exports.fonts = fonts
exports.default = series(
clean,
parallel(styles, htmlMinify, scripts, data, images, fonts), 
    watchFiles
)
