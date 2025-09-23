pipeline {
    agent any

    environment {
        DT_API_TOKEN = "odt_W17FM3P5_r6feD519ruL9iX5BJZrdg5pWp2p8xgrv"
        DT_API_URL = "http://localhost:9091"
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
                script {
                    sh '''
                        git config --global --add safe.directory $(pwd)
 
                        npm install --save-dev @cyclonedx/bom
                        npx cyclonedx-bom -o sbom.json
 
                        ls -la sbom.json
                    '''
                }
            }
        }
 
        stage('Upload SBOM to Dependency-Track') {
            steps {
                dependencyTrackPublisher(
                    artifact: 'sbom.json',
                    autoCreateProjects: true,
                    dependencyTrackApiKey: "${DT_API_TOKEN}",
                    dependencyTrackFrontendUrl: "${DT_API_URL}",
                    dependencyTrackUrl: "${DT_API_URL}",
                    projectName: 'monorepo-app',
                    synchronous: true                    // ✅ REQUIRED
                )
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

