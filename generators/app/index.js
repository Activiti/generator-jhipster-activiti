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
            }/*,
            {  CAN'T SUPPORT THIS RIGHT NOW AS JHIPSTER CHANGES FOR BOOT 2.0 ARE LARGE
                type: 'confirm',
                name: 'activitiRBInstall',
                message: 'Would you like to configure this project as an Activiti Cloud Runtime Bundle? (This generator option is experimental and requires spring boot 2.0)',
                default: false
            }*/
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
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - Activiti requires SQL database (if you need distributed persistence consider adding caching or using e.g. cockroachdb)`);
            return;
        }

        if (this.activitiRBInstall && this.jhipsterAppConfig.applicationType !== 'microservice') {
            this.log(`\n${chalk.bold.red('[jhipster-activiti]')} - Aborted - Runtime Bundles can only be microservices - see https://github.com/Activiti/`);
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
        this.serviceDiscoveryType = this.jhipsterAppConfig.serviceDiscoveryType;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        const testResourceDir = jhipsterConstants.SERVER_TEST_RES_DIR;
        const dockerDir = jhipsterConstants.DOCKER_DIR;
        const javaTestDir = `${jhipsterConstants.SERVER_TEST_SRC_DIR + this.packageFolder}/`;

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

        // add an example helloworld-type process but controller only for embedded
        this.template('my-process.bpmn20.xml', `${resourceDir}processes/my-process.bpmn20.xml`);

        if (this.activitiEmbeddedInstall) {

            this.template('TaskRepresentation.java', `${javaDir}web.rest/TaskRepresentation.java`);
            this.template('ActivitiController.java', `${javaDir}web.rest/ActivitiController.java`);
            this.template('ActivitiControllerIntegrationTest.java', `${javaTestDir}web.rest/ActivitiControllerIntegrationTest.java`);


            // add maven or gradle dependency to starter
            if (this.buildTool === 'maven') {
                this.addMavenDependency('org.activiti.cloud', 'activiti-cloud-starter-configure', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-configure] (maven)`);
            } else if (this.buildTool === 'gradle') {
                this.addGradleDependency('compile', 'org.activiti.cloud', 'activiti-cloud-starter-configure', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-configure] (gradle)`);
            }

            let mainReadmeActivitiText = `\n## Activiti\n\nDrop a process definition into the ${resourceDir}processes directory and the engine will run it. An example definition and controller has been included based on http://www.baeldung.com/spring-activiti\n`;
            this.rewriteFile('README.md', '[JHipster Homepage and latest documentation]', mainReadmeActivitiText);
        }

        // create processes dir whether embedded or RB
        if (!this.fs.exists(`${resourceDir}processes`)) {
            mkdirp(`${resourceDir}processes`);
            this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${resourceDir}processes`);
        }
        if (!this.fs.exists(`${testResourceDir}processes`)) {
            mkdirp(`${testResourceDir}processes`);
            this.log(`${chalk.bold.green('[jhipster-activiti]')} - Create dir ${testResourceDir}processes`);
        }

/*  TODO: Won't make below available until either JHipster moves to boot 2.0.0 or we provide 'lite' versions of our starters without rabbit, idm or eureka
    Then we can check for those deps being provided by JHipster and use JHipster versions if available or add/error if not
    This will avoid the need to try to block transitive deps to get working on boot 1
    With IDM excluded would be good to provide an empty UserGroupLookupProxy and update RB with option to set groups in request param

        if (this.activitiRBInstall) {

            // excluding keycloak as JHipster not yet on boot 2.0 and adapter we're using requires it
            if (this.buildTool === 'maven') {
                let mvnExclusion = '             <exclusions>';
                mvnExclusion += '<exclusion>';
                mvnExclusion += '    <groupId>org.activiti</groupId>';
                mvnExclusion += '    <artifactId>activiti-services-identity-keycloak</artifactId>';
                mvnExclusion += '    </exclusion>';
                mvnExclusion += '    </exclusions>';
                this.addMavenDependency('org.activiti.cloud', 'activiti-cloud-starter-runtime-bundle', '7-201709-EA', mvnExclusion);
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-runtime-bundle] (maven)`);

            } else if (this.buildTool === 'gradle') {
                this.addGradleDependency('compile', 'org.activiti.cloud', 'activiti-cloud-starter-runtime-bundle', '7-201709-EA');
                this.addGradleDependency('compile.exclude', 'org.activiti', 'activiti-services-identity-keycloak', '7-201709-EA');
                this.log(`${chalk.bold.green('[jhipster-activiti]')} - Add dependency [activiti-cloud-starter-runtime-bundle] (gradle)`);

            }

            // have to apply @ActivitiRuntimeBundle to JHipster-generated application source file before 'public class'

            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'public class', '@ActivitiRuntimeBundle');
            this.rewriteFile(`${javaDir}${this.baseName}App.java`, 'import ', 'import org.activiti.cloud.starter.configuration.ActivitiRuntimeBundle;');

            let activitiConfig = '\n# ===================================================================\n';
            activitiConfig += '# Activiti-specific properties (some links to other activiti components commented)\n';
            activitiConfig += '# ===================================================================\n';
            activitiConfig += 'spring:\n';
            activitiConfig += '#    cloud:\n';
            activitiConfig += '#        stream:\n';
            activitiConfig += '#            bindings:\n';
            activitiConfig += '#                auditProducer:\n';
            activitiConfig += '#                    destination: ${ACT_RB_AUDIT_PRODUCER_DEST:engineEvents}\n';
            activitiConfig += '#                    contentType: ${ACT_RB_AUDIT_PRODUCER_CONTENT_TYPE:application/json}\n';
            activitiConfig += '#                myCmdResults:\n';
            activitiConfig += '#                    destination: ${ACT_RB_COMMAND_RESULTS_DEST:commandResults}\n';
            activitiConfig += '#                    group: ${ACT_RB_COMMAND_RESULTS_GROUP:myCmdGroup}\n';
            activitiConfig += '#                    contentType: ${ACT_RB_COMMAND_RESULTS_CONTENT_TYPE:application/json}\n';
            activitiConfig += '#                myCmdProducer:\n';
            activitiConfig += '#                    destination: ${ACT_RB_COMMAND_RESULTS_DEST:commandConsumer}\n';
            activitiConfig += '#                    contentType: ${ACT_RB_COMMAND_RESULTS_CONTENT_TYPE:application/json}\n';
            activitiConfig += '    jackson:\n';
            activitiConfig += '        serialization:\n';
            activitiConfig += '            fail-on-unwrapped-type-identifiers: ${ACT_RB_JACKSON_FAIL_ON_UNWRAPPED_IDS:false}\n';
            activitiConfig += '    activiti:';
            activitiConfig += '        process-definition-location-prefix: "file:${ACT_RB_PROCESSES_PATH:/processes/}"\n';
            activitiConfig += '#keycloak:\n';
            activitiConfig += '#    realm: ${ACT_KEYCLOAK_REALM:springboot}\n';
            activitiConfig += '#    resource: ${ACT_KEYCLOAK_RESOURCE:activiti}\n';
            activitiConfig += '#    public-client: ${ACT_KEYCLOAK_CLIENT:true}\n';
            activitiConfig += '#    security-constraints:\n';
            activitiConfig += '#        - authRoles: ${ACT_KEYCLOAK_ROLES:user}\n';
            activitiConfig += '#        - patterns: ${ACT_KEYCLOAK_PATTERNS:/*}\n';
            activitiConfig += '#    principal-attribute: ${ACT_KEYCLOAK_PRINCIPAL_ATTRIBUTE:preferred-username}\n';
            activitiConfig += '#    ssl-required: ${ACT_KEYCLOAK_SSL_REQUIRED:none} #change this for prod envs\n';
            activitiConfig += '#keycloakadminclientapp: ${ACT_KEYCLOAK_CLIENT_APP:admin-cli}\n';
            activitiConfig += '#keycloakclientuser: ${ACT_KEYCLOAK_CLIENT_USER:client}\n';
            activitiConfig += '#keycloakclientpassword: ${ACT_KEYCLOAK_CLIENT_PASSWORD:client} # this user needs to have the realm management roles assigned\n';


            activitiConfig += 'eureka:\n';
            activitiConfig += '    client:\n';
            if (this.serviceDiscoveryType === 'eureka') {
                activitiConfig += '        enabled: ${ACT_RB_EUREKA_CLIENT_ENABLED:true}\n';
            } else {
                activitiConfig += '        enabled: ${ACT_RB_EUREKA_CLIENT_ENABLED:false}\n';
            }

            activitiConfig += '    instance:\n';
            activitiConfig += `        hostname: \${ACT_RB_HOST:${this.baseName}-app}\n`;
            activitiConfig += 'loader:\n';
            activitiConfig += '    path: ${ACT_RB_LIBDIR:lib/}\n';
            activitiConfig += '\n';

            this.rewriteFile(`${resourceDir}config/application.yml`, 'application:', activitiConfig);

            let activitiConfigDev = '\n# ===================================================================\n';
            activitiConfigDev += '# Activiti-specific properties for running app local against activiti docker infrastructure (some links to other activiti components commented)\n';
            activitiConfigDev += '# ===================================================================\n';
            activitiConfigDev += 'spring:\n';
            activitiConfigDev += '    rabbitmq:\n';
            activitiConfigDev += '        host: ${ACT_RABBITMQ_HOST:rabbitmq}\n';
            activitiConfigDev += '#keycloak:\n';
            activitiConfigDev += '#    auth-server-url: ${ACT_KEYCLOAK_URL:http://localhost:8180/auth}\n';
            activitiConfigDev += 'eureka:\n';
            activitiConfigDev += '    client:\n';
            activitiConfigDev += '        serviceUrl:\n';
            activitiConfigDev += '            defaultZone: ${ACT_EUREKA_URL:http://localhost:8761/eureka/}\n';
            this.rewriteFile(`${resourceDir}config/application-dev.yml`, 'application:', activitiConfigDev);

            let activitiConfigProd = '\n# ===================================================================\n';
            activitiConfigProd += '# Activiti-specific properties for running app within docker (some links to other activiti components commented)\n';
            activitiConfigProd += '# ===================================================================\n';
            activitiConfigProd += 'spring:\n';
            activitiConfigProd += '    rabbitmq:\n';
            activitiConfigProd += '        host: ${ACT_RABBITMQ_HOST:rabbitmq}\n';
            activitiConfigProd += '#keycloak:\n';
            activitiConfigProd += '#    auth-server-url: ${ACT_KEYCLOAK_URL:http://activiti-cloud-sso-idm:8180/auth}\n';
            activitiConfigProd += 'eureka:\n';
            activitiConfigProd += '    client:\n';
            activitiConfigProd += '        serviceUrl:\n';
            activitiConfigProd += '            defaultZone: ${ACT_EUREKA_URL:http://activiti-cloud-registry:8761/eureka/}\n';
            this.rewriteFile(`${resourceDir}config/application-prod.yml`, 'application:', activitiConfigProd);

            let mainReadmeRBText = `\n## Activiti Runtime Bundle\n\n`;
            mainReadmeRBText += `Note that to use this application you will need to ensure it is on spring boot 2.0.0. \n`;
            mainReadmeRBText += `This application has been configured as an Activiti runtime bundle but without keycloak (dependency is excluded), which is needed to use in conjunction with the default docker images for first version of Activiti Cloud. \n`;
            mainReadmeRBText += `Activiti Cloud can be used with other IDMs but for 7-201709-EA each of the components then first have to be built individually with the configuration for the IDM. \n`;
            mainReadmeRBText += `The runtime bundle can be used in isolation but is intended to be used with other components. To put together with the other components see https://activiti.gitbooks.io/activiti-7-developers-guide/content/ and https://github.com/Activiti/activiti-cloud-examples. For discussion join https://gitter.im/Activiti/Activiti7\n`;
            this.rewriteFile('README.md', '[JHipster Homepage and latest documentation]', mainReadmeRBText);

            if (this.serverPort === 8080 || this.serverPort === 8180){
                this.log(`\n${chalk.bold.yellow('[jhipster-activiti]')} - Please check that your port does not conflict with the gateway or sso ports if you intend to run with Activiti infrastructure`);
            }
        }*/

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
