import { DomruApi } from "../api";
import { DomruTypes } from "../types";
import { DomruCamera } from "./camera";

export class DomruAccessControl {
    private _api: DomruApi;
    private _placeId: number;
    private _accessControlId: number;
    private _cache?: DomruTypes['subscriberPlace']['place']['accessControls'][0];
    
    constructor(api: DomruApi, placeId: number, accessControlId: number) {
        this._api = api;
        this._placeId = placeId;
        this._accessControlId = accessControlId;
    }

    async getInformation() {
        if (this._cache) return this._cache;

        return await this._api.getSubscriberPlaces()
            .then(places => {
                const place = places.find(place => place.place.id === this._placeId);
                if (!place) throw new Error('Нет места');

                const accessControl = place.place.accessControls
                    .find(accessControl => accessControl.id === this._accessControlId);
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
        await this._api.accessControlAction(this._placeId, this._accessControlId, 'accessControlOpen');
    }
}