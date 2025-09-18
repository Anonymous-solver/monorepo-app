pipeline {
    agent any

    environment {
        // DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        // DOCKERHUB_REPO = 'your-dockerhub-username/monorepo-app'
        DOCKER_IMAGE = "anikb29/monorepo-app"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Anonymous-solver/monorepo-app.git'
            }
        }

        stage('Gitleaks Scan') {
            steps {
                sh '''
                    echo "Running Gitleaks secret scan..."
                    curl -sSL https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks-linux-amd64 -o gitleaks
                    chmod +x gitleaks
                    ./gitleaks detect --source . --no-banner --verbose --redact
                '''
            }
        }

        stage('Instll & Test') {
            steps {
                sh 'yarn install'
                sh 'yarn test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker stop monorepo-app || true && docker rm monorepo-app || true'
                sh "docker run -d --name monorepo-app -p 4000:4000 ${DOCKER_IMAGE}:latest"
            }
        }
    }
}
