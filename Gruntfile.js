const { cp } = require('shelljs');
const pkg = JSON.parse(require('fs').readFileSync("./package.json", "utf8"))
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typedoc: {
            build: {
                options: {
                    module: 'commonjs',
                    out: './docs',
                    name: pkg.name,
                    target: 'es2018'
                },
                src: ['./src/**/*']
            }
        },
        clean: ["lib"],
        ts: {
            default : {
              outDir: "lib",
              tsconfig: './tsconfig.json'
            }
        }
    });


    grunt.file.expand('./node_modules/grunt-*/tasks').forEach(grunt.loadTasks);

    grunt.registerTask('extraDocStuff', function () {
        cp("-r", "./.docs/.*", "./.docs/*", "./docs");
    });
    
    grunt.registerTask('build', ['clean', 'ts']);
    grunt.registerTask('dist', ['build', 'browserify'])
    grunt.registerTask('default', ['build']);

    grunt.registerTask('docs', ['typedoc']);
};