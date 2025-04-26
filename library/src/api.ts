import EventEmitter from "events";
import wretch from "wretch";
import { retry } from "wretch/middlewares";
import type { DomruAccessControl, DomruContract, DomruForpostCamera, DomruSubscriberPlace, DomruToken } from "./types/index.js";

const errorMsg = (message: string) => () => { throw new Error(message) };

export class DomruAPI {
    private token?: DomruToken;
    readonly events: EventEmitter;

    constructor() {
        this.events = new EventEmitter();
    }

    get request() {
        return wretch("https://myhome.proptech.ru")
            .middlewares([
                next => (url, options) => {
                    if (this.token && !url.includes("/auth/v2/login/")) {
                        options.headers = {
                            ...options.headers,
                            ...(url.includes("/auth/v2/session/refresh") ?
                                { Bearer: this.token.refreshToken } :
                                { Authorization: `Bearer ${this.token.accessToken}` }),
                            Operator: String(this.token.operatorId),
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

    async authWithToken(token: DomruToken) {
        this.token = token;
        this.events.emit("token_update", token);
        return token;
    }

    private async authRefreshToken() {
        return this.request
            .get("/auth/v2/session/refresh")
            .error(409, errorMsg("Неверный токен"))
            .json<DomruToken>()
            .then(token => this.authWithToken(token))
            .catch(error => {
                this.token = undefined;
                this.events.emit("token_invalid");
                throw error;
            });
    }

    async authGetContracts(phone: string) {
        return this.request
            .get(`/auth/v2/login/${phone}`)
            .error(300, error => error.json)
            .json<DomruContract[]>()
            .then(res => res || []);
    }

    async authGetCode(phone: string, contract: DomruContract) {
        await this.request
            .post(contract, `/auth/v2/confirmation/${phone}`)
            .text();
    }

    async authWithCode(phone: string, contract: DomruContract, code: string) {
        return this.request
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
            .then(token => this.authWithToken(token));
    }

    async getSubscriberPlaces() {
        return this.request
            .get("/rest/v3/subscriber-places")
            .json<DomruSubscriberPlace[]>(res => res.data);
    }

    async getAccessControls(placeId: number) {
        return this.request
            .get(`/rest/v1/places/${placeId}/accesscontrols`)
            .json<DomruAccessControl[]>(res => res.data);
    }

    async setAccessControlAction(placeId: number, accessControlId: number, action: string) {
        await this.request
            .post({ name: action }, `/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/actions`)
            .error(500, errorMsg("Неверное место или устройство доступа"))
            .text();
    }

    async getAccessControlSnapshot(placeId: number, accessControlId: number, entranceId?: number, width?: number, height?: number) {
        return this.request
            .get(`/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/snapshots`)
            .blob();
    }

    async getForpostCameras() {
        return this.request
            .get("/rest/v1/forpost/cameras")
            .json<DomruForpostCamera[]>(res => res.data);
    }

    async getForpostCameraSnapshot(forpostCameraId: number) {
        return this.request
            .get(`/rest/v1/forpost/cameras/${forpostCameraId}/snapshots`)
            .error(500, errorMsg("Неверная камера"))
            .blob();
    }

    async getForpostCameraVideo(forpostCameraId: number) {
        return this.request
            .get(`/rest/v1/forpost/cameras/${forpostCameraId}/video?LightStream=0`)
            .error(500, errorMsg("Неверная камера"))
            .json<string>(res => res.data.URL);
    }
}