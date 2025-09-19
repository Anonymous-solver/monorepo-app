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

        stage('Dependency Track Upload') {
            steps {
                withCredentials([string(credentialsId: 'dtrack-api-key', variable: 'DT_API_KEY')]) {
                    powershell '''
                        Write-Output "Generating SBOM with Docker..."
                        docker run --rm -v "${env:WORKSPACE}:/repo" cyclonedx/cyclonedx-bom --project-type npm -o /repo/bom.json
                        if ($LASTEXITCODE -ne 0) {
                            Write-Error "Failed to generate SBOM."
                            exit 1
                        }
                        if (Test-Path "$env:WORKSPACE\\bom.json") {
                            Write-Output "bom.json exists, proceeding with upload..."
                        } else {
                            Write-Error "bom.json not found, aborting upload."
                            exit 1
                        }
                        Write-Output "Uploading SBOM to Dependency-Track..."
                        curl.exe -X POST `
                            -H "X-Api-Key: $env:DT_API_KEY" `
                            -H "Content-Type: application/json" `
                            --data-binary "@$env:WORKSPACE\\bom.json" `
                            http://localhost:9091/api/v1/bom
                        if ($LASTEXITCODE -ne 0) {
                            Write-Error "Failed to upload SBOM to Dependency-Track."
                            exit 1
                        }
                    '''
                }
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

