pipeline {
    agent any

    environment {
        // Replace with your Docker Hub credentials ID and username
        DOCKER_CREDENTIALS_ID = 'dockersalarycred'
        DOCKER_USERNAME = 'tarunre16'
        
        // AWS EC2 Details
        EC2_IP = '54.173.224.186'
        EC2_USER = 'ubuntu' // typically 'ec2-user' for Amazon Linux or 'ubuntu' for Ubuntu
        SSH_CREDENTIALS_ID = 'salary-deploy' // Jenkins credentials ID for SSH private key

        SONARQUBE_SERVER = 'SonarCse' // Name of your SonarQube server config in Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner' // Make sure you have this tool configured in Jenkins
                    withSonarQubeEnv(SONARQUBE_SERVER) {
                        // Assuming Windows Jenkins agent, using bat
                        bat """
                        ${scannerHome}\\bin\\sonar-scanner.bat -Dsonar.projectKey=salary-management -Dsonar.projectName=Salary-Management-System -Dsonar.sources=Backend,Frontend -Dsonar.exclusions=**/node_modules/**,**/dist/**
                        """
                    }
                }
            }
        }

        stage('Unit Testing') {
            steps {
                // Since there are no real tests configured right now, this is a placeholder check to ensure dependencies are installed correctly and code can run a test command if you add one later.
                echo 'Running tests...'
                dir('Backend') {
                    bat 'npm install'
                    // bat 'npm test' // Uncomment this once you configure jest/mocha in Backend
                }
                dir('Frontend') {
                    bat 'npm install'
                    // bat 'npm run test' // Uncomment this once you configure vitest/jest in Frontend
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker images...'
                bat "docker build -t ${DOCKER_USERNAME}/salary-backend:latest ./Backend"
                bat "docker build -t ${DOCKER_USERNAME}/salary-frontend:latest ./Frontend"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    // Using a file to pass the password to avoid Windows CMD trailing space issues with echo 
                    writeFile file: 'dockerpass.txt', text: DOCKER_PASS
                    bat "docker login -u %DOCKER_USER% --password-stdin < dockerpass.txt"
                    bat "del dockerpass.txt"
                    
                    bat "docker push ${DOCKER_USERNAME}/salary-backend:latest"
                    bat "docker push ${DOCKER_USERNAME}/salary-frontend:latest"
                }
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                echo 'Deploying to AWS EC2...'
                // Create .env file for docker-compose to use on EC2
                // We use writefile so Jenkins handles it rather than cmd.exe (avoids & parsing issues in Windows)
                writeFile file: '.env.production', text: """PORT=5000
MONGO_URI=mongodb://umeshalla73_db_user:Umesh2006@ac-ukhh8iy-shard-00-00.60zfdl9.mongodb.net:27017,ac-ukhh8iy-shard-00-01.60zfdl9.mongodb.net:27017,ac-ukhh8iy-shard-00-02.60zfdl9.mongodb.net:27017/salary_management?ssl=true&replicaSet=atlas-123tnk-shard-0&authSource=admin&retryWrites=true&w=majority
JWT_SECRET=supersecretjwtkey
DOCKER_USERNAME=${DOCKER_USERNAME}
EC2_PUBLIC_IP=${EC2_IP}
"""
                
                // Using withCredentials instead of sshagent plugin to avoid Windows ssh-agent service error 1058
                withCredentials([sshUserPrivateKey(credentialsId: SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY')]) {
                    // Fix Windows OpenSSH file permission requirements (Error: UNPROTECTED PRIVATE KEY FILE)
                    // We lock the file to only the current Jenkins runner user using standard Windows access lists
                    bat '''
                        icacls "%SSH_KEY%" /inheritance:r
                        FOR /F "tokens=*" %%i IN ('whoami') DO icacls "%SSH_KEY%" /grant "%%i:R"
                    '''

                    // Copy compose file and .env file to EC2 using the injected SSH key
                    bat "scp -i \"%SSH_KEY%\" -o StrictHostKeyChecking=no docker-compose.yml ${EC2_USER}@${EC2_IP}:/home/${EC2_USER}/docker-compose.yml"
                    bat "scp -i \"%SSH_KEY%\" -o StrictHostKeyChecking=no .env.production ${EC2_USER}@${EC2_IP}:/home/${EC2_USER}/.env"
                    
                    // Start services on EC2
                    bat """
                    ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} ^
                    "docker-compose pull && docker-compose up -d"
                    """
                }
            }
        }
    }
}
