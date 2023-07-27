import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { DomruTypes } from "./index.js";
import { errorMsg } from "./utils.js";

export interface DomruHandlers {
    get: () => Promise<DomruTypes.Token>;
    set: (token: DomruTypes.Token) => Promise<any>;
}

export class DomruAPI {
    #instance: AxiosInstance;
    #handlers: DomruHandlers;
    #storage?: DomruTypes.Token;
    
    constructor(handlers?: DomruHandlers) {
        this.#handlers = handlers ?? {
            get: async () => this.#storage ?? {},
            set: async token => this.#storage = token
        } as DomruHandlers;

        this.#instance = axios.create({ baseURL: 'https://myhome.proptech.ru' });
        this.#instance.interceptors.request.use(async config => {
            const token = await this.#handlers.get();
            const operatorId = token.operatorId;
            const accessToken = token.accessToken;

            if (operatorId && accessToken) {
                config.headers.set('Operator', String(operatorId));
                config.headers.set('Authorization', `Bearer ${accessToken}`);
            }

            return config;
        });

        axiosRetry(this.#instance, {
            retries: Infinity,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: error =>
                axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                error.response?.status === 401,

            onRetry: async (retry, error) => {
                if (error.response?.status !== 401) return;

                const token = await this.#handlers.get();
                const operatorId = token.operatorId;
                const refreshToken = token.refreshToken;

                if (retry >= 3 || !operatorId || !refreshToken)
                    throw new Error('Требуется повторная авторизация');

                await this.#refreshToken(operatorId, refreshToken);
            },
        });
    }

    async #updateToken(token: DomruTypes.Token) {
        await this.#handlers.set(token);
        return token;
    }

    async #refreshToken(operatorId: number, refreshToken: string) {
        const headers = {
            Bearer: refreshToken,
            Operator: String(operatorId)
        };

        return await axios
            .get('https://myhome.proptech.ru/auth/v2/session/refresh', { headers })
            .then(res => this.#updateToken(res.data));
    }

    async getAccounts(phone: number) {
        const validateStatus = (status: number) =>
            status === 200 || status === 300;
        
        return await this.#instance
            .get(`/auth/v2/login/${phone}`, { validateStatus })
            .then(res => res.data as DomruTypes.Accounts)
            .catch(errorMsg({
                204: 'Нет договоров',
                400: 'Неверный номер телефона'
            }));
    }

    async authSendCode(phone: number, account: any) {
        await this.#instance
            .post(`/auth/v2/confirmation/${phone}`, account)
            .catch(errorMsg({
                400: 'Неверный аккаунт'
            }));
    }

    async authWithCode(phone: number, account: any, code: number) {
        const payload = {
            operatorId: account.operatorId,
            subscriberId: account.subscriberId,
            accountId: account.accountId,
            login: String(phone),
            confirm1: String(code),
        };

        return await this.#instance
            .post(`/auth/v2/auth/${phone}/confirmation`, payload)
            .then(res => this.#updateToken(res.data))
            .catch(errorMsg({
                403: 'Неверный код подтверждения',
                409: 'Неверный аккаунт'
            }));
    }

    async getSubscriberPlaces(placeId?: number) {
        const params = { placeId };
        const config = placeId !== undefined && { params } || undefined;

        return await this.#instance
            .get('/rest/v2/subscriberplaces', config)
            .then(res => res.data.data as DomruTypes.SubscriberPlaces);
    }

    async getForpostCameras() {
        return await this.#instance
            .get('/rest/v1/forpost/cameras')
            .then(res => res.data.data as DomruTypes.ForpostCameras);
    }

    async getForpostCameraSnapshot(cameraId: number) {
        const config: AxiosRequestConfig = { responseType: 'stream' };

        return await this.#instance
            .get(`/rest/v1/forpost/cameras/${cameraId}/snapshots`, config)
            .then(res => res.data)
            .catch(errorMsg({
                500: 'Неверная камера'
            }));
    }

    async getForpostCameraVideo(cameraId: number) {
        const params = { LightStream: 0, Speed: -1.0 };

        return await this.#instance
            .get(`/rest/v1/forpost/cameras/${cameraId}/video`, { params })
            .then(res => res.data.data as DomruTypes.ForpostCameraVideo)
            .catch(errorMsg({
                500: 'Неверная камера'
            }));
    }

    async getAccessControls(placeId: number) {
        return await this.#instance
            .get(`/rest/v1/places/${placeId}/accesscontrols`)
            .then(res => res.data.data as DomruTypes.AccessControls)
            .catch(errorMsg({
                403: 'Неверное место'
            }));
    }

    async getAccessControlSnapshot(placeId: number, acId: number) {
        const config: AxiosRequestConfig = { responseType: 'stream' };

        return await this.#instance
            .get(`/rest/v1/places/${placeId}/accesscontrols/${acId}/snapshots`, config)
            .then(res => res.data);
    }

    async getAccessControlSipdevice(placeId: number, acId: number, installationId: string) {
        const payload = { installationId };
        
        return await this.#instance
            .post(`/rest/v1/places/${placeId}/accesscontrols/${acId}/sipdevices`, payload)
            .then(res => res.data.data as DomruTypes.SipDevice)
            .catch(errorMsg({
                500: 'Неверное место или устройство доступа'
            }));
    }

    async setAccessControlAction(placeId: number, acId: number, action: string) {
        const payload = { name: action };

        await this.#instance
            .post(`/rest/v1/places/${placeId}/accesscontrols/${acId}/actions`, payload)
            .catch(errorMsg({
                400: 'Неверное действие',
                500: 'Неверное место или устройство доступа'
            }));
    }
}