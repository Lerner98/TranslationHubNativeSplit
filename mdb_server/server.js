const { spawn } = require('child_process');

// Function to start a microservice
const startMicroservice = (serviceName, servicePath, port) => {
  const child = spawn('node', [`${servicePath}/server.js`], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PORT: port },
  });

  child.stdout.on('data', (data) => {
    console.log(`[${serviceName}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[${serviceName} ERROR] ${data}`);
  });

  child.on('error', (error) => {
    console.error(`[${serviceName} ERROR] Failed to start: ${error.message}`);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`[${serviceName}] Exited with code ${code} and signal ${signal}`);
    }
  });

  return child;
};

// Start the microservices
const adminService = startMicroservice('AdminService', './admin-service', 3001);
const reportService = startMicroservice('ReportService', './report-service', 3002);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down microservices...');
  adminService.kill();
  reportService.kill();
  process.exit(0);
});