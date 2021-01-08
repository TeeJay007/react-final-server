/**
 * @jest-environment node
 */
const axios = require('axios')

const register = async (username, password) => {
    return (await axios({
        method: 'post',
        url: 'http://localhost:3000/register',
        data: {
          username,
          password
        }
    })).data
}

const login = async (username, password) => {
    return (await axios({
        method: 'post',
        url: 'http://localhost:3000/login',
        data: {
          username,
          password
        }
    })).data
}

test('user registration no username', async () => {
    expect.assertions(2)
    const response = await register("", "password")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user registration no password', async () => {
    expect.assertions(2)
    const response = await register("username", "")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user registration no username no password', async () => {
    expect.assertions(2)
    const response = await register("", "")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user registration fail with short username', async () => {
    expect.assertions(2)
    const response = await register("asd", "password")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user registration fail with short password', async () => {
    expect.assertions(2)
    const response = await register("username", "asd")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user registration', async () => {
    expect.assertions(2)
    const response = await register("username", "password")
    expect(response.success).toBe(true)
    expect(response.token).not.toBeNull()
});

test('user login no username', async () => {
    expect.assertions(2)
    const response = await login("", "password")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user login no password', async () => {
    expect.assertions(2)
    const response = await login("username", "")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user login no username no password', async () => {
    expect.assertions(2)
    const response = await login("", "")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user login success', async () => {
    expect.assertions(2)
    const response = await login("username", "password")
    expect(response.success).toBe(true)
    expect(response.token).not.toBeNull()
});

test('user register with same credentials fail', async () => {
    expect.assertions(2)
    const response = await register("username", "password")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('user login fail with bad credentials', async () => {
    expect.assertions(2)
    const response = await login("username", "passworda")
    expect(response.success).toBe(false)
    expect(response.error).not.toBeNull()
});

test('get user token', async () => {
    expect.assertions(1)
    const response = await login("username", "password")
    expect(response.token).not.toBeNull()
});