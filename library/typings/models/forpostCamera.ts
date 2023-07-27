export type ForpostCamera = {
    ID:                 number
    Name:               string
    IsActive:           number
    IsSound:            number
    RecordType:         number
    Quota:              number
    MaxBandwidth:       number | null
    HomeMode:           number
    Devices:            any
    ParentGroups:       ForpostCameraParentGroups
    State:              number
    TimeZone:           number
    MotionDetectorMode: 'UNKNOWN'
    ParentID:           string
}

export type ForpostCameras = ForpostCamera[]

export type ForpostCameraParentGroup = {
    ID:       number
    Name:     string
    ParentID: number | null
}

export type ForpostCameraParentGroups = ForpostCameraParentGroup[]

export type ForpostCameraVideo = {
    URL:       string
    Error:     string | null
    ErrorCode: number | null
    Status:    string | null
}