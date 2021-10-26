export enum TokenType {
    Token = "token",
    EntityPlaceholder = "entityPlaceholder"
}

export interface IToken {
    type: TokenType.Token
    text: string
    isSelectable: boolean
    startCharIndex: number
    tokenIndex: number
}

export interface IEntity<T> {
    startTokenIndex: number
    tokenLength: number
    data: T
}

export interface IEntityPlaceholder {
    type: TokenType.EntityPlaceholder
    entity: IEntity<unknown>
    tokens: IToken[]
}

export type TokenOrEntity = IToken | IEntityPlaceholder
