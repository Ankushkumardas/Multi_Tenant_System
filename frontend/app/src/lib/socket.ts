//only connect socket after user is authenticated token shoudl be valid and will be validated in teh backend with teh token

import { io } from 'socket.io-client';

export const createSocket = (token: string) => {
    const isProduction = !window.location.hostname.includes("localhost");
    const API_URL = import.meta.env.VITE_API_URL || "/api";

    let SOCKET_URL = window.location.origin;
    if (!isProduction && API_URL.startsWith("http")) {
        SOCKET_URL = new URL(API_URL).origin;
    }

    return io(SOCKET_URL, {
        auth: { token }
    });
};
