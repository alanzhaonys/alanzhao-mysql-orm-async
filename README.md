# Usage

## main.js
```
main = async () => {
  // Parse your enviornment variables saved in .env file
  require('dotenv').config();

  // Main database class
  const Database = require('./Database');
  // DbUser extends from DbObject
  const DbUser = require('./DbUser');

 // Get enviornment variables from
  const dbEndpoint = process.env.DB_ENDPOINT;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT;
  const dbConnectTimeout = process.env.DB_CONNECT_TIMEOUT;

  if (!dbEndpoint || !dbUser || !dbPassword || !dbName) {
    throw new Error('Database credential is missing');
  }

  const dbConfigs = {
    'dbHost': dbEndpoint,
    'dbUser': dbUser,
    'dbPassword': dbPassword,
    'dbName': dbName,
    'dbPort': dbPort,
    'dbConnectTimeout': dbConnectTimeout
  };

  // Intantiated database
  const database = new Database(dbConfigs);
  // Connect to database
  await database.connect();

  // Basic query example
  const query = 'SELECT * FROM users ORDER BY ID ASC';
  const users = database.query(query);
  
  for (let i = 0; i < users.length; i++) {
    var users = user[i];
    console.log(user.firstName + ' ' + user.lastName);
  }

  // Output total users in Database
  const totalUsers = await database.getAllCount('users'));
  console.log('Total users: ' + totalUsers);

  // Delete user ID of 10
  await database.delete('users', 10);
  console.log('Deleted a user #10');

  // See API documentation below for more usage information
}

try {
  main();
} catch (error) {
  // All errors will get caught here
  console.log('Main error: ' + error.message);
}
```
