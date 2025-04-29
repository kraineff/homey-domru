import crypto from "crypto";
import EventEmitter from "events";
import wretch from "wretch";
import { retry } from "wretch/middlewares";
import type { DomruAccessControl, DomruContract, DomruForpostCamera, DomruSubscriberPlace, DomruToken } from "./types/index.js";
import { fetch, FormData } from "node-fetch-native";

const errorMsg = (message: string) => () => { throw new Error(message) };

export type DomruStorage = {
    deviceId?: string;
    token?: DomruToken;
}

export class DomruAPI {
    private storage?: DomruStorage;
    readonly events: EventEmitter;

    constructor() {
        this.events = new EventEmitter();
    }

    request(placeId?: number) {
        return wretch("https://myhome.proptech.ru")
            .polyfills({ fetch, FormData })
            .middlewares([
                next => (url, options) => {
                    if (!!this.storage?.token && !!this.storage?.deviceId && !url.includes("/auth/v2/login/")) {
                        const { deviceId, token: { operatorId, accessToken, refreshToken } } = this.storage;

                        options.headers = {
                            ...options.headers,
                            ...(url.includes("/auth/v2/session/refresh") ?
                                { Bearer: refreshToken } :
                                { Authorization: `Bearer ${accessToken}` }),
                            Operator: String(operatorId),
                            "User-Agent": `iPhone16,2 | iOS 18.5 | erth | 8.6.11 (build 2) | _ | ${operatorId} | ${deviceId} | ${placeId}`
                        }
                    }
                    return next(url, options);
                },
                retry({
                    maxAttempts: 3,
                    retryOnNetworkError: true,
                    until: (response) => !!response && (response.ok || response.status === 300 || (response.status >= 400 && response.status < 500)),
                    onRetry: async (context) => {
                        if (context.response?.status === 401) await this.authRefreshToken();
                        return context;
                    },
                    skip: (url) => url.includes("/auth/v2/session/refresh")
                })
            ])
            .resolve(resolver => {
                return resolver
                    .error(400, error => { throw Error(error.json?.errorMessage || "Неверный запрос") })
                    .error(401,    () => { throw Error("Нет токена") })
                    .error(403, error => { throw Error(error.json?.errorMessage || error.message) });
            });
    }

    async authWithStorage(storage: DomruStorage) {
        this.storage = {
            ...storage,
            deviceId: storage.deviceId || crypto.randomUUID().toUpperCase()
        };
        this.events.emit("storage_update", this.storage);
        return storage.token!;
    }

    private async authRefreshToken() {
        return this.request()
            .get("/auth/v2/session/refresh")
            .error(409, errorMsg("Неверный токен"))
            .json<DomruToken>()
            .then(token => this.authWithStorage({ ...this.storage, token }))
            .catch(() => this.authWithStorage({ ...this.storage, token: undefined }));
    }

    async authGetContracts(phone: string) {
        return this.request()
            .get(`/auth/v2/login/${phone}`)
            .error(300, error => error.json)
            .json<DomruContract[]>()
            .then(res => res || []);
    }

    async authGetCode(phone: string, contract: DomruContract) {
        await this.request()
            .post(contract, `/auth/v2/confirmation/${phone}`)
            .text();
    }

    async authWithCode(phone: string, contract: DomruContract, code: string) {
        return this.request()
            .post({
                operatorId: contract.operatorId,
                accountId: contract.accountId,
                profileId: contract.profileId,
                subscriberId: contract.subscriberId,
                login: phone,
                confirm1: code,
            }, `/auth/v3/auth/${phone}/confirmation`)
            .error(409, errorMsg("Неверный договор"))
            .json<DomruToken>()
            .then(token => this.authWithStorage({ ...this.storage, token }));
    }

    async authWithPassword(login: string, password: string) {
        const date = new Date();
        const timestamp = date.toISOString();
        const timestampShort = timestamp.slice(0, 19).replace(/[-T:]/g, "");

        const hash1 = crypto.createHash("sha256").update(password).digest("base64url");
        const hash2 = crypto.createHash("md5")
           .update(["DigitalHomeNTK", "password", login, password, timestampShort, "789sdgHJs678wertv34712376"].join(""))
           .digest("hex")
           .toUpperCase();
        
        return this.request()
           .post({ login, timestamp, hash1, hash2 }, `/auth/v2/auth/${login}/password`)
           .json<DomruToken>()
           .then(token => this.authWithStorage({ ...this.storage, token }));
    }

    async getSubscriberPlaces(placeId?: number) {
        return this.request(placeId)
            .get("/rest/v3/subscriber-places")
            .json<DomruSubscriberPlace[]>(res => res.data);
    }

    async getAccessControls(placeId: number) {
        return this.request(placeId)
            .get(`/rest/v1/places/${placeId}/accesscontrols`)
            .json<DomruAccessControl[]>(res => res.data);
    }

    async setAccessControlAction(placeId: number, accessControlId: number, action: string) {
        await this.request(placeId)
            .post({ name: action }, `/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/actions`)
            .error(500, errorMsg("Неверное место или устройство доступа"))
            .text();
    }

    async getAccessControlSipdevice(placeId: number, accessControlId: number) {
        const installationId = this.storage?.deviceId;
        return this.request(placeId)
            .post({ installationId }, `/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/sipdevices`)
            .json();
    }

    async getAccessControlSnapshot(placeId: number, accessControlId: number, entranceId?: number, width?: number, height?: number) {
        return this.request(placeId)
            .get(`/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/snapshots`)
            .blob();
    }

    async getForpostCameras(placeId?: number) {
        return this.request(placeId)
            .get("/rest/v1/forpost/cameras")
            .json<DomruForpostCamera[]>(res => res.data);
    }

    async getForpostCameraSnapshot(forpostCameraId: number, placeId?: number) {
        return this.request(placeId)
            .get(`/rest/v1/forpost/cameras/${forpostCameraId}/snapshots`)
            .error(500, errorMsg("Неверная камера"))
            .blob();
    }

    async getForpostCameraVideo(forpostCameraId: number, placeId?: number) {
        return this.request(placeId)
            .get(`/rest/v1/forpost/cameras/${forpostCameraId}/video?LightStream=0`)
            .error(500, errorMsg("Неверная камера"))
            .json<string>(res => res.data.URL);
    }
}