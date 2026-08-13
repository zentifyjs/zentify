import { Purpose, ZentifyResponsePayload } from "../types";

export function redirect(url: string, status: number = 302): ZentifyResponsePayload {
    return {
        __isZentifyResponse: true,
        purpose: Purpose.redirect,
        payload: { url, status }
    }
}