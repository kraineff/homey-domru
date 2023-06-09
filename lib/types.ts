export type DomruTypes = {
    loginAccount: LoginAccount;
    loginAccounts: Array<LoginAccount>;
    subscriberPlace: SubscriberPlace;
    subscriberPlaces: Array<SubscriberPlace>;
    forpostCamera: ForpostCamera;
    forpostCameras: Array<ForpostCamera>;
    forpostCameraVideo: ForpostCameraVideo;
    accessControlAction: AccessControlAction;
};

type LoginAccount = {
    operatorId: number;
    subscriberId: number;
    accountId: string | null;
    placeId: number;
    address: string;
    profileId: string | null;
}

type SubscriberPlace = {
    id: number;
    subscriberType: "owner" | "guest";
    subscriberState: string;
    place: {
        id: number;
        address: {
            kladrAddress: {
                index: string | null;
                region: string | null;
                district: string | null;
                city: string | null;
                locality: string | null;
                street: string | null;
                house: string | null;
                building: string | null;
                apartment: string | null;
            };
            kladrAddressString: string;
            visibleAddress: string;
            groupName: string;
        };
        location: {
            longitude: number;
            latitude: number;
        };
        autoArmingState: boolean;
        autoArmingRadius: number;
        previewAvailable: boolean;
        videoDownloadAvailable: boolean;
        controllers: any[];
        accessControls: {
            id: number;
            name: string;
            forpostGroupId: string;
            forpostAccountId: string | null;
            type: string;
            allowOpen: boolean;
            allowVideo: boolean;
            allowCallMobile: boolean;
            entrances: any[];
        }[];
        cameras: any[];
    };
    subscriber: {
        id: number;
        name: string;
        accountId: string;
        nickName: string | null;
    };
    guardCallOut: any | null;
    payment: {
        useLink: boolean;
    };
    blocked: boolean;
};

type ForpostCamera = {
    ID: number;
    Name: string;
    IsActive: number;
    IsSound: number;
    RecordType: number;
    Quota: number;
    MaxBandwidth: number | null;
    HomeMode: number;
    Devices: any;
    ParentGroups: {
        ID: number;
        Name: string;
        ParentID: number | null;
    }[];
    State: number;
    TimeZone: number;
    MotionDetectorMode: string;
    ParentID: string;
};

type ForpostCameraVideo = {
    URL: string;
    Error: string | null;
    ErrorCode: number | null;
    Status: string | null;
};

type AccessControlAction = 'accessControlOpen';