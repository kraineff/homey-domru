export type DomruForpostCamera = {
    ID: number;
    Name: string;
    IsActive: number;
    IsSound: number;
    RecordType: number;
    Quota: number;
    MaxBandwidth: number | null;
    HomeMode: number;
    Devices: any;
    ParentGroups: Array<{
        ID: number;
        Name: string;
        ParentID: number | null;
    }>;
    State: number;
    TimeZone: number;
    MotionDetectorMode: "UNKNOWN";
    ParentID: string;
};

export type DomruForpostCameraVideo = {
    URL: string;
    Error: string | null;
    ErrorCode: number | null;
    Status: string | null;
};