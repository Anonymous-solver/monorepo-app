pipeline {
    agent any
   
    environment {
        DT_API_TOKEN = "odt_PpnCJGh5_860dzFYo56mG1bHHKLTkDxtaVos6ywAA"
        DT_API_URL = "http://localhost:9090"
        DOCKER_IMAGE = "anikb29/monorepo-app"
        BUILD_NUMBER = "101"
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
                script {
                    echo "🔎 Ensuring Dependency-Track project exists..."
                    sh '''
                        set -e
                        echo "➡ Checking if project exists..."
                        HTTP_CODE=$(curl -s -o /tmp/dt_project.json -w "%{http_code}" \
                            -H "X-Api-Key: ${DT_API_TOKEN}" \
                            "http://localhost:9091/api/v1/project?name=monorepo-app&version=1.0.0")

                        if grep -q '"uuid"' /tmp/dt_project.json; then
                            echo "✅ Project already exists"
                        else
                            echo "⚡ Project not found. Creating..."
                            curl -s -X PUT \
                                -H "X-Api-Key: ${DT_API_TOKEN}" \
                                -H "Content-Type: application/json" \
                                -d '{
                                    "name": "monorepo-app",
                                    "version": "1.0.0",
                                    "classifier": "APPLICATION"
                                }' \
                                http://localhost:9091/api/v1/project > /tmp/dt_project.json
                        fi

                        echo "📄 Project JSON:"
                        cat /tmp/dt_project.json
                    '''

                    // ✅ Robust UUID extraction — ignores whitespace and validates format
                    def projectUuid = sh(
                        script: '''
                            grep -o '"uuid":"[a-f0-9-]*"' /tmp/dt_project.json | \
                            head -1 | cut -d '"' -f4 | tr -d '[:space:]'
                        ''',
                        returnStdout: true
                    ).trim()

                    if (!projectUuid) {
                        error("❌ Failed to extract project UUID from /tmp/dt_project.json")
                    }

                    echo "✅ Using Dependency-Track project UUID: ${projectUuid}"

                    dependencyTrackPublisher(
                        artifact: 'sbom.json',
                        dependencyTrackApiKey: "${DT_API_TOKEN}",
                        dependencyTrackFrontendUrl: "${DT_API_URL}",
                        dependencyTrackUrl: "http://localhost:9091",
                        projectId: "${projectUuid}",
                        synchronous: false
                    )
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

        // stage('Deploy') {
        //     steps {
        //         sh 'docker stop monorepo-app || true && docker rm monorepo-app || true'
        //         sh "docker run -d --name monorepo-app -p 4000:4000 ${DOCKER_IMAGE}:latest"
        //     }
        // }

        stage('Deploy to EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')]) {
                    sh '''
                        ssh -i $SSH_KEY -o StrictHostKeyChecking=no ec2-user@ec2-44-221-45-198.compute-1.amazonaws.com "
                            docker stop monorepo-app || true &&
                            docker rm monorepo-app || true &&
                            docker pull anikb29/monorepo-app:latest &&
                            docker run -d --name monorepo-app -p 4000:4000 anikb29/monorepo-app:latest
                        "
                    '''
                }
            }
        }
    }
}

