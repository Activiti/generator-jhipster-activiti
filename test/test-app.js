/* global describe, beforeEach, it*/

const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('JHipster generator activiti', () => {
    describe('Simple test', () => {
        beforeEach((done) => {
            helpers
                .run(path.join(__dirname, '../generators/app'))
                .inTmpDir((dir) => {
                    fse.copySync(path.join(__dirname, '../test/templates/default'), dir);
                })
                .withOptions({
                    testmode: true
                })
                .withPrompts({
                    activitiEmbeddedInstall: true
                })
                .on('end', done);
        });

        it('generate files', () => {
            assert.file([
                'src/main/java/org/myjhipsterapp/web.rest/ActivitiController.java',
                'src/main/java/org/myjhipsterapp/web.rest/TaskRepresentation.java',
                'src/main/resources/processes/my-process.bpmn20.xml',
                'src/test/java/org/myjhipsterapp/web.rest/ActivitiControllerIntegrationTest.java',
            ]);
        });
    });

});
