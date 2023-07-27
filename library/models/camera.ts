import { DomruAPI, DomruTypes } from "..";

export class DomruCamera {
    #api: DomruAPI;
    #cameraId: number;
    #cache?: DomruTypes.ForpostCamera;

    constructor(api: DomruAPI, cameraId: number) {
        this.#api = api;
        this.#cameraId = cameraId;
    }

    async getDetails(force: boolean = false) {
        if (this.#cache === undefined || force) {
            this.#cache = await this.#api
                .getForpostCameras()
                .then(cameras => {
                    const camera = cameras.find(с => с.ID === this.#cameraId);
                    if (camera) return camera;
                    throw new Error('Камера недоступна');
                });
        }

        return this.#cache;
    }

    async getSnapshot() {
        return await this.#api.getForpostCameraSnapshot(this.#cameraId);
    }

    async getVideoURL() {
        const response = await this.#api.getForpostCameraVideo(this.#cameraId);
        return response.URL;
    }
}