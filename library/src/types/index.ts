export * from "./accessControl.js";
export * from "./forpostCamera.js";
export * from "./subscriber.js";

export type DomruContract = {
    operatorId: number;
    accountId: string;
    address: string;
    profileId: string;
    subscriberId: number;
    placeId: number;
};

export type DomruLoginContract = {
    login: string;
    timestamp: string;
    hash1: string;
    hash2: string;
};

export type DomruLoginPhone = {
    operatorId: number;
    login: string;
    accountId: string;
    profileId: string;
    confirm1: string;
    confirm2: string;
    subscriberId: string;
};

export type DomruGuestAuth = {
    phoneNumber: string;
    authCode: string;
    subscriberInvite: {
        uuid: string;
        placeId: number;
    };
    name: string;
    invitationSendType: "INVITATION_QR_CODE" | "INVITATION_SMS_LINK";
    appId: number;
    requestSms: boolean;
};

export type DomruGuestToken = {
    phoneNumber: string;
    contractAddress: DomruContract;
    confirm: string;
};

export type DomruToken = {
    operatorId: number;
    operatorName: string;
    tokenType: string | null;
    accessToken: string;
    expiresIn: number | null;
    refreshToken: string;
    refreshExpiresIn: number | null;
};

export type DomruPlace = {
    id: number;
    address: {
        index: string | null;
        region: string | null;
        district: string | null;
        city: string | null;
        locality: string | null;
        street: string | null;
        house: string | null;
        building: string | null;
        apartment: string | null;
        visibleAddress: string;
        groupName: string;
    };
    location: {
        longitude: number;
        latitude: number;
    };
    autoArmingState: boolean;
    autoArmingRadius: number;
};