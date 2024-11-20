import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001'
});

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData);
};

export const getEvents = () => api.get('/events');