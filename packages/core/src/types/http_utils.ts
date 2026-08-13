export type PurposeType = "redirect" | "view" | "json";

export const Purpose: Record<PurposeType, PurposeType> =  {
    redirect: "redirect",
    view: "view",
    json: "json",
} as const;

export interface ZentifyResponsePayload {
    __isZentifyResponse: true;
    purpose: PurposeType;
    payload: any;
}