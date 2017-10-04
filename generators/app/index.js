const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const mkdirp = require('mkdirp');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

module.exports = JhipsterGenerator.extend({
    initializing: {
        readConfig() {
            this.jhipsterAppConfig = this.getJhipsterAppConfig();
            if (!this.jhipsterAppConfig) {
                this.error('Can\'t read .yo-rc.json');
            }
        },
        displayLogo() {
            // it's here to show that you can use functions from generator-jhipster
            // this function is in: generator-jhipster/generators/generator-base.js
            this.printJHipsterLogo();

            // Have Yeoman greet the user.
            this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster activiti')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
        },
        checkJhipster() {
            const jhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
            const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
            if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
                this.warning(`\nYour generated project used an old JHipster version (${jhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
            }
        }
    },

    prompting() {
        const prompts = [
            {
                type: 'confirm',
                name: 'activitiEmbeddedInstall',
                message: 'Would you like to install embedded Activiti?',
                default: true
            },
            {
                type: 'confirm',
                name: 'activitiRBInstall',
                message: 'Would you like to configure this project as an Activiti Cloud Runtime Bundle?',
                default: true
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            // To access props later use this.props.someOption;

            done();
        });
    },

    writing() {

        // Abort if required
        this.activitiEmbeddedInstall = this.props.activitiEmbeddedInstall;
        this.activitiRBInstall = this.props.activitiRBInstall;

        if (!this.activitiEmbeddedInstall && !this.activitiRBInstall) {
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - No install option selected`);
            return;
        }

        if (this.jhipsterAppConfig.databaseType !== 'sql') {
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - Activiti embedded requires SQL database`);
            return;
        }

        if (this.activitiRBInstall && this.jhipsterAppConfig.applicationType !== 'monolith') {
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - Activiti RB will configure app as microservice - app type must first be monolith in order to configure`);
            return;
        }

        // function to use directly template
        this.template = function (source, destination) {
            this.fs.copyTpl(
                this.templatePath(source),
                this.destinationPath(destination),
                this
            );
        };

        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;
        this.databaseType = this.jhipsterAppConfig.databaseType;
        this.applicationType = this.jhipsterAppConfig.applicationType;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        const testResourceDir = jhipsterConstants.SERVER_TEST_RES_DIR;
        const dockerDir = jhipsterConstants.DOCKER_DIR;

        // show all variables
        this.log('\n--- config ---');
        this.log(`baseName=${this.baseName}`);
        this.log(`packageName=${this.packageName}`);
        this.log(`clientFramework=${this.clientFramework}`);
        this.log(`clientPackageManager=${this.clientPackageManager}`);
        this.log(`buildTool=${this.buildTool}`);
        this.log(`databaseType=${this.databaseType}`);
        this.log(`javaDir=${javaDir}`);
        this.log(`dockerDir=${dockerDir}`);

        this.log('\n--- variables from questions ---');
        this.log(`\nactivitiEmbeddedInstall=${this.activitiEmbeddedInstall}`);
        this.log(`\nactivitiRBInstall=${this.activitiRBInstall}`);
        this.log('------\n');


        if (this.activitiEmbeddedInstall) {

            // add maven or gradle dependency to starter
            if (this.buildTool === 'maven') {
                this.addMavenDependency('org.activiti.cloud', 'activiti-cloud-starter-configure', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-configure] (maven)`);
            } else if (this.buildTool === 'gradle') {
                this.addGradleDependency('compile', 'org.activiti.cloud', 'activiti-cloud-starter-configure', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-configure] (gradle)`);
            }
        }

        // create process dir whether embedded or RB
        if (!this.fs.exists(`${resourceDir}processes`)) {
            mkdirp(`${resourceDir}processes`);
            this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${resourceDir}processes`);
        }
        if (!this.fs.exists(`${testResourceDir}processes`)) {
            mkdirp(`${testResourceDir}processes`);
            this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${testResourceDir}processes`);
        }

        if (this.activitiRBInstall) {


            if (this.buildTool === 'maven') {
                this.addMavenDependency('org.activiti.cloud', 'activiti-cloud-starter-runtime-bundle', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-runtime-bundle] (maven)`);

                // add postgres dependency since you can't add the jar through the JHipster Dockerfile and overwriting Dockerfile prob won't work since they use WAR packaging
                this.addMavenDependency('org.postgresql', 'postgresql', '9.4.1212.jre7');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [postgresql] (maven)`);

            } else if (this.buildTool === 'gradle') {
                this.addGradleDependency('compile', 'org.activiti.cloud', 'activiti-cloud-starter-runtime-bundle', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-runtime-bundle] (gradle)`);

                this.addGradleDependency('compile', 'org.postgresql', 'postgresql', '9.4.1212.jre7');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [postgresql] (gradle)`);
            }

            if (!this.fs.exists(`${dockerDir}/activiti`)) {
                mkdirp(`${dockerDir}/activiti`);
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${dockerDir}activiti`);
            }
            this.template('infrastructure-docker.yml', `${dockerDir}activiti/infrastructure-docker.yml`);
            this.template('rb-docker-compose.yml', `${dockerDir}activiti/rb-docker-compose.yml`);
            this.template('README.md', `${dockerDir}activiti/README.md`);

            // have to apply @ActivitiRuntimeBundle to JHipster-generated application source file before 'public class'

            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'public class', '@ActivitiRuntimeBundle');
            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'import ', 'import org.activiti.cloud.starter.configuration.ActivitiRuntimeBundle;');

            // TODO: configure properties file (https://github.com/clun/generator-jhipster-ff4j/blob/master/generators/app/index.js#L457)
            // have to use localhost for application-dev.yml and docker hostnames for application-prod.yml and common stuff in application.yml
            // for all app-specific properties the needle is 'application:'
            //

            let activitiConfigDev = '\n# ===================================================================\n';
            activitiConfigDev+='# Activiti-specific properties\n';
            activitiConfigDev+='# ===================================================================\n';

            this.rewriteFile('${resourceDir}config/application-dev.yml', 'application:', activitiConfigDev);

            // hope that it works without boot 2 or tell user to change

            // hope that it works without changing layout to zip in boot maven plugin (probably will for this purpose) or talk to jhipster about changing its config (or maybe this.addMavenPlugin will overwrite?)

            // jhipster is using war packaging instead of jar (see https://stackoverflow.com/questions/30915614/can-i-force-maven-to-build-a-jar-even-though-pom-packaging-specifies-war)
            // that means have to build docker image the jhipster way (can't include our dockerfile as won't work) so test that
        }

    },

    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    },

    end() {
        this.log('End of activiti generator');
    }
});
