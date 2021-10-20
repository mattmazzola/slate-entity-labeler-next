import { Editor, Element, BaseText, Text, Transforms, BaseEditor, Node } from 'slate'
import { ReactEditor } from 'slate-react'

export type CustomElement = {
    type: 'paragraph' | 'entity'
    children: (CustomText | CustomElement)[]
}

export type CustomText = BaseText & {
    type?: 'entity'
    bold?: boolean
}

export type CustomEditor = ReactEditor & BaseEditor

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor
        Element: CustomElement
        Text: CustomText
    }
}

export const CustomEditor = {
    ...Editor,

    isEntity(editor: CustomEditor) {
        const [match] = CustomEditor.nodes(editor, {
            match: n => (n as CustomElement).type === 'entity',
        })

        return Boolean(match)
    },

    toggleBlockEntity(editor: CustomEditor) {
        Transforms.wrapNodes(
            editor,
            { type: 'entity' } as CustomElement,
            { split: true }
        )
    }
}

export const withLabels = (editor: CustomEditor) => {
    const { isInline } = editor

    editor.isInline = (element: CustomElement) => {
        switch (element.type) {
            case 'entity': {
                console.log({ element })
                return true
            }
        }

        return isInline(element)
    }

    return editor
}

export const serialize = (value: CustomElement[]) => {
    return (
        value
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
    )
}

export const deserialize = (value: string) => {
    // Return a value array of children derived by splitting the string.
    return value.split('\n')
        .map(line => {
            return {
                children: [{ text: line }],
            }
        })
}

export const debounce = <T extends (...args: any[]) => any>(fn: T, time: number) => {
    let timeoutId: NodeJS.Timeout

    const debouncedFn = (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            fn(...args)
        }, time)
    }

    return debouncedFn
}

export interface IToken {
    text: string
    isSelectable: boolean
    startIndex: number
    endIndex: number
    length: number
}

/**
 * Note: this is more like a negative match used to determine characters that split the string instead of
 * positive match would specify characters which are tokens. Only chose this because it seems like a much
 * simpler regex / smaller set of characters, but I imagine alternative approach would work
 */
export const tokenizeRegex = /\s+|[.?,!]/g

export const tokenizeText = (text: string, tokenRegex: RegExp): IToken[] => {
    const tokens: IToken[] = []
    if (text.length === 0) {
        return tokens
    }

    let result: RegExpExecArray | null = null
    let lastIndex = tokenRegex.lastIndex
    // tslint:disable-next-line:no-conditional-assignment
    while ((result = tokenRegex.exec(text)) !== null) {
        const matchedText = text.substring(lastIndex, result.index)
        tokens.push(...[
            {
                text: matchedText,
                isSelectable: true,
                startIndex: lastIndex,
                endIndex: result.index,
                length: matchedText.length
            },
            {
                text: result[0],
                isSelectable: false,
                startIndex: result.index,
                endIndex: result.index + result[0].length,
                length: result[0].length
            }
        ])

        lastIndex = tokenRegex.lastIndex
    }

    const endIndex = text.length
    const endText = text.substring(lastIndex, endIndex)
    tokens.push({
        text: endText,
        isSelectable: true,
        startIndex: lastIndex,
        endIndex,
        length: endText.length
    })

    return tokens
}

export interface IEntity<T> {
    startIndex: number
    endIndex: number
    length: number
    data: T
}

interface IEntityWithTokenIndices extends IEntity<unknown> {
    startTokenIndex: number
    endTokenIndex: number
}

/**
 * Used for conversion of text and custom entities. For proper usage within extractor editor we need to tokenize the text.
 * This is what makes it different from the below method which doesn't need to be tokenized.
 *
 * @param text plain text
 * @param customEntities array of entities
 */
export const convertEntitiesAndTextToTokenizedEditorValue = (text: string, customEntities: IEntity<unknown>[], inlineNodeType: string) => {
    const normalizedEntities = normalizeEntities(customEntities)
    const tokenizedText = tokenizeText(text, tokenizeRegex)
    const labeledTokens = labelTokens(tokenizedText, normalizedEntities)
    // TODO: Support multi-line (multiple token arrays)
    return convertToSlateValue([labeledTokens])
}

