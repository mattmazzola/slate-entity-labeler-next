export enum LabelMode {
    EditText = 'EditText',
    Label = 'Label'
}

export enum DebugMode {
    Normal = 'Normal',
    Debug = 'Debug'
}

export type EntityData = {
    name: string
    text: string
}

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
    id: string
    data: T
}

export interface IEntityPlaceholder<T> {
    type: TokenType.EntityPlaceholder
    entity: IEntity<T>
    tokens: IToken[]
}

export type TokenOrEntity<T> = IToken | IEntityPlaceholder<T>
