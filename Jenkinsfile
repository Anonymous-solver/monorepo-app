pipeline {
    agent any

    environment {
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
                powershell '''
                    Write-Output "Running Gitleaks scan with Docker..."
                    docker run --rm -v "${env:WORKSPACE}:/repo" zricethezav/gitleaks:latest detect --source=/repo --no-banner --verbose --redact; exit 0
                '''
            }
        }

        stage('Install & Test') {
            steps {
                sh 'yarn install'
                sh 'yarn test'
            }
        }

        stage('Generate SBOM') {
            steps {
                powershell """
                    Write-Output 'Generating SBOM with CycloneDX...'
                    docker run --rm -v "${env:WORKSPACE}:/app" -w /app cyclonedx/cyclonedx-cli:latest make --output-format json --output-file bom.json
                    Write-Output 'SBOM generated successfully!'
                """
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

