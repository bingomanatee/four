module.exports = function (grunt) {

  grunt.initConfig({
      concat: {
        base: {
          files: {
            'build/4d.js': [
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
          src: 'build/4d.js',
          dest: '4d.js',
          objectToExport: 'FOUR_D',
          amdModuleId: 'FOUR_D',
          globalAlias: 'FOUR_D',
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