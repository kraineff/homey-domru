import Homey from "homey";
import { DomruAPI } from "domru";

export default class DomruApp extends Homey.App {
    readonly api = new DomruAPI();

    async onInit() {
        const token = this.homey.settings.get("token");
        token && await this.api.authWithToken(JSON.parse(token));

        this.api.events.on("token_update", token => {
            console.debug("Токен обновлен", token);
            this.homey.settings.set("token", JSON.stringify(token));
        });

        this.api.events.on("token_invalid", () => {
            console.debug("Токен устарел");
            this.homey.settings.unset("token");
        });
    }
}

module.exports = DomruApp;