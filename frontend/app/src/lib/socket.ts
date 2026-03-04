//only connect socket after user is authenticated token shoudl be valid and will be validated in teh backend with teh token

import { io } from 'socket.io-client';

export const createSocket = (token: string) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const SOCKET_URL = API_URL.startsWith("http") ? new URL(API_URL).origin : window.location.origin;
    return io(SOCKET_URL, {
        auth: { token }
    });
}