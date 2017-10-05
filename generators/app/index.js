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
                default: false
            },
            {
                type: 'confirm',
                name: 'activitiRBInstall',
                message: 'Would you like to configure this project as an Activiti Cloud Runtime Bundle?',
                default: false
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
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - Activiti requires SQL database (if you need distributed persistence consider adding hazelcast or using e.g. cockroachdb)`);
            return;
        }

        // TODO: refine checks
        // serviceDiscoveryType leads to another variable (possibly) - if consul then say not currently supported through JHipster generator, see https://github.com/Activiti/ for example implementations that you can start from or contact the Activiti team through gitter
        // if kafka say not supported
        // if project type is gateway or registry then say not supported
        // if auth type is ...
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
        this.prodDatabaseType = this.jhipsterAppConfig.prodDatabaseType;
        this.hibernateCache = this.jhipsterAppConfig.hibernateCache;
        this.serverPort = this.jhipsterAppConfig.serverPort;

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

            let mainReadmeActivitiText = '\n## Activiti\n\nDrop a process definition into the ${resourceDir}processes directory and the engine will run it - see https://spring.io/blog/2015/03/08/getting-started-with-activiti-and-spring-boot\n'
            this.rewriteFile('README.md', '[JHipster Homepage and latest documentation]', mainReadmeRBText);
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

            } else if (this.buildTool === 'gradle') {
                this.addGradleDependency('compile', 'org.activiti.cloud', 'activiti-cloud-starter-runtime-bundle', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-runtime-bundle] (gradle)`);

            }

            if (!this.fs.exists(`${dockerDir}/activiti`)) {
                mkdirp(`${dockerDir}/activiti`);
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${dockerDir}activiti`);
            }
            this.template('infrastructure-docker.yml', `${dockerDir}activiti/infrastructure-docker.yml`);
            this.template('_rb-docker-compose.yml', `${dockerDir}activiti/rb-docker-compose.yml`);
            this.template('README.md', `${dockerDir}activiti/README.md`);

            // have to apply @ActivitiRuntimeBundle to JHipster-generated application source file before 'public class'

            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'public class', '@ActivitiRuntimeBundle');
            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'import ', 'import org.activiti.cloud.starter.configuration.ActivitiRuntimeBundle;');

            let activitiConfig = '\n# ===================================================================\n';
            activitiConfig += '# Activiti-specific properties\n';
            activitiConfig += '# ===================================================================\n';
            activitiConfig += 'spring:\n';
            activitiConfig += '    cloud:\n';
            activitiConfig += '        stream:\n';
            activitiConfig += '            bindings:\n';
            activitiConfig += '                auditProducer:\n';
            activitiConfig += '                    destination: ${ACT_RB_AUDIT_PRODUCER_DEST:engineEvents}\n';
            activitiConfig += '                    contentType: ${ACT_RB_AUDIT_PRODUCER_CONTENT_TYPE:application/json}\n';
            activitiConfig += '                myCmdResults:\n';
            activitiConfig += '                    destination: ${ACT_RB_COMMAND_RESULTS_DEST:commandResults}\n';
            activitiConfig += '                    group: ${ACT_RB_COMMAND_RESULTS_GROUP:myCmdGroup}\n';
            activitiConfig += '                    contentType: ${ACT_RB_COMMAND_RESULTS_CONTENT_TYPE:application/json}\n';
            activitiConfig += '                myCmdProducer:\n';
            activitiConfig += '                    destination: ${ACT_RB_COMMAND_RESULTS_DEST:commandConsumer}\n';
            activitiConfig += '                    contentType: ${ACT_RB_COMMAND_RESULTS_CONTENT_TYPE:application/json}\n';
            activitiConfig += '    jackson:\n';
            activitiConfig += '        serialization:\n';
            activitiConfig += '            fail-on-unwrapped-type-identifiers: ${ACT_RB_JACKSON_FAIL_ON_UNWRAPPED_IDS:false}\n';
            activitiConfig += '    activiti:';
            activitiConfig += '        process-definition-location-prefix: "file:${ACT_RB_PROCESSES_PATH:/processes/}"\n';
            activitiConfig += 'keycloak:\n';
            activitiConfig += '    realm: ${ACT_KEYCLOAK_REALM:springboot}\n';
            activitiConfig += '    resource: ${ACT_KEYCLOAK_RESOURCE:activiti}\n';
            activitiConfig += '    public-client: ${ACT_KEYCLOAK_CLIENT:true}\n';
            activitiConfig += '    security-constraints:\n';
            activitiConfig += '        - authRoles: ${ACT_KEYCLOAK_ROLES:user}\n';
            activitiConfig += '        - patterns: ${ACT_KEYCLOAK_PATTERNS:/*}\n';
            activitiConfig += '    principal-attribute: ${ACT_KEYCLOAK_PRINCIPAL_ATTRIBUTE:preferred-username}\n';
            activitiConfig += '    ssl-required: ${ACT_KEYCLOAK_SSL_REQUIRED:none} #change this for prod envs\n';
            activitiConfig += 'keycloakadminclientapp: ${ACT_KEYCLOAK_CLIENT_APP:admin-cli}\n';
            activitiConfig += 'keycloakclientuser: ${ACT_KEYCLOAK_CLIENT_USER:client}\n';
            activitiConfig += 'keycloakclientpassword: ${ACT_KEYCLOAK_CLIENT_PASSWORD:client} # this user needs to have the realm management roles assigned\n';
            activitiConfig += 'eureka:\n';
            activitiConfig += '    client:\n';
            activitiConfig += '        enabled: ${ACT_RB_EUREKA_CLIENT_ENABLED:true}\n';
            activitiConfig += '    instance:\n';
            activitiConfig += `        hostname: \${ACT_RB_HOST:${this.baseName}-app}\n`;
            activitiConfig += 'loader:\n';
            activitiConfig += '    path: ${ACT_RB_LIBDIR:lib/}\n';
            activitiConfig += '\n';

            this.rewriteFile(`${resourceDir}config/application.yml`, 'application:', activitiConfig);

            let activitiConfigDev = '\n# ===================================================================\n';
            activitiConfigDev += '# Activiti-specific properties for running app local against activiti docker infrastructure\n';
            activitiConfigDev += '# ===================================================================\n';
            activitiConfigDev += 'spring:\n';
            activitiConfigDev += '    rabbitmq:\n';
            activitiConfigDev += '        host: ${ACT_RABBITMQ_HOST:rabbitmq}\n';
            activitiConfigDev += 'keycloak:\n';
            activitiConfigDev += '    auth-server-url: ${ACT_KEYCLOAK_URL:http://localhost:8180/auth}\n';
            activitiConfigDev += 'eureka:\n';
            activitiConfigDev += '    client:\n';
            activitiConfigDev += '        serviceUrl:\n';
            activitiConfigDev += '            defaultZone: ${ACT_EUREKA_URL:http://localhost:8761/eureka/}\n';
            this.rewriteFile(`${resourceDir}config/application-dev.yml`, 'application:', activitiConfigDev);

            let activitiConfigProd = '\n# ===================================================================\n';
            activitiConfigProd += '# Activiti-specific properties for running app within docker\n';
            activitiConfigProd += '# ===================================================================\n';
            activitiConfigProd += 'spring:\n';
            activitiConfigProd += '    rabbitmq:\n';
            activitiConfigProd += '        host: ${ACT_RABBITMQ_HOST:rabbitmq}\n';
            activitiConfigProd += 'keycloak:\n';
            activitiConfigProd += '    auth-server-url: ${ACT_KEYCLOAK_URL:http://activiti-cloud-sso-idm:8180/auth}\n';
            activitiConfigProd += 'eureka:\n';
            activitiConfigProd += '    client:\n';
            activitiConfigProd += '        serviceUrl:\n';
            activitiConfigProd += '            defaultZone: ${ACT_EUREKA_URL:http://activiti-cloud-registry:8761/eureka/}\n';
            this.rewriteFile('${resourceDir}config/application-prod.yml', 'application:', activitiConfigProd);

            let mainReadmeRBText = `\n## Activiti\n\nSee ${dockerDir}activiti for running Activiti Runtime Bundle\n`;
            this.rewriteFile('README.md', '[JHipster Homepage and latest documentation]', mainReadmeRBText);

            //TODO: currently referring to new README which says 'rb-docker-compose.yml in preferance to the jhipster-generated app.yml'
            // but it would perhaps be better to do a regex replace in the main README on 'src/main/docker/app.yml'
            // and then say in main README that it has been replaced
            // but first prefix that whole line 'docker-compose -f src/main/docker/app.yml up -d' with a command to start the infrastructure

            // hope that it works without boot 2 or do regex to change

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
