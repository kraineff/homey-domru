import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { DomruTypes } from './types';

export type DomruTokens = {
    operatorId: number;
    operatorName: string;
    tokenType: string;
    accessToken: string;
    expiresIn: number | null;
    refreshToken: string;
    refreshExpiresIn: number | null;
};

export type DomruStorage = {
    get: () => Promise<DomruTokens>;
    set: (content: DomruTokens) => Promise<void>;
};

function checkNumber(phone: string) {
    if (phone.length !== 11 || !['7', '8'].includes(phone.charAt(0)))
        throw new Error('Неверный номер телефона');
}

function withError(error: any, codes: any) {
    if (axios.isAxiosError(error)) {
        const errorCode = error.response?.status;
        const errorMessage = codes[String(errorCode)];
        if (errorMessage) throw new Error(errorMessage);
    }
    throw error;
}

export class DomruApi {
    private _instance: AxiosInstance;
    private _storage: DomruStorage;

    constructor(storage: DomruStorage) {
        this._storage = storage;
        this._instance = axios.create({ baseURL: 'https://api-mh.ertelecom.ru' });
        this._instance.interceptors.request.use(this._handleRequest);
        this._instance.interceptors.response.use(this._handleResponse);
        createAuthRefreshInterceptor(this._instance, this._handleRefresh);
    }

    private _handleRequest = async (req: InternalAxiosRequestConfig) => {
        const { accessToken, operatorId } = await this._storage.get();
        accessToken && req.headers.set('Authorization', `Bearer ${accessToken}`);
        operatorId && req.headers.set('Operator', String(operatorId));
        return req;
    };

    private _handleResponse = async (res: AxiosResponse) => {
        if (typeof res.data === 'object' && 'data' in res.data)
            res.data = res.data.data;
        return res;
    };

    private _handleRefresh = async (err: any) => {
        const { operatorId, refreshToken } = await this._storage.get();
        if (!operatorId || !refreshToken) throw err;

        await axios
            .get('https://api-mh.ertelecom.ru/auth/v2/session/refresh', {
                headers: { Bearer: refreshToken, Operator: String(operatorId) }
            }).then(this._setStorage);
    };

    private _setStorage = async (res: AxiosResponse) => {
        const content = res.data as DomruTokens;
        await this._storage.set(content);
    };

    async authGetAccounts(phone: string) {
        checkNumber(phone);

        const validateStatus = (status: number) =>
            status === 200 || status === 300;

        return await this._instance
            .get(`/auth/v2/login/${phone}`, { validateStatus })
            .then(res => res.data as DomruTypes['loginAccounts'])
            .catch(err => Promise.reject(withError(err, {
                204: 'Нет договоров',
                400: 'Неверный номер телефона'
            })));
    }

    async authSendCode(phone: string, account: DomruTypes['loginAccount']) {
        checkNumber(phone);

        await this._instance
            .post(`/auth/v2/confirmation/${phone}`, account)
            .catch(err => Promise.reject(withError(err, {
                400: 'Неверный аккаунт'
            })));
    }

    async authConfirm(phone: string, account: DomruTypes['loginAccount'], code: string) {
        checkNumber(phone);

        const { operatorId, subscriberId, accountId } = account;
        const data = {
            operatorId, subscriberId, accountId,
            login: phone, confirm1: code
        };
        
        return await this._instance
            .post(`/auth/v2/auth/${phone}/confirmation`, data)
            .then(this._setStorage)
            .catch(err => Promise.reject(withError(err, {
                403: 'Неверный код подтверждения',
                409: 'Неверный аккаунт'
            })));
    }

    async getSubscriberPlaces() {
        return await this._instance
            .get('/rest/v1/subscriberplaces')
            .then(res => res.data as DomruTypes['subscriberPlaces']);
    }

    async getForpostCameras() {
        return await this._instance
            .get('/rest/v1/forpost/cameras')
            .then(res => res.data as DomruTypes['forpostCameras']);
    }

    async getForpostCameraSnapshot(cameraId: number) {
        return await this._instance
            .get(`/rest/v1/forpost/cameras/${cameraId}/snapshots`, { responseType: 'stream' })
            .then(res => res.data)
            .catch(err => Promise.reject(withError(err, {
                500: 'Неверная камера'
            })));
    }

    async getForpostCameraVideo(cameraId: number) {
        return await this._instance
            .get(`/rest/v1/forpost/cameras/${cameraId}/video`)
            .then(res => res.data as DomruTypes['forpostCameraVideo'])
            .then(res => res.URL)
            .catch(err => Promise.reject(withError(err, {
                500: 'Неверная камера'
            })));
    }

    async accessControlAction(placeId: number, accessControlId: number, action: DomruTypes['accessControlAction']) {
        await this._instance
            .post(`/rest/v1/places/${placeId}/accesscontrols/${accessControlId}/actions`, { name: action })
            .catch(err => Promise.reject(withError(err, {
                400: 'Неверное действие',
                500: 'Неверное устройство доступа'
            })));
    }
}