export const normalizeEntities = <T>(x: T): T => { return x }

interface IEntityPlaceholder {
    entity: IEntity<unknown>
    tokens: IToken[]
}

export type TokenArray = (IToken | IEntityPlaceholder)[]

export const labelTokens = (tokens: IToken[], customEntities: IEntity<unknown>[]): TokenArray => {
    const entitiesWithTokenIndices = addTokenIndicesToCustomEntities(tokens, customEntities)
    return wrapTokensWithEntities(tokens, entitiesWithTokenIndices)
}

/**
 * Similar to findIndex, but finds last index by iterating array items from end/right instead of start/left
 * @param xs Array
 * @param f Predicate function
 */
export const findLastIndex = <T>(xs: T[], f: (x: T) => boolean): number => {
    // tslint:disable-next-line:no-increment-decrement
    for (let i = xs.length - 1; i >= 0; i--) {
        if (f(xs[i])) {
            return i
        }
    }

    return -1
}

/**
 * For each customEntity, find the indicies of the start and end tokens within the entity boundaries
 *
 *         [   custom entity  ]
 * [token0 token1 token2 token3 token4 token5]
 *         [1,               3]
 *
 * @param tokens Array of Tokens
 * @param customEntities Array of Custom Entities
 */
export const addTokenIndicesToCustomEntities = (tokens: IToken[], customEntities: IEntity<unknown>[]): IEntityWithTokenIndices[] => {
    return customEntities.map<IEntityWithTokenIndices>(ce => {
        const startTokenIndex = tokens.findIndex(t => t.isSelectable === true && ce.startIndex < t.endIndex && t.endIndex <= ce.endIndex)
        const endTokenIndex = findLastIndex(tokens, t => t.isSelectable === true && ce.startIndex <= t.startIndex && t.startIndex < ce.endIndex)
        if (startTokenIndex === -1 || endTokenIndex === -1) {
            console.warn(`Could not find valid token for custom entity: `, ce)
        }

        //         if (startTokenIndex !== -1 && endTokenIndex !== -1) {
        //             const startToken = tokens[startTokenIndex]
        //             const endToken = tokens[endTokenIndex]

        //             console.log(`
        // token indices found:
        // ce.startIndex: ${ce.startIndex}
        // ce.endIndex: ${ce.endIndex}

        // startTokenIndex: ${startTokenIndex}
        // startToken.isSelectable: ${startToken.isSelectable}
        // startToken.startIndex: ${startToken.startIndex}
        // startToken.endIndex: ${startToken.endIndex}

        // endTokenIndex: ${endTokenIndex}
        // endToken.isSelectable: ${endToken.isSelectable}
        // endToken.startIndex: ${endToken.startIndex}
        // endToken.endIndex: ${endToken.endIndex}
        // `)
        //         }

        return {
            ...ce,
            startTokenIndex,
            endTokenIndex: endTokenIndex + 1
        }
    })
}


/**
 * (IToken[], ICustomEntityWithTokenIndicies[]) => (IToken | IEntityPlaceholder)[]
 * Given tokens and custom entities associated with tokens, replace tokens with entities placeholders
 * These entity placeholders eventually get converted to slate inline segments
 *
 * Simplified visual
 * [token0, token1, token2, token3, token4, token5, token6], [{token6, [1, 3]}]
 * [token0, [token1, token2, token3], token4, token5, token6]
 *
 * @param tokens Array of Tokens
 * @param customEntitiesWithTokens Array of Custom Entities with Token Indicies
 */
