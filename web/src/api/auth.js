import axios from 'axios/index'

const API_ROOT_URL = process.env.API_ROOT_URL

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

const odaAxios = axios.create({ baseURL: API_ROOT_URL })

export async function whoami () {
  const response = await odaAxios.get('/odaweb/api/user/who_am_i/', { })
  return response.data
}

export async function signup (username, email, password1, password2) {
  const response = await odaAxios.post('/odaweb/auth/registration/', {
    username, email, password1, password2
  })
  return response.data
}

export async function login (username, password) {
  const response = await odaAxios.post('/odaweb/auth/login/', {
    username, password
  })
  return response.data
}

export async function reset (email) {
  const response = await odaAxios.post('/odaweb/auth/password/reset/', {
    email
  })
  return response.data
}

export async function logout () {
  const response = await odaAxios.post('/odaweb/auth/logout/')
  return response.data
}
