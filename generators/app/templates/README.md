# Activiti Runtime Bundle Docker Configuration

Use the rb-docker-compose.yml in preferance to the jhipster-generated app.yml - but if you don't want to use postgres then you'll need to configure the database settings. The rb-docker-compose.yml specifies important links to activiti infrastructure.
 
In rb-docker-compose.yml replace rb-my-app with the name of the docker image built for your application. You can build using the JHipster Dockerfile and use this name by going to the docker directory and doing 'docker build -t rb-my-app .'

You first need a running infrastructure in order to run the runtime bundle. For more on how to run go to https://github.com/Activiti/activiti-cloud-examples
