import { DomruApi } from "../api";

export class DomruCamera {
    private _api: DomruApi;
    private _id: number;
    
    constructor(api: DomruApi, id: number) {
        this._api = api;
        this._id = id;
    }

    async getInformation() {
        return await this._api.getForpostCameras()
            .then(cameras => {
                const camera = cameras.find(c => c.ID === this._id);
                if (!camera) throw new Error('Нет камеры');
                return camera;
            });
    }

    async getSnapshot() {
        return await this._api.getForpostCameraSnapshot(this._id);
    }

    async getVideoUrl() {
        return await this._api.getForpostCameraVideo(this._id);
    }
}