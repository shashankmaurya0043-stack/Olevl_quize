import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PWD_KEY = "olevel_admin_pwd_v1";

export const getAdminPwd = () => {
  try {
    return localStorage.getItem(PWD_KEY) || "";
  } catch {
    return "";
  }
};

export const setAdminPwd = (v) => {
  try {
    localStorage.setItem(PWD_KEY, v);
  } catch {
    /* ignore */
  }
};

export const clearAdminPwd = () => {
  try {
    localStorage.removeItem(PWD_KEY);
  } catch {
    /* ignore */
  }
};

const authHeaders = () => ({ "X-Admin-Password": getAdminPwd() });

export async function adminAuth(password) {
  const res = await axios.post(`${API}/admin/auth`, { password });
  return res.data;
}

export async function adminParse(mode, content) {
  const res = await axios.post(
    `${API}/admin/parse`,
    { mode, content },
    { headers: authHeaders(), timeout: 120000 }
  );
  return res.data;
}

export async function adminSave(subject_code, questions) {
  const res = await axios.post(
    `${API}/admin/save`,
    { subject_code, questions },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function adminList(subject) {
  const res = await axios.get(`${API}/admin/list`, {
    headers: authHeaders(),
    params: subject ? { subject } : {},
  });
  return res.data;
}

export async function adminDelete(qid) {
  const res = await axios.delete(`${API}/admin/question/${qid}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function adminStats() {
  const res = await axios.get(`${API}/admin/stats`, { headers: authHeaders() });
  return res.data;
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
