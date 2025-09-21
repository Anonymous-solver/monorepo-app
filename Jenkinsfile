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

        stage('Test Network Connectivity') {
            steps {
                sh '''
                    echo "Testing connectivity to Dependency-Track server..."
                    echo "Trying 172.17.0.1:9091"
                    curl -v http://172.17.0.1:9091/api/version || echo "Connection to 172.17.0.1 failed"
                    
                    echo "Trying host.docker.internal:9091"
                    curl -v http://host.docker.internal:9091/api/version || echo "Connection to host.docker.internal failed"
                    
                    echo "Trying localhost:9091 from agent"
                    curl -v http://localhost:9091/api/version || echo "Connection to localhost from agent failed"
                    
                    # Check network interfaces
                    echo "Network interfaces:"
                    ifconfig || ip addr || echo "Network tools not available"
                '''
            }
        }

        stage('Publish SBOM (Direct API)') {
            steps {
                withCredentials([string(credentialsId: 'dtrack-api-key', variable: 'DT_API_KEY')]) {
                    sh '''
                        # Generate SBOM
                        npx @cyclonedx/cyclonedx-npm --output-format json --ignore-npm-errors > bom.json
                        
                        # Upload to Dependency-Track
                        echo "Uploading SBOM to Dependency-Track..."
                        curl -v -X "POST" "http://localhost:9091/api/v1/bom" \
                            -H "Content-Type: multipart/form-data" \
                            -H "X-Api-Key: $DT_API_KEY" \
                            -F "projectName=monorepo-app" \
                            -F "projectVersion=1.0.0" \
                            -F "autoCreate=true" \
                            -F "bom=@bom.json"
                        
                        # Check if successful
                        if [ $? -eq 0 ]; then
                            echo "✅ SBOM uploaded successfully to Dependency-Track"
                        else
                            echo "❌ Failed to upload SBOM"
                            exit 1
                        fi
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

