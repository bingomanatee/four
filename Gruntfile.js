module.exports = function (grunt) {

  grunt.initConfig({
      concat: {
        base: {
          files: {
            'build/FOUR.js': [
              'src/node.events.js',
              'src/index.js',
              'src/Record.js',
              'src/Sequence.js'
            ]
          }
        }
      },

      umd: {
        fork: {
          src: 'build/FOUR.js',
          dest: 'FOUR.js',
          objectToExport: 'FOUR',
          amdModuleId: 'FOUR',
          globalAlias: 'FOUR',
          deps: {
            'default': ['_', 'Fools', 'THREE'],
            cjs: ['lodash', 'fools', 'three']
          }
        }
      }
    }
  );

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-umd');
  grunt.registerTask('default', ['concat:base', 'umd:fork' ]);
};