export enum TokenType {
    Token = "token",
    EntityPlaceholder = "entityPlaceholder"
}

export interface IToken {
    type: TokenType.Token
    text: string
    isSelectable: boolean
    startIndex: number
}

export interface IEntity<T> {
    startTokenIndex: number
    tokenLength: number
    data: T
}

// This is a marker for entity before it is confirmed by the user
// Normal entities have tokens as children, but these entities only mark the tokens with an entity
// This mean they do not change the value or DOM structure
export interface IEntityPlaceholder {
    type: TokenType.EntityPlaceholder
    entity: IEntity<unknown>
    tokens: IToken[]
}

export type TokenOrEntity = IToken | IEntityPlaceholder
