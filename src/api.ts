import axios from 'axios';
export const api=axios.create({baseURL:'/api'});
api.interceptors.request.use(config=>{const token=localStorage.getItem('studek_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401){localStorage.removeItem('studek_token');if(location.pathname!='/login')location.href='/login';}return Promise.reject(e);});
export const errorMessage=(error:any)=>error?.response?.data?.message||error?.message||'Não foi possível concluir a ação.';
