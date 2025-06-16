// hash-password.js
const bcrypt = require('bcryptjs');

const password = 'CSEadmin2025!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed Password:', hash);
});
