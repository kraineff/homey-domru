import { Place } from './place.js';

export type Subscriber = {
    id:        number
    name:      string
    accountId: string | null
    nickName:  string | null
}

// https://myhome.proptech.ru/rest/v1/subscribers/profiles
export type SubscriberProfile = {
    subscriber:            Subscriber
    pushUserId:            string
    callSelectedPlaceOnly: boolean
    subscriberPhones:      Array<{
        id:          number
        number:      string
        numberValid: boolean
    }>
    checkPhoneForSvcActivation: boolean
    allowAddPhone:              boolean
}

// https://myhome.proptech.ru/rest/v1/subscribers/profiles/finances?placeId=1234567
export type SubscriberProfileFinances = {
    balance:       number
    blockType:     'NOT_BLOCKED'
    amountSum:     number
    targetDate:    string
    paymentLink:   string | null
    daysToBlock:   null
    daysToWarning: null
    blocked:       boolean
}

export type SubscriberProfilePlace = {
    subscriber:        Subscriber
    type:              'owner' | 'guest'
    state:             'in'
    subscriberPlaceId: number
}

// https://myhome.proptech.ru/rest/v1/subscribers/profiles/places/1234567
export type SubscriberProfilePlaces = SubscriberProfilePlace[]

export type SubscriberPlace = {
    id:              number
    subscriberType:  'owner' | 'guest'
    subscriberState: 'in'
    place:           Place
    subscriber:      Subscriber
    guardCallOut:    any | null
    payment: {
        useLink: boolean
    }
    blocked:  boolean
    provider: string
}

export type SubscriberPlaces = SubscriberPlace[]