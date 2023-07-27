import { DomruAPI, DomruCamera, DomruTypes } from "..";

export class DomruAccessControl {
    #api: DomruAPI;
    #placeId: number;
    #acId: number;
    #cache?: DomruTypes.AccessControl;

    constructor(api: DomruAPI, placeId: number, acId: number) {
        this.#api = api;
        this.#placeId = placeId;
        this.#acId = acId;
    }

    async getDetails(force: boolean = false) {
        if (this.#cache === undefined || force) {
            this.#cache = await this.#api
                .getAccessControls(this.#placeId)
                .then(accessControls => {
                    const accessControl = accessControls.find(ac => ac.id === this.#acId);
                    if (accessControl) return accessControl;
                    throw new Error('Устройства доступа недоступно');
                });
        }

        return this.#cache;
    }

    async getCamera() {
        const details = await this.getDetails();
        const cameraId = Number(details.externalCameraId);

        if (Number.isNaN(cameraId))
            throw new Error('Камера недоступна');

        return new DomruCamera(this.#api, cameraId);
    }

    async setOpen() {
        await this.#api.setAccessControlAction(this.#placeId, this.#acId, 'accessControlOpen');
    }
}