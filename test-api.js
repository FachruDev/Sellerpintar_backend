import fetch from 'node-fetch';

async function testRegister() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'password123',
      }),
    });
    
    const data = await response.json();
    console.log('Register response:', data);
    return data;
  } catch (error) {
    console.error('Error testing register:', error);
  }
}

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    return data;
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

async function testCreateProject(token) {
  try {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Project',
      }),
    });
    
    const data = await response.json();
    console.log('Create project response:', data);
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
  }
}

async function runTests() {
  // const registerData = await testRegister();
  const loginData = await testLogin();
  
  if (loginData && loginData.token) {
    await testCreateProject(loginData.token);
  }
}

runTests(); 