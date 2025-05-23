import crypto from "crypto";
import EventEmitter from "events";
import wretch from "wretch";
import { retry } from "wretch/middlewares";
import { fetch } from "node-fetch-native";
import type { DomruAccessControl, DomruContract, DomruForpostCamera, DomruSubscriberPlace, DomruToken } from "./types/index.js";

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
            .polyfills({ fetch })
            .middlewares([
                next => (url, options) => {
                    if (!!this.storage?.token && !!this.storage?.deviceId && !url.includes("/auth/v2/login/")) {
                        const { deviceId } = this.storage;
                        const { operatorId, accessToken, refreshToken } = this.storage.token;

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
                    skip: (url) => url.includes("/auth/v2/session/refresh"),
                    until: (response) => {
                        if (!response) return false;
                        if (response.ok || response.status === 300) return true;
                        if (response.status >= 400 && response.status < 500 && response.status !== 401) return true;
                        return false;
                    },
                    onRetry: async (context) => {
                        if (context.response?.status === 401) await this.authRefreshToken();
                        return context;
                    }
                })
            ]);
    }

    async authWithStorage(storage: DomruStorage) {
        this.storage = {
            ...storage,
            deviceId: storage.deviceId || crypto.randomUUID().toUpperCase(),
        };
        this.events.emit("storage_update", this.storage);
        return storage.token!;
    }

    private async authRefreshToken() {
        return this.request()
            .get("/auth/v2/session/refresh")
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
            .text();
    }

    async getAccessControlSipdevice(placeId: number, accessControlId: number) {
        const installationId = this.storage?.deviceId;
        return this.request(placeId)
            .post({ installationId }, `/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/sipdevices`)
            .json<{
                id: string;
                realm: string;
                login: string;
                password: string;
            }>(res => res.data);
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
            .blob();
    }

    async getForpostCameraVideo(forpostCameraId: number, placeId?: number) {
        return this.request(placeId)
            .get(`/rest/v1/forpost/cameras/${forpostCameraId}/video?LightStream=0`)
            .json<string>(res => res.data.URL);
    }
}