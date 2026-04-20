import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const getSubjects = () => api.get("/subjects").then((r) => r.data);
export const getMockInfo = () => api.get("/mock-test-info").then((r) => r.data);
export const startQuiz = (code) =>
  api.get(`/quiz/start/${code}`).then((r) => r.data);
export const submitQuiz = (payload) =>
  api.post(`/quiz/submit`, payload).then((r) => r.data);
