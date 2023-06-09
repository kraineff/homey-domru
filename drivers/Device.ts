import Homey from 'homey';
import DomruApp from "../app";

module.exports = class DomruDevice extends Homey.Device {
    private _image?: Homey.Image;
    private _openDuration!: number;
    
    async onInit() {
        const app = this.homey.app as DomruApp;

        this._openDuration = this.getSetting('open_duration');
    }

    async onDeleted() {
        if (this._image)
            await this._image.unregister();
    }

    // async onSettings({ oldSettings, newSettings, changedKeys }) {
    //     if (changedKeys.includes('open_duration'))
    //         this._openDuration = newSettings.open_duration;
    // }
}