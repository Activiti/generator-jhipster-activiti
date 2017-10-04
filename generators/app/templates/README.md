# Activiti Runtime Bundle Docker Configuration

Use the rb-docker-compose.yml in preferance to the jhipster-generated app.yml. The rb-docker-compose.yml specifies important links to activiti infrastructure.
 
In rb-docker-compose.yml should be much like app.yml except that it should also add the app to the infrastructure network. Note that Activiti does not support all JHipster config (e.g. not all databases supported) so if a section from your app.yml is missing from rb-docker-compose.yml it might not be supported.

You first need a running infrastructure in order to run the runtime bundle. For more on how to run go to https://github.com/Activiti/activiti-cloud-examples
