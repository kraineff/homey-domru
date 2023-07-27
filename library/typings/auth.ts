export type Token = {
    operatorId:       number
    operatorName:     string
    tokenType:        string | null
    accessToken:      string
    expiresIn:        number | null
    refreshToken:     string
    refreshExpiresIn: number | null
}

export type Account = {
    operatorId:   number
    subscriberId: number
    accountId:    string | null
    placeId:      number
    address:      string
    profileId:    string | null
}

export type Accounts = Account[]