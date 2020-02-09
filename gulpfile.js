require("dotenv").config();

// Include Gulp
const gulp = require("gulp"),
    // Gulp plugins
    themekit = require("@shopify/themekit"),
    autoprefixer = require("gulp-autoprefixer"),
    concat = require("gulp-concat"),
    sass = require("gulp-sass"),
    sourcemaps = require("gulp-sourcemaps"),
    uglify = require("gulp-uglify"),
    replace = require("gulp-replace"),
    imagemin = require("gulp-imagemin"),
    babel = require("gulp-babel");

// Input/Output paths and environment variables
const paths = {
    styles: {
        src: ["libs/**/*.css", "scss/**/*.scss"],
        dest: "theme/assets/"
    },
    scripts: {
        src: ["libs/**/*.js", "js/**/*.js"],
        dest: "theme/assets/"
    },
    shopify: {
        src: "theme/**"
    },
    images: {
        src: "theme/assets/**"
    }
};

const uglify_options = {
    mangle: false
};

var img_options = {
    progressive: true,
    svgoPlugins: [{ removeViewBox: false }, { cleanupIDs: false }]
};

// Tasks
function scripts() {
    return gulp
        .src(paths.scripts.src)
        .pipe(sourcemaps.init())
        .pipe(concat("application.js"))
        .pipe(babel({ presets: ["@babel/preset-env"] }))
        .pipe(uglify(uglify_options))
        .on("error", swallowError)
        .pipe(sourcemaps.write("./"))
        .pipe(gulp.dest(paths.scripts.dest));
}

function styles() {
    return gulp
        .src(paths.styles.src)
        .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(concat("application.scss.liquid"))
        .pipe(replace('"{{', "{{"))
        .pipe(replace('}}"', "}}"))
        .pipe(gulp.dest(paths.styles.dest));
}

function shopifyUpload() {
    return themekit.command(
        "deploy",
        {
            password: process.env.API_PASSWORD,
            store: process.env.SHOP_URL,
            themeid: process.env.THEME_ID
        },
        { cwd: "theme/" }
    );
}

function shopifyDownload() {
    return themekit.command(
        "download",
        {
            password: process.env.API_PASSWORD,
            store: process.env.SHOP_URL,
            themeid: process.env.THEME_ID
        },
        { cwd: "theme/" }
    );
}

/**
 * Be sure that file uploads before maps
 * @param {*} path
 */
function shopifyDeploy(path) {
    path = path.replace("theme/", "");
    return themekit.command(
        "deploy",
        {
            password: process.env.API_PASSWORD,
            store: process.env.SHOP_URL,
            themeid: process.env.THEME_ID,
            files: [path]
        },
        { cwd: "theme/" }
    );
}

function image() {
    return gulp.src(paths.images.src).pipe(imagemin(img_options));
}

function swallowError(error) {
    console.log(error.toString());
    this.emit("end");
}

function watch() {
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.shopify.src).on("change", function(path) {
        shopifyDeploy(path);
    });
}

const build = gulp.series(gulp.parallel(styles, scripts));

exports.styles = styles;
exports.scripts = scripts;
exports.shopifyUpload = shopifyUpload;
exports.shopifyDownload = shopifyDownload;
exports.image = image;
exports.watch = watch;
exports.build = build;
exports.default = gulp.series(build, shopifyUpload, watch);
