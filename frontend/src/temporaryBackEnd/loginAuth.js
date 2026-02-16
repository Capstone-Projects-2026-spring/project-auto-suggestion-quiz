const VALID_USERS = [
  //TEMPORARY FOR NOW
  //Since this is login bare bones this push will not have sql lite data, consider this folder a temporary use for authenticating users and having login actually work
  {email: 'tup@temple.edu', password: 'auto', role: 'student' },
  {email: 'teST@temple.edu', password: 'nonauto', role: 'teacher'},
];

export async function authenticateUser(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = VALID_USERS.find(
        (user) =>
          user.email === email && user.password === password
      );
      if (user) {
        resolve({ email: user.email, role: user.role });
      } else {
        reject(new Error('Invalid email or password.'));
      }
    }, 800);
  });
}