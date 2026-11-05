export const baseUrl: string = 'http://localhost:5000/api/v1'
export const token: any = localStorage.getItem('token')
export const authTokenHeader: object = { Authorization: `Bearer ${token}` }