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

  //
  // Examples on using the main Database class
  //
  
  // Basic query
  const query = 'SELECT * FROM users ORDER BY ID ASC';
  const users = database.query(query);
  
  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    console.log(user.firstName + ' ' + user.lastName);
  }

  // Output total users in Database
  const totalUsers = await database.getAllCount('users'));
  console.log('Total users: ' + totalUsers);

  // Delete user ID of 10
  await database.delete('users', 10);
  console.log('Deleted a user #10');

  //
  // Examples on using the DbObject extended class
  //
 
  // Instantiate DbUser, pass the database connection
  const dbUser = new DbUser(database);

  // Call method on the DbUser
  const specialUsers = await dbUser.getSomeVerySpecialUsers();
  for (let i = 0; i < specialUsers.length; i++) {
    let user = users[i];
    console.log(user.firstName + ' ' + user.lastName);
  }

  // Use the inherited methods
  
  // User ID #10 exists? 
  const userExists = await dbUser.exists(10);
  console.log('User #10 exists: ' + userExists);

  // Update an user
  await dbUser.update(10, { firstName: 'New First Name', lastName: 'New Last Name' });
  console.log('User #10 has been updated');
}

try {
  main();
} catch (error) {
  // All errors will get caught here
  console.log('Main error: ' + error.message);
}
```

## DbUser.js
```
const DbObject = require('./DbObject');

module.exports = class DbUser extends DbObject {
  constructor(db) {
    super(db);

    // Users table
    this.tableName = 'users';
  }

  async getSomeVerySepcialUsers() {
    const query = "SELECT * FROM users WHERE status = 'special'";
    const users = await this.db.query(query);
    return users;
  }
}
```
