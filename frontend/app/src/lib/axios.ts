import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

//Request Interceptor
api.interceptors.request.use((config: any) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


//Responce Interceptor
api.interceptors.response.use((response: any) => {
    return response;
}, async (error) => {
    //error.cofig store teh url ,headers,body,method get post.... and so on all thi sis storesin teh error.config

    //this is like what wwe will get in eth error --->
//     {
//   message: "Request failed with status code 401",
//   config: {
//     url: "/api/acme/user/profile",
//     method: "get",
//     headers: {
//       Authorization: "Bearer old_token"
//     },
//     data: undefined
//   },
//   response: {
//     status: 401,
//     data: { message: "Unauthorized" }
//   }
// }
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest?._retry && !originalRequest?.url?.includes("/auth/refresh")) {
        originalRequest._retry = true;
        try {
            const response = await api.post("/auth/refresh", {});
            const { accessToken } = response.data;
            localStorage.setItem("token", accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        } catch (error) {
            localStorage.removeItem("token");
            window.location.href = "/login";
            return Promise.reject(error);
        }
    }
})