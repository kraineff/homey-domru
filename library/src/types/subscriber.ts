import { DomruPlace } from "./index.js";

export type DomruSubscriber = {
    id: number;
    name: string;
    accountId: string | null;
    nickName: string | null;
};

export type DomruSubscriberProfile = {
    subscriber: DomruSubscriber;
    pushUserId: string;
    callSelectedPlaceOnly: boolean;
    subscriberPhones: Array<{
        id: number;
        number: string;
        numberValid: boolean;
    }>;
    checkPhoneForSvcActivation: boolean;
    allowAddPhone: boolean;
};

export type DomruSubscriberFinances = {
    balance: number;
    blockType: "NOT_BLOCKED";
    amountSum: number;
    targetDate: string;
    paymentLink: string | null;
    daysToBlock: null;
    daysToWarning: null;
    blocked: boolean;
};

export type DomruSubscriberPlace = {
    id: number;
    subscriberType: "owner" | "guest";
    subscriberState: "in";
    place: DomruPlace;
    subscriber: DomruSubscriber;
    guardCallOut: {
        active: boolean;
        phoneNumber: string;
    } | null;
    payment: {
        useLink: boolean;
    };
    provider: string;
    blocked: boolean;
}