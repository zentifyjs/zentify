export function getEnv(key: string) {
    if (typeof __ZENTIFY_FRONTEND_ENV__ === "object" && __ZENTIFY_FRONTEND_ENV__ && key in __ZENTIFY_FRONTEND_ENV__) {
        return __ZENTIFY_FRONTEND_ENV__[key];
    }
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && key in metaEnv) return metaEnv[key];
    return undefined;
}