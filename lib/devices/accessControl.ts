import { DomruApi } from "../api";
import { DomruTypes } from "../types";
import { DomruCamera } from "./camera";

export class DomruAccessControl {
    private _api: DomruApi;
    private _id: number;
    private _cache?: any;
    
    constructor(api: DomruApi, id: number) {
        this._api = api;
        this._id = id;
    }

    async getInformation(): Promise<DomruTypes['subscriberPlace']['place']['accessControls'][0] & { placeId: number }> {
        if (this._cache) return this._cache;

        return await this._api.getSubscriberPlaces()
            .then(places => {
                const accessControl = places
                    .map(({ place }) => place)
                    .map(({ id, accessControls }) =>
                        accessControls.map(accessControl => ({ ...accessControl, placeId: id }))).flat()
                    .find(accessControl => accessControl.id === this._id);

                if (!accessControl) throw new Error('Нет устройства доступа');
                this._cache = accessControl;
                return accessControl;
            });
    }

    async getCamera() {
        const { forpostGroupId } = await this.getInformation();

        return await this._api.getForpostCameras()
            .then(cameras => {
                const camera = cameras.find(camera => camera.ParentGroups.find(group => group.ID === +forpostGroupId));
                if (!camera) throw new Error('Нет камеры');
                return new DomruCamera(this._api, camera.ID);
            });
    }

    async open() {
        const { placeId } = await this.getInformation();

        await this._api.accessControlAction(placeId, this._id, 'accessControlOpen');
    }
}