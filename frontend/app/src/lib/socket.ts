//only connect socket after user is authenticated token shoudl be valid and will be validated in teh backend with teh token

import { io } from 'socket.io-client';

export const createSocket = (token: string) => {
    return io(import.meta.env.VITE_API_URL, {
        auth: { token }
    });
}