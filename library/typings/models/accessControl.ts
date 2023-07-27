export type AccessControl = {
    id:                     number
    operatorId:             number
    name:                   string
    forpostGroupId:         string
    forpostAccountId:       string | null
    type:                   'SIP'
    allowOpen:              boolean
    openMethod:             'ACCESS_CONTROL'
    allowVideo:             boolean
    allowCallMobile:        boolean
    allowSlideshow:         boolean
    previewAvailable:       boolean
    videoDownloadAvailable: boolean
    timeZone:               number
    quota:                  number
    externalCameraId:       string
    externalDeviceId:       string | null
    entrances:              any[]
}

export type AccessControls = AccessControl[]

export type SipDevice = {
    id:       string
    realm:    string
    login:    string
    password: string
}