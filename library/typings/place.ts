export type Place = {
    id: number
    address: {
        index:          string | null
        region:         string | null
        district:       string | null
        city:           string | null
        locality:       string | null
        street:         string | null
        house:          string | null
        building:       string | null
        apartment:      string | null
        visibleAddress: string
        groupName:      string
    }
    location: {
        longitude: number
        latitude:  number
    }
    autoArmingState:  boolean
    autoArmingRadius: number
}