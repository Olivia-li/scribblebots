import axios from 'axios'

const setCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content')
}

const axiosConfigs = {
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    common: {
      'X-CSRF-Token': setCsrfToken(),
    },
  },
}

const api = axios.create(axiosConfigs)

export default api
