import { ManagerSettings } from 'homey/lib/Homey';

type StorageHandlers<C> = {
    get: () => Promise<C>;
    set: (content: C) => Promise<void>
};

type InitParams<C, P> = (storage: StorageHandlers<C>) => Promise<P>;

type AccountsParams<C, P> = {
    settings: ManagerSettings;
    initParams: InitParams<C, P>;
};

export class Accounts<C, P> {
    private _settings: ManagerSettings;
    private _initParams: InitParams<C, P>;

    private _accounts: {
        [accountId: string]: { id: string } & P & { storage: StorageHandlers<C> };
    };

    constructor(params: AccountsParams<C, P>) {
        const { settings, initParams } = params;
        this._settings = settings;
        this._initParams = initParams;
        this._accounts = {};
    }

    private _getStorage() {
        try {
            let storage = this._settings.get('accounts') ?? {};
            if (typeof storage === 'string') storage = JSON.parse(storage);
            if (typeof storage === 'object' && !Array.isArray(storage)) return storage;
        } catch (e) {}
        return {};
    }

    private _setStorage(content: { [accountId: string]: C }) {
        this._settings.set('accounts', JSON.stringify(content))
    }

    private async _initAccounts() {
        const accounts = this._getStorage();
        const accountsIds = Object.keys(accounts);

        await Promise.all(
            accountsIds.map(async accountsId => {
                await this._initAccount(accountsId);
            })
        );
    }

    private async _initAccount(id: string) {
        if (this._accounts[id]) return;

        const storage: StorageHandlers<C> = {
            get: async () => {
                const accounts = this._getStorage();
                return accounts[id];
            },
            set: async content => {
                const accounts = this._getStorage();
                accounts[id] = content;
                this._setStorage(accounts);
            }
        };
        const accountContent = await storage.get();
        !accountContent && await storage.set({} as C);

        const params = await this._initParams(storage);
        this._accounts[id] = { id, ...params, storage };
    }

    async getAccounts() {
        await this._initAccounts();
        return this._accounts;
    }

    async getAccount(id: string) {
        const accounts = this._getStorage();
        if (!accounts[id])
            throw new Error('Нет аккаунта');

        await this._initAccount(id);
        return this._accounts[id];
    }

    async makeAccount() {
        const accounts = this._getStorage();
        const latestId = Object.keys(accounts).at(-1) ?? '-1';
        const accountId = String(Number(latestId) + 1);

        await this._initAccount(accountId);
        return this._accounts[accountId];
    }

    async deleteAccount(id: string) {
        const accounts = this._getStorage();
        delete accounts[id];
        delete this._accounts[id];
        this._setStorage(accounts);
    }
}