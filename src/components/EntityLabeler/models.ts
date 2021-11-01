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

export interface Token {
    type: TokenType.Token
    text: string
    isSelectable: boolean
    startCharIndex: number
    tokenIndex: number
}

export interface LabeledEntity<T> {
    startTokenIndex: number
    tokenLength: number
    id: string
    data: T
}

export interface EntityPlaceholder<T> {
    type: TokenType.EntityPlaceholder
    entity: LabeledEntity<T>
    tokens: Token[]
}

export type TokenOrEntity<T> = Token | EntityPlaceholder<T>

export type Entity = {
    id: string
    name: string
}

export type Option = {
    id: string
    name: string
}