export const wrapTokensWithEntities = (tokens: IToken[], customEntitiesWithTokens: IEntityWithTokenIndices[]): TokenArray => {
    // If there are no entities than no work to do, return tokens
    if (customEntitiesWithTokens.length === 0) {
        return tokens
    }

    const sortedCustomEntities = [...customEntitiesWithTokens].sort((a, b) => a.startIndex - b.startIndex)
    // Include all non labeled tokens before first entity
    const firstCet = sortedCustomEntities[0]
    const tokenArray: TokenArray = [...tokens.slice(0, firstCet.startTokenIndex)]

    for (const [i, cet] of Array.from(sortedCustomEntities.entries())) {
        // push labeled tokens
        tokenArray.push({
            entity: cet,
            tokens: tokens.slice(cet.startTokenIndex, cet.endTokenIndex)
        })

        // push non labeled tokens in between this and next entity
        if (i !== sortedCustomEntities.length - 1) {
            const nextCet = sortedCustomEntities[i + 1]
            tokenArray.push(...tokens.slice(cet.endTokenIndex, nextCet.startTokenIndex))
        }
    }

    // Include all non labeled tokens after last entity
    const lastCet = sortedCustomEntities[sortedCustomEntities.length - 1]
    tokenArray.push(...tokens.slice(lastCet.endTokenIndex))

    return tokenArray
}

export const defaultValue: CustomElement[] = [
    {
        type: 'paragraph',
        children: [
            {
                text: ''
            },
        ],
    }
]

export const convertToSlateValue = (tokensWithEntities: TokenArray[]): CustomElement[] => {
    // If there are no tokens, just return empty text node to ensure valid SlateValue object
    // In other words non-void parent nodes must have a child.
    if (tokensWithEntities.length === 0) {
        return defaultValue
    }
    
    const elements: CustomElement[] = []

    for (const tokenOrEntityRow of tokensWithEntities) {

        const children: CustomElement[] = []
        for (const tokenOrEntity of tokenOrEntityRow) {

            if ((tokenOrEntity as IEntityPlaceholder).entity) {
                const entityPlaceholder: IEntityPlaceholder = tokenOrEntity as any
                const nestedNodes = convertToSlateNodes(entityPlaceholder.tokens, inlineNodeType)
                elements.push({
                    "kind": "inline",
                    "type": inlineNodeType,
                    "isVoid": false,
                    "data": entityPlaceholder.entity.data,
                    "nodes": nestedNodes
                })
            }
            else {
                const token: IToken = tokenOrEntity as any
                if (token.isSelectable) {
                    elements.push({
                        "kind": "inline",
                        "type": models.NodeType.TokenNodeType,
                        "isVoid": false,
                        "data": token,
                        "nodes": [
                            {
                                "kind": "text",
                                "leaves": [
                                    {
                                        "kind": "leaf",
                                        "text": token.text,
                                        "marks": []
                                    }
                                ]
                            }
                        ]
                    })
                }
                else {
                    elements.push({
                        "kind": "text",
                        "leaves": [
                            {
                                "kind": "leaf",
                                "text": token.text,
                                "marks": []
                            }
                        ]
                    })
                }
            }
        }

        const paragraphElement: CustomElement = {
            type: 'paragraph',
            children
        }

        elements.push(paragraphElement)

    }

    return elements
}

/**
 * Compare every entity to every other entity. If any have overlapping indices then log warning.
 * 
 * @param customEntities List of custom entities
 */
export const warnAboutOverlappingEntities = (customEntities: IEntity<object>[]): boolean => {
    return customEntities.some((entity, i) => {
        return customEntities
            .slice(i + 1)
            .some((otherEntity, _, es) => {
                // Overlap start index
                //  [ other entity ]
                //            [ entity ]
                const overlapStartIndex = (otherEntity.startIndex <= entity.startIndex
                    && otherEntity.endIndex >= entity.startIndex)
                // Overlap end index
                //    [ other entity ]
                // [entity]
                const overlapEndIndex = (otherEntity.startIndex <= entity.endIndex
                    && otherEntity.endIndex >= entity.endIndex)

                const overlap = overlapStartIndex || overlapEndIndex

                if (overlap) {
                    console.warn(`Custom entities have overlap. Overlapping entities will be discarded to allow proper rendering in UI but this is a bug.`, customEntities)
                }

                return overlap
            })
    })
}
