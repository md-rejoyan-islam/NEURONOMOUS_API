pipeline {
    agent {
        label 'neuronomous'
    }
    triggers {
        githubPush()
    }
    environment {
        WORKSPACE_DIR = '/home/workspace/IOT-SERVER'
        WORK_DIR = '/home/apps/server'
        GIT_REPO = 'https://github.com/md-rejoyan-islam/SUST_EEE_IOT_HUB_API.git'
    }
    stages {
        stage('Clone Repository') {
            steps {
                script {
                        echo 'Cloning repository into workspace'
                        git branch: 'main', url: "${GIT_REPO}", credentialsId: 'github-pat-for-client'
                        echo '✅ Repository cloned successfully'
                        // Get current branch name and commit SHA
                        String branchName = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                            ).trim()

                        String commitSHA = sh(
                                script: 'git rev-parse HEAD',
                                returnStdout: true
                        ).trim()

                        // Store the values in the global 'env' map for use in post-build steps
                        env.GIT_BRANCH = branchName
                        env.GIT_COMMIT = commitSHA

                        echo "Current Branch: ${env.CURRENT_GIT_BRANCH}"
                        echo "Current Commit: ${env.CURRENT_GIT_COMMIT}"
                }
            }
        }
        stage('Generate .env file') {
            steps {
                script {
                    def envContent = '''
                        MQTT_BROKER_URL= mqtts://iot.neuronomous.net
                        MQTT_PORT = 8883
                        MQTT_USER = sust_eee_i@t
                        MQTT_PASS = eee_sust_iot_sylhet

                        NODE_ENV = production
                        MONGO_URI=mongodb://sust_eee:seueset_2_3_4@127.0.0.1:27017/neuronomous?authSource=admin

                        SERVER_PORT=5050
                        SERVER_PORT2=5051
                        MAX_REQUESTS = 30
                        MAX_REQUESTS_WINDOW = 60000 # 1 minutes
                        CLIENT_WHITELIST = http://localhost:3000,https://neuronomous.net
                        # JWT secrets
                        JWT_ACCESS_TOKEN_EXPIRES_IN= 18000 # 5 hour
                        JWT_REFRESH_TOKEN_EXPIRES_IN= 86400 # 24 hours
                        JWT_ACCESS_TOKEN_SECRET= 1a2b3c4d5e6f7g8h9i0j34f%$^&*(VGV)
                        JWT_REFRESH_TOKEN_SECRET= 1a2b3c4d5e6f7g8h9i0jswr9343fv
                        # Password reset
                        PASSWORD_RESET_CODE_EXPIRES_IN = 10 # 10 minutes
                        # Nodemailer configuration
                        EMAIL_HOST = smtp.gmail.com
                        EMAIL_PORT = 587
                        EMAIL_USERNAME = neuronomous.iot@gmail.com
                        EMAIL_PASSWORD = bllj jolp trkh irtu
                        EMAIL_FROM = neuronomous.iot@gmail.com

                        # Client URL
                        CLIENT_URL = https://neuronomous.net
                        PRODUCTION_CLIENT_URL = https://neuronomous.net
                        FIRMWARE_BASE_URL = https://neuronomous.net/api/v1/firmwares
                        '''
                    writeFile file: "${WORKSPACE}/.env", text: envContent
                    echo '✅ .env file generated'
                }
            }
        }

        stage('Npm Build') {
            steps {
                script {
                        echo '🔹 Installing dependencies...'
                        // Export PATH and verify Node/npm
                        sh '''
                            export PATH=/root/.nvm/versions/node/v22.19.0/bin:$PATH
                            npm install
                            npm run build
                        '''
                        echo '✅ Build completed successfully'
                }
            }
        }
        stage('Copy Build Files') {
            steps {
                script {
                        echo '🔹 Remove old WORK_DIR and create fresh'
                        sh """
                            if [ -d "${WORK_DIR}" ]; then
                                echo "Directory exists. Removing..."
                                rm -rf "${WORK_DIR}"
                            fi
                            mkdir -p "${WORK_DIR}"
                            echo "Directory ready: ${WORK_DIR}"
                        """
                        echo '🔹 Copy files from workspace to work dir'
                        sh """
                            cp -a ${WORKSPACE_DIR}/. ${WORK_DIR}/
                        """
                        echo '✅ Files copied to WORK_DIR successfully'
                }
            }
        }
        stage('Reload PM2') {
            steps {
                script {
                        echo '🔹 Reloading PM2'
                        sh """
                            # Ensure PM2 path
                            export PATH=/root/.nvm/versions/node/v22.19.0/bin:\$PATH
                            cd ${WORK_DIR}
                            # Reload if already running, else start
                            pm2 reload server || pm2 start npm --name "server" -- run start
                        """
                        echo '✅ PM2 reloaded successfully'
                }
            }
        }
    }

    post {
        always {
            script {
                    echo 'Cleaning up the build workspace directory'
                    cleanWs()
                    echo '✅ Workspace cleaned'
            }
        }
            success {
            script {
                node { // Runs on Jenkins host
                    emailext(
                    subject: "✅ SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    body: """
                        ✅ Jenkins Build Successful!

                        🔹 Job Name: ${env.JOB_NAME}
                        🔹 Build Number: #${env.BUILD_NUMBER}
                        🔹 Branch: ${env.GIT_BRANCH}
                        🔹 Commit: ${env.GIT_COMMIT}
                        🔹 Triggered By: ${currentBuild.getBuildCauses()[0].shortDescription}
                        🔹 Duration: ${currentBuild.durationString}

                        📂 Workspace: ${env.WORKSPACE}
                        📄 Console Log: ${env.BUILD_URL}console
                        📦 Artifacts: ${env.BUILD_URL}artifact
                    """,
                    to: 'rejoyanislam0014@gmail.com'
                )
                }
            }
            }

        failure {
            script {
                node { // Runs on Jenkins host
                    emailext(
                    subject: "❌ FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    body: """
                        ❌ Jenkins Build Failed!

                        🔹 Job Name: ${env.JOB_NAME}
                        🔹 Build Number: #${env.BUILD_NUMBER}
                        🔹 Branch: ${env.GIT_BRANCH}
                        🔹 Commit: ${env.GIT_COMMIT}
                        🔹 Triggered By: ${currentBuild.getBuildCauses()[0].shortDescription}
                        🔹 Duration: ${currentBuild.durationString}

                        ⚠️ Console Output: ${env.BUILD_URL}console
                        📦 Artifacts: ${env.BUILD_URL}artifact
                    """,
                    to: 'rejoyanislam0014@gmail.com'
                )
                }
            }
        }
    }
}
