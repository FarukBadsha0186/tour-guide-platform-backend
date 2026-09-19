
// src/lib/redis.ts

import { createClient } from 'redis';
import config from '../config';

export const redisclient = createClient({
    username: config.redis_user,
    password: config.redis_password,
    socket: {
        host: config.redis_host,
        port: Number(config.redis_port),
    }
});

// ===== CONNECT FUNCTION =====
export const connectRedis = async (): Promise<void> => {
    try {
        await redisclient.connect();
        console.log("🔴 Redis connected successfully");
    } catch (error) {
        console.error("Failed to connect Redis:", error);
        throw error;
    }
};

// ===== EVENT HANDLERS =====
redisclient.on("error", (error) => {
    console.error("🔴 Redis error:", error);
});

redisclient.on("end", () => {
    console.log("🔴 Redis disconnected");
});

// ===== HELPERS =====
export const RedisHelpers = {
    set: async (key: string, value: string, options?: { expiration: { type: "EX"; value: number } }) => {
        if (options) {
            await redisclient.set(key, value, {
                EX: options.expiration.value,
            });
        } else {
            await redisclient.set(key, value);
        }
    },

    get: async (key: string): Promise<string | null> => {
        return await redisclient.get(key);
    },

    del: async (key: string): Promise<number> => {
        return await redisclient.del(key);
    },

    exists: async (key: string): Promise<boolean> => {
        const result = await redisclient.exists(key);
        return result === 1;
    },

    ttl: async (key: string): Promise<number> => {
        return await redisclient.ttl(key);
    },
};

export default { redisclient, connectRedis, RedisHelpers };